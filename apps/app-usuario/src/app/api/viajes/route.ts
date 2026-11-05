import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { esquemaSolicitudTraslado } from "@ruum/shared/validacion";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { verificarCsrfORechazar } from "@/lib/csrf";
import { logStructuredWarn } from "@/lib/logger";
import {
  hashPseudonimoViajes,
  VIAJES_CREAR_LIMITES,
  VIAJES_CREAR_VENTANA_MS,
} from "@/lib/viajes-policy";
import { obtenerRutaRecalculadaServidor } from "@/lib/ruta-cache";
import {
  calcularTarifaServidor,
  generarSnapshotFirmado,
  registrarDivergenciaTarifa,
  type InputsTarifaSnapshot,
} from "@/lib/tarifa-snapshot";

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

    // RUUM-USR-F6-001 (CA-9 / T10): Rate limit de creación con clave compuesta de F3
    // sobre Redis de F2 (IP + cuenta + dispositivo)
    const userHash = hashPseudonimoViajes(user.id);
    const ip = obtenerIp(request) || "127.0.0.1";
    const deviceIdRaw = request.headers.get("x-device-id") || "";
    const deviceHash = hashPseudonimoViajes(deviceIdRaw);

    const [rlIp, rlCuenta, rlDevice] = await Promise.all([
      rateLimitConVentana(ip, "viajes-crear-ip", VIAJES_CREAR_LIMITES.ip, VIAJES_CREAR_VENTANA_MS),
      rateLimitConVentana(userHash, "viajes-crear-cuenta", VIAJES_CREAR_LIMITES.cuenta, VIAJES_CREAR_VENTANA_MS),
      rateLimitConVentana(deviceHash, "viajes-crear-device", VIAJES_CREAR_LIMITES.dispositivo, VIAJES_CREAR_VENTANA_MS),
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

    // RUUM-USR-F6-001 (CB-1 / CA-1 / T1 / T11): Recálculo server-side de ruta y monto como fuente de verdad
    const origenCoords = {
      lat: Number((body as Record<string, unknown>).origenLat ?? 19.385),
      lng: Number((body as Record<string, unknown>).origenLng ?? -99.165),
    };
    const destinoCoords = {
      lat: Number((body as Record<string, unknown>).destinoLat ?? 19.428),
      lng: Number((body as Record<string, unknown>).destinoLng ?? -99.167),
    };
    const paradasCoords = (parsed.data.paradas ?? [])
      .filter((p: unknown) => typeof (p as Record<string, unknown>)?.lat === "number" && typeof (p as Record<string, unknown>)?.lng === "number")
      .map((p: unknown) => ({
        lat: Number((p as Record<string, unknown>).lat),
        lng: Number((p as Record<string, unknown>).lng),
      }));

    const rutaRecalculada = await obtenerRutaRecalculadaServidor(
      origenCoords,
      destinoCoords,
      paradasCoords
    );

    // Resolver catálogo vehicular para cálculo oficial
    let categoriaTarifa: "ligero_a" | "ligero_b" | "mediano" | "camion" = "ligero_b";
    let gama: "entrada" | "media" | "alta" | "premium" = "media";

    try {
      if (typeof cliente.rpc === "function") {
        const { data: catData } = await cliente.rpc("catalogar_vehiculo_para_tarifa", {
          p_marca: parsed.data.marca,
          p_modelo: parsed.data.modelo,
        });
        const primerRegistro = Array.isArray(catData) ? catData[0] : catData;
        if (primerRegistro && typeof primerRegistro === "object" && "categoria_tarifa" in primerRegistro) {
          const cat = primerRegistro as { categoria_tarifa?: "ligero_a" | "ligero_b" | "mediano" | "camion"; gama?: "entrada" | "media" | "alta" | "premium" };
          if (cat.categoria_tarifa) {
            categoriaTarifa = cat.categoria_tarifa;
          }
          if (cat.gama) {
            gama = cat.gama;
          }
        }
      }
    } catch {
      // Usar defaults de catálogo
    }

    // Calcular tarifa oficial server-side
    const montoCalculado = calcularTarifaServidor({
      categoria: categoriaTarifa,
      gama,
      condicion: parsed.data.condicion,
      distanciaKm: rutaRecalculada.distanciaKm,
      tiempoEstimadoHoras: rutaRecalculada.tiempoEstimadoHoras,
      modalidad: parsed.data.modalidadProgramacion,
      fechaHoraProgramada: parsed.data.fechaHoraProgramada,
    });

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

    // Generar snapshot firmado con TTL 15 min y anti-replay (T2, T3, CA-2, CA-3)
    const inputsSnapshot: InputsTarifaSnapshot = {
      origenCodigoPostal: parsed.data.origenCodigoPostal,
      destinoCodigoPostal: parsed.data.destinoCodigoPostal,
      origenCoords,
      destinoCoords,
      paradasCount: (parsed.data.paradas ?? []).length,
      categoria: categoriaTarifa,
      gama,
      condicion: parsed.data.condicion,
      modalidad: parsed.data.modalidadProgramacion,
      fechaProgramada: parsed.data.fechaHoraProgramada,
      distanciaKm: rutaRecalculada.distanciaKm,
      tiempoEstimadoHoras: rutaRecalculada.tiempoEstimadoHoras,
    };

    const snapshotFirmado = generarSnapshotFirmado(inputsSnapshot, montoCalculado);

    // CB-3 / T9 / CA-8: Consentimiento vía escritor canónico de F2
    if (parsed.data.aceptaPoliticas) {
      try {
        const { registrarConsentimientoUsuario } = await import("@ruum/api/services");
        if (typeof registrarConsentimientoUsuario === "function") {
          await registrarConsentimientoUsuario(cliente, {
            version: 1,
            canal: "web",
            versionApp: "1.0.0",
          });
        }
      } catch (errConsent) {
        logStructuredWarn("api/viajes", "registro_consentimiento_canonico_nota", errConsent, {
          userIdHash: userHash,
        });
      }
    }

    return NextResponse.json(
      {
        ok: true,
        pasoValidado: pasoContador,
        recalculo: {
          distanciaKm: rutaRecalculada.distanciaKm,
          tiempoEstimadoHoras: rutaRecalculada.tiempoEstimadoHoras,
          precioCotizado: montoCalculado,
          fuente: rutaRecalculada.fuente,
        },
        snapshot: snapshotFirmado,
      },
      { status: 200 }
    );
  } catch (err) {
    console.warn("[api/viajes] error", err);
    return NextResponse.json({ error: "No se pudo procesar la solicitud. Intenta de nuevo más tarde." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
