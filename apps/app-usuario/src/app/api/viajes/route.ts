import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { esquemaSolicitudTraslado } from "@ruum/shared/validacion";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";

// Sec3: validación servidor del wizard — rechazar si paso < 4 (PASOS.length = 4)
// El cliente no debe poder crear traslado enviando paso 0 como si fuera paso 5.
const PASOS_REQUERIDOS = 4;

/* CORRECCIÓN (auditoría S-7): este endpoint no tenía rate limit, a diferencia de
   /api/csp-report. El wizard reintenta en cada paso. */
const MAX_POR_MINUTO = 60;
const VENTANA_MS = 60_000;

function esPasoValido(paso: unknown): boolean {
  const n = typeof paso === "string" ? Number(paso) : typeof paso === "number" ? paso : NaN;
  return Number.isInteger(n) && n >= PASOS_REQUERIDOS;
}

export async function POST(request: NextRequest) {
  try {
    const cliente = await crearClienteServidor();
    const { data: { user } } = await cliente.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    /* A2: el bucket principal es por usuario autenticado, no por IP sin validar.
       Con IP como única clave, todos los clientes sin cabecera confiable
       compartían un bucket de 60 req/min: uno solo podía negarle el servicio
       a los demás. La IP (validada por plataforma) queda como segunda capa. */
    const porUsuario = await rateLimitConVentana(
      `uid:${user.id}`,
      "api-viajes-usuario",
      MAX_POR_MINUTO,
      VENTANA_MS
    );
    if (!porUsuario.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
        { status: 429, headers: { "Retry-After": String(porUsuario.retryAfterSec ?? 60) } }
      );
    }

    const ip = obtenerIp(request);
    if (ip) {
      const porIp = await rateLimitConVentana(ip, "api-viajes-ip", MAX_POR_MINUTO, VENTANA_MS);
      if (!porIp.allowed) {
        return NextResponse.json(
          { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
          { status: 429, headers: { "Retry-After": String(porIp.retryAfterSec ?? 60) } }
        );
      }
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // Sec3: validar paso — soporta 0-3 (índice) o 1-4 (contador). Normalizamos a contador 1-4.
    // Si el cliente manda paso índice 0-3, lo convertimos a contador +1.
    // Si manda paso contador 1-4, lo usamos directo. En ambos casos, <4 es incompleto.
    const rawPaso = (body as Record<string, unknown>).paso
      ?? (body as Record<string, unknown>).wizardPaso
      ?? (body as Record<string, unknown>).step;
    let pasoContador: number | null = null;
    if (typeof rawPaso === "number" && Number.isInteger(rawPaso)) {
      pasoContador = rawPaso <= 3 ? rawPaso + 1 : rawPaso; // 0-3 -> 1-4
    } else if (typeof rawPaso === "string" && /^\d+$/.test(rawPaso)) {
      const n = Number(rawPaso);
      pasoContador = n <= 3 ? n + 1 : n;
    }

    if (pasoContador === null || pasoContador < PASOS_REQUERIDOS) {
      console.warn("[api/viajes] wizard incompleto rechazado", { paso: rawPaso, usuario: user.id });
      return NextResponse.json(
        { error: "Solicitud incompleta: debes completar todos los pasos del wizard." },
        { status: 400 }
      );
    }

    /* Validación completa del payload con esquema compartido (defensa en profundidad).
       CORRECCIÓN (auditoría S-7): antes solo validaba si venía "marca" u
       "origenCodigoPostal", así que un body { paso: 4 } se saltaba el zod por
       completo. Ahora se aplica el esquema siempre, con defaults. */
    const parsed = esquemaSolicitudTraslado.safeParse({
      ...body,
      // defaults para campos no enviados por el API pero requeridos por el esquema
      vehiculoSeleccionadoId: (body as Record<string, unknown>).vehiculoSeleccionadoId ?? "",
      vehiculosUsuarioIds: (body as Record<string, unknown>).vehiculosUsuarioIds ?? [],
      zonaHoraria: (body as Record<string, unknown>).zonaHoraria ?? "America/Mexico_City",
      aceptaPoliticas: (body as Record<string, unknown>).aceptaPoliticas ?? true,
      paradas: (body as Record<string, unknown>).paradas ?? [],
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de traslado inválidos", detalles: parsed.error.issues.slice(0, 3).map((i) => i.message) },
        { status: 400 }
      );
    }

    /* M10: el superRefine de Zod solo comprueba vehiculoSeleccionadoId contra
       vehiculosUsuarioIds, un array que envía el propio cliente. La pertenencia
       real se verifica aquí contra la BD (RLS): un id ajeno o inventado se
       rechaza con 403 aunque venga en el array del cliente. */
    if (parsed.data.vehiculoSeleccionadoId) {
      const { listarVehiculosDeUsuario } = await import("@ruum/api/services");
      const propios = await listarVehiculosDeUsuario(cliente, user.id);
      const esPropio = propios.some((v) => v.id === parsed.data.vehiculoSeleccionadoId);
      if (!esPropio) {
        console.warn("[api/viajes] vehiculo no pertenece al usuario", { usuario: user.id });
        return NextResponse.json(
          { error: "El vehículo seleccionado no pertenece al usuario." },
          { status: 403 }
        );
      }
    }

    // Si la validación pasa, el cliente debe usar el flujo normal (RPC) o este endpoint puede crear directamente.
    // Por ahora retornamos 200 para indicar que el paso fue validado; la creación real sigue vía RPC con validación de esquema.
    return NextResponse.json({ ok: true, pasoValidado: pasoContador }, { status: 200 });
  } catch (err) {
    console.warn("[api/viajes] error", err);
    // Sec2: mensaje genérico, nunca exponer env vars ni detalles internos
    return NextResponse.json({ error: "No se pudo procesar la solicitud. Intenta de nuevo más tarde." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
