import { detenerTrackingNativo, limpiarCredencialesTrackingNativo, obtenerEstadoTrackingNativo, soportaTrackingNativo } from "./background-tracking";
import { desactivarPushDelDispositivo } from "./push-notifications";
import { limpiarCacheViajeActivo } from "./offline-active-trip-cache";
import { limpiarBorradorRegistroLocal } from "./borrador-registro";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "./supabase-browser";
import { contarColaEvidencia, limpiarColaEvidencia, limpiarColaEvidenciaCompleta } from "./cola-offline";
import { contarColaTelemetria, limpiarColaTelemetria, limpiarColaTelemetriaCompleta } from "./cola-telemetria-offline";
import { recordOperationalEvent } from "./observability";

export type InspeccionPendientes = {
  pendingEvidence: number;
  pendingTelemetry: number;
  pendingWebTelemetry: number;
  pendingNativeTelemetry: number;
  inspectionError: boolean;
  inspectionErrorReason?: string;
};

export type ResultadoLimpiezaSesion = {
  ok: boolean;
  blocked: boolean;
  errorCount: number;
  pendingEvidence: number;
  pendingTelemetry: number;
  pendingWebTelemetry?: number;
  pendingNativeTelemetry?: number;
  inspectionError?: boolean;
  inspectionErrorReason?: string;
};

export async function inspeccionarPendientesAntesDeSalir(usuarioIdExplicito?: string | null): Promise<InspeccionPendientes> {
  let userId = usuarioIdExplicito;
  if (userId === undefined && tieneSupabaseConfigurado()) {
    try {
      const { data } = await crearClienteNavegador().auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      userId = null;
    }
  }

  // 1. Evidencia pendiente (por propietario si está autenticado)
  let pendingEvidence = 0;
  try {
    pendingEvidence = await contarColaEvidencia(undefined, userId ?? undefined);
  } catch {
    pendingEvidence = await contarColaEvidencia();
  }

  // 2. Telemetría Web pendiente (por propietario si está autenticado, H02)
  let pendingWebTelemetry = 0;
  try {
    pendingWebTelemetry = await contarColaTelemetria(userId ? { usuarioId: userId } : undefined);
  } catch {
    pendingWebTelemetry = await contarColaTelemetria();
  }

  // 3. Telemetría Nativa pendiente (plugin en dispositivo)
  let pendingNativeTelemetry = 0;
  let inspectionError = false;
  let inspectionErrorReason: string | undefined;

  if (soportaTrackingNativo()) {
    try {
      const estado = await obtenerEstadoTrackingNativo();
      pendingNativeTelemetry = estado.pendingCount ?? 0;
    } catch (err) {
      // Estado explícito de error de inspección (H02: un fallo no garantiza que no haya pendientes)
      inspectionError = true;
      inspectionErrorReason = err instanceof Error ? err.message : "native_tracking_inspection_failed";
      pendingNativeTelemetry = 0;
    }
  }

  const pendingTelemetry = pendingWebTelemetry + pendingNativeTelemetry;

  return {
    pendingEvidence,
    pendingTelemetry,
    pendingWebTelemetry,
    pendingNativeTelemetry,
    inspectionError,
    inspectionErrorReason
  };
}

/**
 * Por defecto NO destruye una sesión con evidencia o telemetría pendiente.
 * El flujo de soporte puede usar force=true después de exportar/registrar la incidencia.
 */
export type AutorizacionForceLogout = {
  autorizadoPor: string;
  motivo: string;
  ticketSoporte: string;
  confirmarPerdidaPendientes: true;
};

export async function limpiarSesionIntegral(options: { force?: boolean; autorizacion?: AutorizacionForceLogout } = {}): Promise<ResultadoLimpiezaSesion> {
  // Capturar usuario antes de signOut para limpieza scoped (preserva cola de otros usuarios en el dispositivo)
  let userIdAntes: string | null = null;
  if (tieneSupabaseConfigurado()) {
    try {
      const { data } = await crearClienteNavegador().auth.getUser();
      userIdAntes = data.user?.id ?? null;
    } catch {
      userIdAntes = null;
    }
  }

  const pendientes = await inspeccionarPendientesAntesDeSalir(userIdAntes);
  const hasPending = pendientes.pendingEvidence > 0 || pendientes.pendingTelemetry > 0;
  const isBlocked = hasPending || pendientes.inspectionError;

  if (!options.force && isBlocked) {
    return { ok: false, blocked: true, errorCount: 0, ...pendientes };
  }

  if (options.force && isBlocked) {
    const a = options.autorizacion;
    if (!a?.autorizadoPor?.trim() || !a?.motivo?.trim() || !a?.ticketSoporte?.trim() || a.confirmarPerdidaPendientes !== true) {
      throw new Error("force_logout_authorization_required");
    }
    await recordOperationalEvent("session_force_logout", {
      autorizadoPor: a.autorizadoPor,
      motivo: a.motivo,
      ticketSoporte: a.ticketSoporte,
      pendingEvidence: pendientes.pendingEvidence,
      pendingTelemetry: pendientes.pendingTelemetry,
      pendingWebTelemetry: pendientes.pendingWebTelemetry,
      pendingNativeTelemetry: pendientes.pendingNativeTelemetry,
      inspectionError: pendientes.inspectionError,
      inspectionErrorReason: pendientes.inspectionErrorReason
    });
  }

  const errores: unknown[] = [];
  if (soportaTrackingNativo()) {
    try { await detenerTrackingNativo(); } catch (e) { errores.push(e); }
    try { await limpiarCredencialesTrackingNativo(); } catch (e) { errores.push(e); }
  }
  try { await desactivarPushDelDispositivo(); } catch (e) { errores.push(e); }
  try { await crearClienteNavegador().auth.signOut({ scope: "local" }); } catch (e) { errores.push(e); }
  try { await limpiarCacheViajeActivo(); } catch (e) { errores.push(e); }

  // Evidencia: limpieza por propietario (H02)
  try {
    if (options.force && isBlocked) {
      // Force autorizado: solo borra del usuario que hace logout, nunca de otros salvo que se pase null explícitamente
      if (userIdAntes) await limpiarColaEvidencia(userIdAntes);
      else await limpiarColaEvidenciaCompleta();
    } else {
      if (userIdAntes) await limpiarColaEvidencia(userIdAntes);
      else await limpiarColaEvidencia();
    }
  } catch (e) { errores.push(e); }

  // Telemetría: limpieza por propietario (NO borrar la de otros usuarios, H02)
  try {
    if (options.force && isBlocked) {
      if (userIdAntes) await limpiarColaTelemetria(userIdAntes);
      else await limpiarColaTelemetriaCompleta();
    } else {
      if (userIdAntes) await limpiarColaTelemetria(userIdAntes);
      else await limpiarColaTelemetria();
    }
  } catch (e) { errores.push(e); }

  limpiarBorradorRegistroLocal();
  if (typeof window !== "undefined") {
    for (const key of Object.keys(localStorage)) {
      if (
        key.startsWith("ruum_") &&
        key !== "ruum_cola_telemetria_v1" &&
        key !== "ruum_cola_evidencia_v1"
      ) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent("ruum:session-cleared"));
  }
  return { ok: errores.length === 0, blocked: false, errorCount: errores.length, ...pendientes };
}
