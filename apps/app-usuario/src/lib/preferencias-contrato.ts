/**
 * Contrato unificado de persistencia y sincronización de preferencias.
 * RUUM-UX-011: Unificación del contrato móvil/escritorio, aislamiento por usuario
 * y eliminación de falso éxito ante fallos de sincronización remota.
 */

import type { Database } from "@ruum/shared/types";
import {
  actualizarPreferenciasGeneralesUsuario,
  actualizarPreferenciasNotificaciones,
} from "@ruum/api/services";
import {
  leerPendientes,
  guardarPendientes,
  type Pendientes,
} from "./preferencias-pendientes";
import { desactivarTelemetriaActiva } from "./analytics";

export type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];

export interface PreferenciasUsuarioContrato {
  // Preferencias generales (almacenadas en usuarios.preferencias JSONB)
  idioma: "es" | "en";
  zonaHoraria: string;
  unidades: "Métrico" | "Imperial";
  tema: "Claro" | "Oscuro" | "Automático";
  accesibilidad: "Estándar" | "Alto contraste" | "Texto grande";
  usoDatos: "Activado" | "Solo esenciales" | "Desactivado";
  alertasGenerales: boolean;

  // Matriz de notificaciones
  notifRecordatoriosEmail: boolean;
  notifRecordatoriosPush: boolean;
  notifCambiosEstadoEmail: boolean;
  notifCambiosEstadoPush: boolean;
  notifPagosEmail: boolean;
  notifPagosPush: boolean;
  notifPromocionesEmail: boolean;
  notifPromocionesPush: boolean;
}

export const PREFERENCIAS_POR_DEFECTO: PreferenciasUsuarioContrato = {
  idioma: "es",
  zonaHoraria: "(UTC-06:00) Ciudad de México",
  unidades: "Métrico",
  tema: "Claro",
  accesibilidad: "Estándar",
  usoDatos: "Activado",
  alertasGenerales: true,
  notifRecordatoriosEmail: true,
  notifRecordatoriosPush: true,
  notifCambiosEstadoEmail: true,
  notifCambiosEstadoPush: true,
  notifPagosEmail: true,
  notifPagosPush: true,
  notifPromocionesEmail: false,
  notifPromocionesPush: false,
};

/** Clave de localStorage aislada por usuario */
export function claveLocalUsuario(usuarioId: string | null | undefined): string {
  return usuarioId ? `ruum:pref:usuario:${usuarioId}` : "ruum:pref:usuario:anonimo";
}

/** Clave específica por opción aislada por usuario (compartida con variante móvil) */
export function claveOpcionUsuario(clave: string, usuarioId: string | null | undefined): string {
  return usuarioId ? `ruum:pref:${clave}:${usuarioId}` : `ruum:pref:${clave}`;
}

/**
 * Lee las preferencias locales para un usuario determinado, migrando transparentemente
 * si existía la clave global heredada para ese usuario y fusionando con los datos de BD.
 */
export function obtenerPreferenciasIniciales(
  usuario?: UsuarioRow | null
): PreferenciasUsuarioContrato {
  const defecto = { ...PREFERENCIAS_POR_DEFECTO };
  const userId = usuario?.id;

  // Si hay datos en el objeto usuario de BD, hidratar
  if (usuario) {
    if (typeof usuario.notificaciones_push === "boolean") {
      defecto.notifPagosPush = usuario.notificaciones_push;
      defecto.notifCambiosEstadoPush = usuario.notificaciones_push;
    }
    if (typeof usuario.notificaciones_email === "boolean") {
      defecto.notifPagosEmail = usuario.notificaciones_email;
      defecto.notifCambiosEstadoEmail = usuario.notificaciones_email;
    }
    if (typeof usuario.alertas_pago === "boolean") {
      defecto.notifPagosEmail = usuario.alertas_pago;
      defecto.notifPagosPush = usuario.alertas_pago;
    }
    if (typeof usuario.notificaciones_promocionales === "boolean") {
      defecto.notifPromocionesEmail = usuario.notificaciones_promocionales;
      defecto.notifPromocionesPush = usuario.notificaciones_promocionales;
    }
    if (typeof usuario.alertas_viaje === "boolean") {
      defecto.notifRecordatoriosEmail = usuario.alertas_viaje;
    }
    if (typeof usuario.alertas_evidencia === "boolean") {
      defecto.notifCambiosEstadoEmail = usuario.alertas_evidencia;
    }

    const prefBD = usuario.preferencias && typeof usuario.preferencias === "object" && !Array.isArray(usuario.preferencias)
      ? (usuario.preferencias as Record<string, unknown>)
      : {};

    if (prefBD.idioma === "es" || prefBD.idioma === "en") defecto.idioma = prefBD.idioma;
    if (typeof prefBD.zonaHoraria === "string") defecto.zonaHoraria = prefBD.zonaHoraria;
    if (prefBD.unidades === "Métrico" || prefBD.unidades === "Imperial") defecto.unidades = prefBD.unidades;
    if (prefBD.tema === "Claro" || prefBD.tema === "Oscuro" || prefBD.tema === "Automático") defecto.tema = prefBD.tema;
    if (prefBD.accesibilidad === "Estándar" || prefBD.accesibilidad === "Alto contraste" || prefBD.accesibilidad === "Texto grande") defecto.accesibilidad = prefBD.accesibilidad;
    if (prefBD.usoDatos === "Activado" || prefBD.usoDatos === "Solo esenciales" || prefBD.usoDatos === "Desactivado") defecto.usoDatos = prefBD.usoDatos;
    if (typeof prefBD.alertasGenerales === "boolean") defecto.alertasGenerales = prefBD.alertasGenerales;
  }

  if (typeof window === "undefined") return defecto;

  try {
    // 1. Verificar si hay cambios pendientes no sincronizados
    const pendientes = leerPendientes(userId ?? "local");
    const cambiosGenerales = pendientes.general;
    const cambiosNotif = pendientes.notificacion;

    // 2. Leer almacenamiento local aislado por usuario
    const claveAislada = claveLocalUsuario(userId);
    let rawLocal = window.localStorage.getItem(claveAislada);

    // Migración transparente de la clave global histórica (solo si la clave aislada no existe)
    if (!rawLocal && userId) {
      const legacyGlobal = window.localStorage.getItem("ruum-usuario-preferencias");
      if (legacyGlobal) {
        rawLocal = legacyGlobal;
        window.localStorage.setItem(claveAislada, legacyGlobal);
        window.localStorage.removeItem("ruum-usuario-preferencias");
      }
    }

    const localObj = rawLocal ? JSON.parse(rawLocal) : {};

    // 3. Fusionar BD + Local Aislado + Pendientes (los pendientes ganan en UI inmediata)
    const consolidado: PreferenciasUsuarioContrato = {
      ...defecto,
      ...localObj,
      ...cambiosGenerales,
    };

    if (typeof cambiosNotif.notificaciones_push === "boolean") {
      consolidado.notifPagosPush = cambiosNotif.notificaciones_push as boolean;
      consolidado.notifCambiosEstadoPush = cambiosNotif.notificaciones_push as boolean;
    }
    if (typeof cambiosNotif.notificaciones_email === "boolean") {
      consolidado.notifPagosEmail = cambiosNotif.notificaciones_email as boolean;
      consolidado.notifCambiosEstadoEmail = cambiosNotif.notificaciones_email as boolean;
    }
    if (typeof cambiosNotif.alertas_pago === "boolean") {
      consolidado.notifPagosEmail = cambiosNotif.alertas_pago as boolean;
      consolidado.notifPagosPush = cambiosNotif.alertas_pago as boolean;
    }
    if (typeof cambiosNotif.notificaciones_promocionales === "boolean") {
      consolidado.notifPromocionesEmail = cambiosNotif.notificaciones_promocionales as boolean;
      consolidado.notifPromocionesPush = cambiosNotif.notificaciones_promocionales as boolean;
    }

    return consolidado;
  } catch {
    return defecto;
  }
}

/**
 * Guarda las preferencias en el almacenamiento local aislado del usuario.
 */
export function guardarPreferenciasLocales(
  usuarioId: string | null | undefined,
  prefs: PreferenciasUsuarioContrato
): void {
  if (typeof window === "undefined") return;
  try {
    const claveAislada = claveLocalUsuario(usuarioId);
    window.localStorage.setItem(claveAislada, JSON.stringify(prefs));

    // También actualizar claves atómicas compartidas con la variante móvil
    window.localStorage.setItem(claveOpcionUsuario("idioma", usuarioId), JSON.stringify(prefs.idioma));
    window.localStorage.setItem(claveOpcionUsuario("unidades", usuarioId), JSON.stringify(prefs.unidades));
    window.localStorage.setItem(claveOpcionUsuario("tema", usuarioId), JSON.stringify(prefs.tema));
    window.localStorage.setItem(claveOpcionUsuario("accesibilidad", usuarioId), JSON.stringify(prefs.accesibilidad));
    window.localStorage.setItem(claveOpcionUsuario("usoDatos", usuarioId), JSON.stringify(prefs.usoDatos));
  } catch {
    // Manejo de cuota o navegación privada
  }
}

/**
 * Aplica los efectos visuales y de comportamiento en el DOM según las preferencias.
 */
export function aplicarEfectosReales(prefs: Partial<PreferenciasUsuarioContrato>): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  try {
    const raiz = document.documentElement;

    // 1. Idioma
    if (prefs.idioma) {
      raiz.setAttribute("lang", prefs.idioma === "en" ? "en" : "es-MX");
    }

    // 2. Unidades
    if (prefs.unidades) {
      raiz.setAttribute("data-units", prefs.unidades === "Imperial" ? "imperial" : "metric");
      window.dispatchEvent(new CustomEvent("ruum:unidades-actualizadas", { detail: { unidades: prefs.unidades } }));
    }

    // 3. Accesibilidad
    if (prefs.accesibilidad) {
      if (prefs.accesibilidad === "Texto grande") {
        raiz.setAttribute("data-a11y-font", "large");
        raiz.style.fontSize = "18px";
        raiz.removeAttribute("data-a11y-contrast");
      } else if (prefs.accesibilidad === "Alto contraste") {
        raiz.setAttribute("data-a11y-contrast", "high");
        raiz.style.fontSize = "";
        raiz.removeAttribute("data-a11y-font");
      } else {
        raiz.removeAttribute("data-a11y-font");
        raiz.removeAttribute("data-a11y-contrast");
        raiz.style.fontSize = "";
      }
    }

    // 4. Uso de datos
    if (prefs.usoDatos) {
      if (prefs.usoDatos === "Desactivado") {
        desactivarTelemetriaActiva();
      } else {
        window.localStorage.removeItem("ruum:telemetria-desactivada");
      }
    }

    // Disparar evento de edición
    window.dispatchEvent(new Event("ruum:preferencias-editadas"));
  } catch {
    // Ignorar errores de DOM en entornos restringidos
  }
}

export type ResultadoSincronizacion =
  | { exito: true }
  | { exito: false; error: string; es503: boolean; esRed: boolean };

/**
 * Sincroniza las preferencias con el backend remoto de Supabase.
 * Devuelve un resultado explícito sin silenciar errores.
 */
export async function sincronizarPreferenciasRemotas(
  cliente: unknown,
  usuario: UsuarioRow | null | undefined,
  prefs: PreferenciasUsuarioContrato
): Promise<ResultadoSincronizacion> {
  if (!usuario?.id) {
    return { exito: true }; // Sesión no disponible, solo guardado local válido
  }

  const payloadNotificaciones = {
    notificaciones_push: prefs.notifPagosPush || prefs.notifCambiosEstadoPush || prefs.notifRecordatoriosPush,
    notificaciones_email: prefs.notifPagosEmail || prefs.notifCambiosEstadoEmail || prefs.notifRecordatoriosEmail,
    alertas_pago: prefs.notifPagosEmail || prefs.notifPagosPush,
    notificaciones_promocionales: prefs.notifPromocionesEmail || prefs.notifPromocionesPush,
    alertas_viaje: prefs.notifRecordatoriosEmail || prefs.notifRecordatoriosPush,
    alertas_evidencia: prefs.notifCambiosEstadoEmail || prefs.notifCambiosEstadoPush,
  };

  const payloadGenerales = {
    idioma: prefs.idioma,
    zonaHoraria: prefs.zonaHoraria,
    unidades: prefs.unidades,
    tema: prefs.tema,
    accesibilidad: prefs.accesibilidad,
    usoDatos: prefs.usoDatos,
    alertasGenerales: prefs.alertasGenerales,
    notifRecordatoriosEmail: prefs.notifRecordatoriosEmail,
    notifRecordatoriosPush: prefs.notifRecordatoriosPush,
    notifCambiosEstadoEmail: prefs.notifCambiosEstadoEmail,
    notifCambiosEstadoPush: prefs.notifCambiosEstadoPush,
    notifPagosEmail: prefs.notifPagosEmail,
    notifPagosPush: prefs.notifPagosPush,
    notifPromocionesEmail: prefs.notifPromocionesEmail,
    notifPromocionesPush: prefs.notifPromocionesPush,
  };

  // Registrar en pendientes localmente por si falla la sincronización
  const userId = usuario.id;
  const pendientesPrevios = leerPendientes(userId);
  const pendientesActualizados: Pendientes = {
    general: { ...pendientesPrevios.general, ...payloadGenerales },
    notificacion: { ...pendientesPrevios.notificacion, ...payloadNotificaciones },
  };
  guardarPendientes(userId, pendientesActualizados);

  try {
    // Ejecutar ambas actualizaciones en el backend
    await Promise.all([
      actualizarPreferenciasNotificaciones(cliente as never, payloadNotificaciones),
      actualizarPreferenciasGeneralesUsuario(cliente as never, payloadGenerales),
    ]);

    // Si tuvo éxito, limpiar los pendientes guardados
    guardarPendientes(userId, { general: {}, notificacion: {} });
    return { exito: true };
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : String(err);
    const errObj = err as Record<string, unknown> | null;
    const status = typeof errObj?.status === "number" ? errObj.status : 0;
    const es503 = status === 503 || mensaje.includes("503") || mensaje.includes("fallo_controlado_auditoria");
    const esRed = !navigator.onLine || mensaje.toLowerCase().includes("failed to fetch") || mensaje.toLowerCase().includes("network") || mensaje.includes("sin red");

    return {
      exito: false,
      error: mensaje || "Error al sincronizar con el servidor",
      es503,
      esRed,
    };
  }
}
