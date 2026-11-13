import { registrarConsentimientoUsuario } from "@ruum/api/services";
import { normalizarDispositivo } from "@/lib/device-id";
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
import { RutaNoDisponibleError } from "@/lib/ruta-cache";
import { resolverRutaSolicitudServidor } from "@/lib/ruta-solicitud-servidor";
import { cotizarSolicitudIndividual } from "@/lib/cotizacion-individual-servidor";
import { construirPayloadCreacion } from "@/app/viajes/nuevo/adapters";
import type { DatosFormulario } from "@/app/viajes/nuevo/types";
import {
  registrarDivergenciaTarifa,
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
      tipo: tipo as DatosFormulario["tipo"],
      origenReferencias: textoOpcional("origenReferencias"),
      destinoReferencias: textoOpcional("destinoReferencias"),
      instruccionesEspeciales: textoOpcional("instruccionesEspeciales"),
      ventanaRecoleccion: textoOpcional("ventanaRecoleccion"),
      ventanaEntrega: textoOpcional("ventanaEntrega"),
      paradas: parsed.data.paradas.map((p, i) => ({ ...p, id: String(i), referencias: p.referencias ?? "" })),
    };
    const rutaRecalculada = await resolverRutaSolicitudServidor(parsed.data);
    const payload = construirPayloadCreacion(formulario, parsed.data.vehiculoSeleccionadoId, rutaRecalculada);
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

    // CB-3 / T9 / CA-8: Consentimiento vía escritor canónico de F2
    if (parsed.data.aceptaPoliticas) {
      try {
        await registrarConsentimientoUsuario(cliente, {
          version: 1,
          canal: "web",
          versionApp: "1.0.0",
        });
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
        // El nonce solo autoriza el payload exacto guardado en la base de datos.
        snapshot: solicitud.traslado.snapshot_tarifa,
        solicitud,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof RutaNoDisponibleError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.warn("[api/viajes] error", err);
    return NextResponse.json({ error: "No se pudo procesar la solicitud. Intenta de nuevo más tarde." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
