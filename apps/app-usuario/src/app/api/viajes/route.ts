import { registrarConsentimientoUsuario } from "@ruum/api/services";
import { verificacionTelefonoSuspendida } from "@/lib/phone-verification";
import { normalizarDispositivo } from "@/lib/device-id";
import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { esquemaSolicitudTraslado } from "@ruum/shared/validacion";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { logStructuredError } from "@/lib/logger";
import { verificarCsrfORechazar } from "@/lib/csrf";
import { logStructuredWarn } from "@/lib/logger";
import {
  hashPseudonimoViajes,
  VIAJES_CREAR_LIMITES,
  VIAJES_CREAR_VENTANA_MS,
} from "@/lib/viajes-policy";
import { createHash } from "node:crypto";
import { RutaNoDisponibleError } from "@/lib/ruta-cache";
import { resolverRutaSolicitudServidor, UbicacionDivergenteError } from "@/lib/ruta-solicitud-servidor";
import { getRedis } from "@/lib/csp-rate-limit";
import { cotizarSolicitudIndividual } from "@/lib/cotizacion-individual-servidor";
import { construirPayloadCreacion } from "@/app/viajes/nuevo/adapters";
import type { DatosFormulario } from "@/app/viajes/nuevo/types";
import {
  registrarDivergenciaTarifa,
} from "@/lib/tarifa-snapshot";

/** Mensaje de un RAISE EXCEPTION de PL/pgSQL (SQLSTATE P0001), si lo es. */
function mensajeErrorNegocioBase(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const { code, message } = err as { code?: unknown; message?: unknown };
  if (code !== "P0001" || typeof message !== "string" || !message.trim()) return null;
  return message.trim().slice(0, 300);
}

// Sec3: validación servidor del wizard — rechazar si paso < 4 (PASOS.length = 4)
// El cliente no debe poder crear traslado enviando paso 0 como si fuera paso 5.
const PASOS_REQUERIDOS = 4;

export async function POST(request: NextRequest) {
  try {
    const rechazoCsrf = verificarCsrfORechazar(request);
    if (rechazoCsrf) return rechazoCsrf;

    const cliente = await crearClienteServidor();
    const { data: { user } } = await cliente.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!verificacionTelefonoSuspendida() && user.user_metadata?.telefono_verificado === false) {
      return NextResponse.json(
        { error: "Verifica tu número de teléfono antes de solicitar tu primer traslado.", codigo: "telefono_no_verificado" },
        { status: 403 }
      );
    }

    // RUUM-USR-F6-001 (CA-9 / T10): Rate limit de creación con clave compuesta de F3
    // sobre Redis de F2 (IP + cuenta + dispositivo)
    const userHash = hashPseudonimoViajes(user.id);
    // Sin IP confiable se omite esa dimensión (null), como en el resto de
    // endpoints: "127.0.0.1" convertía la dimensión en un bucket global.
    const ip = obtenerIp(request);
    const dispositivo = normalizarDispositivo(request.headers.get("x-device-id"));

    const [rlIp, rlCuenta, rlDevice] = await Promise.all([
      rateLimitConVentana(ip, "viajes-crear-ip", VIAJES_CREAR_LIMITES.ip, VIAJES_CREAR_VENTANA_MS),
      rateLimitConVentana(userHash, "viajes-crear-cuenta", VIAJES_CREAR_LIMITES.cuenta, VIAJES_CREAR_VENTANA_MS),
      dispositivo
        ? rateLimitConVentana(hashPseudonimoViajes(dispositivo), "viajes-crear-device", VIAJES_CREAR_LIMITES.dispositivo, VIAJES_CREAR_VENTANA_MS)
        : { allowed: true, retryAfterSec: undefined },
    ]);

    const bloqueado = !rlIp.allowed || !rlCuenta.allowed || !rlDevice.allowed;
    if (bloqueado) {
      const retryAfter = Math.max(
        rlIp.retryAfterSec ?? 60,
        rlCuenta.retryAfterSec ?? 60,
        rlDevice.retryAfterSec ?? 60
      );
      logStructuredWarn("api/viajes", "viajes_crear_rate_limited", undefined, {
        userIdHash: userHash,
        dimensiones: [
          !rlIp.allowed && "ip",
          !rlCuenta.allowed && "cuenta",
          !rlDevice.allowed && "dispositivo",
        ].filter(Boolean),
      });
      return NextResponse.json(
        { error: "Demasiadas solicitudes de traslado. Por favor espera unos minutos." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // Sec3: validar paso — soporta 0-3 (índice) o 1-4 (contador). Normalizamos a contador 1-4.
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

    /* Validación completa del payload con esquema compartido (defensa en profundidad). */
    const parsed = esquemaSolicitudTraslado.safeParse({
      ...body,
      vehiculoSeleccionadoId: (body as Record<string, unknown>).vehiculoSeleccionadoId ?? "",
      vehiculosUsuarioIds: (body as Record<string, unknown>).vehiculosUsuarioIds ?? [],
      zonaHoraria: (body as Record<string, unknown>).zonaHoraria ?? "America/Mexico_City",
      paradas: (body as Record<string, unknown>).paradas ?? [],
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de traslado inválidos", detalles: parsed.error.issues.slice(0, 3).map((i) => i.message) },
        { status: 400 }
      );
    }

    /* Verificación de propiedad del vehículo en BD (RLS) */
    if (parsed.data.vehiculoSeleccionadoId) {
      const { listarVehiculosDeUsuario, obtenerUsuarioActual } = await import("@ruum/api/services");

      let perfil: { id: string } | null = null;
      try {
        perfil = await obtenerUsuarioActual(cliente);
      } catch (errorPerfil) {
        console.warn("[api/viajes] no se pudo obtener el perfil del usuario", { usuario: user.id, errorPerfil });
      }

      if (!perfil) {
        return NextResponse.json(
          { error: "No se pudo verificar la propiedad del vehículo." },
          { status: 500 }
        );
      }

      const propios = await listarVehiculosDeUsuario(cliente, perfil.id);
      const esPropio = propios.some((v) => v.id === parsed.data.vehiculoSeleccionadoId);
      if (!esPropio) {
        console.warn("[api/viajes] vehiculo no pertenece al usuario", { usuario: user.id, perfil: perfil.id });
        return NextResponse.json(
          { error: "El vehículo seleccionado no pertenece al usuario." },
          { status: 403 }
        );
      }
    }

    // Resolver las direcciones en servidor: nunca usar coordenadas ni precio del navegador.
    const tipo = (body as Record<string, unknown>).tipo;
    if (!["sedan", "suv", "pick_up", "van", "luxury", "coleccion"].includes(String(tipo))) {
      return NextResponse.json({ error: "Tipo de vehículo inválido." }, { status: 400 });
    }
    const textoOpcional = (campo: string) => {
      const valor = (body as Record<string, unknown>)[campo];
      return typeof valor === "string" ? valor : "";
    };
    const formulario: DatosFormulario = {
      ...parsed.data,
      // La condición declarada no abarata el servicio: el usuario solo puede
      // indicar rescate mecánico; el resto se cotiza como seminueva y solo
      // Torre de Control cambia la condición registrada.
      condicion: parsed.data.condicion === "rescate_mecanico" ? "rescate_mecanico" : "seminueva",
      tipo: tipo as DatosFormulario["tipo"],
      origenReferencias: textoOpcional("origenReferencias"),
      destinoReferencias: textoOpcional("destinoReferencias"),
      instruccionesEspeciales: textoOpcional("instruccionesEspeciales"),
      ventanaRecoleccion: textoOpcional("ventanaRecoleccion"),
      ventanaEntrega: textoOpcional("ventanaEntrega"),
      paradas: parsed.data.paradas.map((p, i) => ({ ...p, id: String(i), referencias: p.referencias ?? "" })),
    };
    // Reutiliza la cotización vigente ante reintentos de la misma solicitud
    // (misma clave de idempotencia y mismo contenido): evita recotizar y
    // repetir hasta 10 geocodificaciones de Mapbox por reintento.
    const claveIdempotencia = typeof body.claveIdempotencia === "string" && /^[0-9a-f-]{36}$/i.test(body.claveIdempotencia)
      ? body.claveIdempotencia
      : null;
    const huellaSolicitud = createHash("sha256")
      .update(JSON.stringify({ ...body, paso: undefined, wizardPaso: undefined, step: undefined }))
      .digest("hex")
      .slice(0, 32);
    const claveCotizacion = claveIdempotencia ? `cotizacion:v1:${userHash}:${claveIdempotencia}:${huellaSolicitud}` : null;
    const redis = claveCotizacion ? getRedis() : null;
    if (redis && claveCotizacion) {
      try {
        const previa = await redis.get<Record<string, unknown>>(claveCotizacion);
        const expira = Date.parse(String((previa?.snapshot as { expiraEn?: string } | undefined)?.expiraEn ?? ""));
        if (previa && Number.isFinite(expira) && expira - Date.now() > 60_000) {
          return NextResponse.json({ ...previa, reutilizada: true }, { status: 200 });
        }
      } catch {
        // La caché nunca bloquea la cotización.
      }
    }

    const numeroOpcional = (campo: string) => {
      const valor = (body as Record<string, unknown>)[campo];
      return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
    };
    const pin = (lat: number | null, lng: number | null) => (lat !== null && lng !== null ? { lat, lng } : null);
    const rutaRecalculada = await resolverRutaSolicitudServidor(
      parsed.data,
      {
        origen: pin(numeroOpcional("origenLat"), numeroOpcional("origenLng")),
        destino: pin(numeroOpcional("destinoLat"), numeroOpcional("destinoLng")),
      },
      (body as Record<string, unknown>).confirmarUbicacionPin === true
    );
    const payload = construirPayloadCreacion(
      formulario,
      parsed.data.vehiculoSeleccionadoId,
      rutaRecalculada,
      parsed.data.zonaHoraria
    );
    const solicitud = await cotizarSolicitudIndividual(user.id, payload);
    const snapshot = solicitud.traslado.snapshot_tarifa as { monto: number };
    const montoCalculado = snapshot.monto;

    // Detectar y registrar divergencia si el cliente envió datos manipulados (T4 / CA-1 / CA-C4)
    const clienteDistancia = typeof (body as Record<string, unknown>).distanciaKm === "number"
      ? (body as Record<string, unknown>).distanciaKm as number
      : null;
    const clienteMonto = typeof (body as Record<string, unknown>).precioCotizado === "number"
      ? (body as Record<string, unknown>).precioCotizado as number
      : null;

    const evaluacionDivergencia = registrarDivergenciaTarifa(
      { distanciaKm: clienteDistancia, monto: clienteMonto },
      { distanciaKm: rutaRecalculada.distanciaKm, tiempoHoras: rutaRecalculada.tiempoEstimadoHoras, monto: montoCalculado },
      user.id
    );

    if (evaluacionDivergencia.accionOperativa === "rechazo_bloqueo") {
      return NextResponse.json(
        { error: "Divergencia crítica detectada en los parámetros de ruta y tarifa. Por favor actualiza la cotización." },
        { status: 400 }
      );
    }

    // CB-3 / T9 / CA-8: Consentimiento vía escritor canónico de F2.
    // Obligatorio: sin evidencia de aceptación de las políticas de pago y
    // cancelación no se emite cotización (antes un fallo solo dejaba un aviso).
    try {
      await registrarConsentimientoUsuario(cliente, {
        version: 1,
        canal: "web",
        versionApp: "1.0.0",
      });
    } catch (errConsent) {
      logStructuredError("api/viajes", "registro_consentimiento_canonico_fallido", errConsent, {
        userIdHash: userHash,
      });
      return NextResponse.json(
        { error: "No pudimos registrar tu aceptación de las políticas de pago y cancelación. Intenta de nuevo en unos momentos." },
        { status: 503, headers: { "Retry-After": "30" } }
      );
    }

    const respuesta = {
      ok: true,
      pasoValidado: pasoContador,
      recalculo: {
        distanciaKm: rutaRecalculada.distanciaKm,
        tiempoEstimadoHoras: rutaRecalculada.tiempoEstimadoHoras,
        precioCotizado: montoCalculado,
        fuente: rutaRecalculada.fuente,
      },
      // El nonce solo autoriza el payload exacto guardado en la base de datos.
      snapshot: solicitud.traslado.snapshot_tarifa,
      solicitud,
    };
    if (redis && claveCotizacion) {
      try {
        // La cotización vive 15 min en la base; la caché nunca la sobrevive.
        await redis.set(claveCotizacion, respuesta, { ex: 14 * 60 });
      } catch {
        // best effort
      }
    }
    return NextResponse.json(respuesta, { status: 200 });
  } catch (err) {
    if (err instanceof UbicacionDivergenteError) {
      return NextResponse.json(
        {
          error: err.message,
          codigo: err.confirmable ? "ubicacion_requiere_confirmacion" : "ubicacion_incoherente",
          punto: err.punto,
          distanciaM: Math.round(err.distanciaM),
        },
        { status: 409 }
      );
    }
    if (err instanceof RutaNoDisponibleError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    // Las validaciones de negocio de la base (RAISE EXCEPTION → código P0001)
    // traen un mensaje pensado para el usuario: se devuelve tal cual con 422
    // en vez de esconderlo detrás de un 500 genérico.
    const mensajeNegocio = mensajeErrorNegocioBase(err);
    if (mensajeNegocio) {
      console.warn("[api/viajes] rechazo de negocio", mensajeNegocio);
      return NextResponse.json({ error: mensajeNegocio }, { status: 422 });
    }
    console.warn("[api/viajes] error", err);
    return NextResponse.json({ error: "No se pudo procesar la solicitud. Intenta de nuevo más tarde." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
