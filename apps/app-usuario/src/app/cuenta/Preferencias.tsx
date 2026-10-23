"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { Icono } from "@ruum/ui";
import { HojaTareaCuenta } from "./HojaTareaCuenta";
import type { Database } from "@ruum/shared/types";
import { actualizarPreferenciasNotificaciones, actualizarPreferenciasGeneralesUsuario } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { logStructuredWarn } from "../../lib/logger";
import { desactivarTelemetriaActiva } from "../../lib/analytics";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

export interface PreferenciasProps {
  usuario?: Usuario | null;
}

interface InterruptorProps {
  activo: boolean;
  onAlternar: () => void;
  etiquetaAria: string;
  disabled?: boolean;
}

function Interruptor({ activo, onAlternar, etiquetaAria, disabled = false }: InterruptorProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiquetaAria}
      disabled={disabled}
      onClick={onAlternar}
      className={[
        "user-preference-switch relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a2342] dark:focus-visible:outline-[#6ba8ff] disabled:opacity-50",
        activo ? "bg-[#0a2342] dark:bg-[#104ca0]" : "bg-[#d5e2f0] dark:bg-[#1a3a5c]",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block size-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          activo ? "translate-x-6" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Funciones activas para aplicar preferencias en el DOM / Navegador
───────────────────────────────────────────────────────────── */

function aplicarTemaEnDocumento(t: "Claro" | "Oscuro" | "Automático") {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    let efectivo: "light" | "dark" = "light";
    if (t === "Oscuro") {
      efectivo = "dark";
    } else if (t === "Claro") {
      efectivo = "light";
    } else {
      efectivo = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", efectivo);
    if (efectivo === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Unificar a una sola clave canónica "ruum-tema", limpiando claves obsoletas
    window.localStorage.setItem("ruum-tema", efectivo);
    window.localStorage.removeItem("ruum-theme");
    window.localStorage.removeItem("ruum-tema-modo");
  } catch {
    // ignore
  }
}

function aplicarAccesibilidadEnDocumento(acc: "Estándar" | "Texto grande" | "Alto contraste") {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    if (acc === "Texto grande") {
      document.documentElement.setAttribute("data-a11y-font", "large");
      document.documentElement.style.fontSize = "18px";
      document.documentElement.removeAttribute("data-a11y-contrast");
    } else if (acc === "Alto contraste") {
      document.documentElement.setAttribute("data-a11y-contrast", "high");
      document.documentElement.style.fontSize = "";
      document.documentElement.removeAttribute("data-a11y-font");
    } else {
      document.documentElement.removeAttribute("data-a11y-font");
      document.documentElement.removeAttribute("data-a11y-contrast");
      document.documentElement.style.fontSize = "";
    }
  } catch {
    // ignore
  }
}

function aplicarIdiomaEnDocumento(id: "es" | "en") {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    document.documentElement.setAttribute("lang", id);
  } catch {
    // ignore
  }
}

function aplicarUnidadesEnDocumento(u: "Métrico" | "Imperial") {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    document.documentElement.setAttribute("data-units", u === "Imperial" ? "imperial" : "metric");
    window.dispatchEvent(new CustomEvent("ruum:unidades-actualizadas", { detail: { unidades: u } }));
  } catch {
    // ignore
  }
}

function aplicarUsoDatosEnDocumento(datos: "Activado" | "Desactivado") {
  if (typeof window === "undefined") return;
  try {
    if (datos === "Desactivado") {
      desactivarTelemetriaActiva();
    } else {
      window.localStorage.removeItem("ruum:telemetria-desactivada");
    }
  } catch {
    // ignore
  }
}

/* ─────────────────────────────────────────────────────────────
   Componente Principal Preferencias
───────────────────────────────────────────────────────────── */

export function Preferencias({ usuario }: PreferenciasProps) {
  // C-3: preferencias sin columna en BD (tema, idioma, etc.) se persisten en
  // localStorage; las de notificación/alerta van a Supabase + localStorage.
  function leerLocal<T>(clave: string, defecto: T): T {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(clave) : null;
      return raw !== null ? (JSON.parse(raw) as T) : defecto;
    } catch {
      return defecto;
    }
  }
  function guardarLocal(clave: string, valor: unknown) {
    try {
      window.localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      // almacenamiento no disponible (SSR/privado) — se ignora
    }
  }
  const prefBD = (usuario?.preferencias && typeof usuario.preferencias === "object" && !Array.isArray(usuario.preferencias))
    ? (usuario.preferencias as Record<string, unknown>)
    : {};

  // Notificaciones generales
  const [notifPush, setNotifPush] = useState(usuario?.notificaciones_push ?? true);
  const [notifEmail, setNotifEmail] = useState(usuario?.notificaciones_email ?? true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(usuario?.notificaciones_sms_whatsapp ?? false);
  const [notifPromo, setNotifPromo] = useState(usuario?.notificaciones_promocionales ?? false);

  // Alertas de traslado
  const [alertaViaje, setAlertaViaje] = useState(usuario?.alertas_viaje ?? true);
  const [alertaEvidencia, setAlertaEvidencia] = useState(usuario?.alertas_evidencia ?? true);
  const [alertaPago, setAlertaPago] = useState(usuario?.alertas_pago ?? true);
  const [alertaIncidente, setAlertaIncidente] = useState(() => (typeof prefBD.alertaIncidente === "boolean" ? prefBD.alertaIncidente : leerLocal("ruum:pref:alertaIncidente", true)));

  // Idioma
  const [idioma, setIdioma] = useState<"es" | "en">(() => (prefBD.idioma as "es" | "en") ?? leerLocal("ruum:pref:idioma", "es"));

  // Preferencias de la app
  const [tema, setTema] = useState<"Claro" | "Oscuro" | "Automático">(() => (prefBD.tema as "Claro" | "Oscuro" | "Automático") ?? leerLocal("ruum:pref:tema", "Claro"));
  const [unidades, setUnidades] = useState<"Métrico" | "Imperial">(() => (prefBD.unidades as "Métrico" | "Imperial") ?? leerLocal("ruum:pref:unidades", "Métrico"));
  const [accesibilidad, setAccesibilidad] = useState<"Estándar" | "Texto grande" | "Alto contraste">(() => (prefBD.accesibilidad as "Estándar" | "Texto grande" | "Alto contraste") ?? leerLocal("ruum:pref:accesibilidad", "Estándar"));

  // Privacidad y seguridad
  const [biometrico, setBiometrico] = useState(() => (typeof prefBD.biometrico === "boolean" ? prefBD.biometrico : leerLocal("ruum:pref:biometrico", true)));
  const [ubicacion, setUbicacion] = useState(() => (typeof prefBD.ubicacion === "boolean" ? prefBD.ubicacion : leerLocal("ruum:pref:ubicacion", true)));
  const [usoDatos, setUsoDatos] = useState<"Activado" | "Desactivado">(() => (prefBD.usoDatos as "Activado" | "Desactivado") ?? leerLocal("ruum:pref:usoDatos", "Activado"));

  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const cerrarNotificaciones = useCallback(() => setNotificacionesAbiertas(false), []);
  const colaGuardado = useRef<Promise<void>>(Promise.resolve());
  const timeoutDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preferenciasPendientesRef = useRef<Record<string, unknown>>({});
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  useEffect(() => aplicarTemaEnDocumento(tema), [tema]);
  useEffect(() => aplicarAccesibilidadEnDocumento(accesibilidad), [accesibilidad]);
  useEffect(() => aplicarIdiomaEnDocumento(idioma), [idioma]);
  useEffect(() => aplicarUnidadesEnDocumento(unidades), [unidades]);
  useEffect(() => aplicarUsoDatosEnDocumento(usoDatos), [usoDatos]);
  useEffect(() => {
    return () => {
      if (timeoutDebounceRef.current) clearTimeout(timeoutDebounceRef.current);
    };
  }, []);
  useEffect(() => { if (!toastMensaje) return; const t = setTimeout(() => setToastMensaje(null), 3000); return () => clearTimeout(t); }, [toastMensaje]);

  function programarSincronizacionGeneral(cambios: Record<string, unknown>) {
    Object.assign(preferenciasPendientesRef.current, cambios);
    if (timeoutDebounceRef.current) {
      clearTimeout(timeoutDebounceRef.current);
    }
    timeoutDebounceRef.current = setTimeout(() => {
      const payload = { ...preferenciasPendientesRef.current };
      preferenciasPendientesRef.current = {};
      if (!tieneSupabaseConfigurado()) return;
      colaGuardado.current = colaGuardado.current.then(async () => {
        try {
          await actualizarPreferenciasGeneralesUsuario(crearClienteNavegador(), payload);
        } catch (err) {
          logStructuredWarn("cuenta/Preferencias", "sincronizar_preferencias_generales_fallido", err);
          setToastMensaje("Guardado en este dispositivo; no pudimos sincronizar con tu cuenta.");
        }
      });
    }, 400);
  }

  async function sincronizarNotificacion(campo: string, valor: boolean) {
    guardarLocal(`ruum:pref:${campo}`, valor);
    if (!tieneSupabaseConfigurado()) return;
    colaGuardado.current = colaGuardado.current.then(async () => {
      try { await actualizarPreferenciasNotificaciones(crearClienteNavegador(), { [campo]: valor }); }
      catch (err) {
        logStructuredWarn("cuenta/Preferencias", "sincronizar_notificacion_fallido", err, { campo });
        setToastMensaje("Guardado en este dispositivo; no pudimos sincronizar con tu cuenta.");
      }
    });
    await colaGuardado.current;
  }
  function handleTogglePush() {
    const nuevo = !notifPush;
    setNotifPush(nuevo);
    void sincronizarNotificacion("notificaciones_push", nuevo);
    if (nuevo && typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "default") {
          void Notification.requestPermission();
        }
      } catch {
        // ignore
      }
    }
    setToastMensaje(nuevo ? "Notificaciones push activadas" : "Notificaciones push desactivadas");
  }

  function handleToggleEmail() {
    const nuevo = !notifEmail;
    setNotifEmail(nuevo);
    void sincronizarNotificacion("notificaciones_email", nuevo);
    setToastMensaje(nuevo ? "Notificaciones por correo activadas" : "Notificaciones por correo desactivadas");
  }

  function handleToggleWhatsapp() {
    const nuevo = !notifWhatsapp;
    setNotifWhatsapp(nuevo);
    void sincronizarNotificacion("notificaciones_sms_whatsapp", nuevo);
    setToastMensaje(nuevo ? "WhatsApp / SMS activado" : "WhatsApp / SMS desactivado");
  }

  function handleTogglePromo() {
    const nuevo = !notifPromo;
    setNotifPromo(nuevo);
    void sincronizarNotificacion("notificaciones_promocionales", nuevo);
    setToastMensaje(nuevo ? "Promociones activadas" : "Promociones desactivadas");
  }

  function handleToggleViaje() {
    const nuevo = !alertaViaje;
    setAlertaViaje(nuevo);
    void sincronizarNotificacion("alertas_viaje", nuevo);
    setToastMensaje(nuevo ? "Alertas de traslado activadas" : "Alertas de traslado desactivadas");
  }

  function handleToggleEvidencia() {
    const nuevo = !alertaEvidencia;
    setAlertaEvidencia(nuevo);
    void sincronizarNotificacion("alertas_evidencia", nuevo);
    setToastMensaje(nuevo ? "Alertas de evidencia activadas" : "Alertas de evidencia desactivadas");
  }

  function handleTogglePago() {
    const nuevo = !alertaPago;
    setAlertaPago(nuevo);
    void sincronizarNotificacion("alertas_pago", nuevo);
    setToastMensaje(nuevo ? "Alertas de pago activadas" : "Alertas de pago desactivadas");
  }

  function handleToggleIncidente() {
    const nuevo = !alertaIncidente;
    setAlertaIncidente(nuevo);
    guardarLocal("ruum:pref:alertaIncidente", nuevo);
    programarSincronizacionGeneral({ alertaIncidente: nuevo });
    setToastMensaje(nuevo ? "Alertas de incidentes activadas" : "Alertas de incidentes desactivadas");
  }

  function handleCambiarIdioma(nuevo: "es" | "en") {
    setIdioma(nuevo);
    guardarLocal("ruum:pref:idioma", nuevo);
    aplicarIdiomaEnDocumento(nuevo);
    programarSincronizacionGeneral({ idioma: nuevo });
    setToastMensaje(nuevo === "es" ? "Idioma cambiado a Español (México)" : "Language changed to English (US)");
  }

  function handleToggleBiometrico() {
    const nuevo = !biometrico;
    setBiometrico(nuevo);
    guardarLocal("ruum:pref:biometrico", nuevo);
    programarSincronizacionGeneral({ biometrico: nuevo });
    setToastMensaje(nuevo ? "Inicio biométrico activado" : "Inicio biométrico desactivado");
  }

  function handleToggleUbicacion() {
    const nuevo = !ubicacion;
    setUbicacion(nuevo);
    guardarLocal("ruum:pref:ubicacion", nuevo);
    programarSincronizacionGeneral({ ubicacion: nuevo });
    if (nuevo && typeof navigator !== "undefined" && "geolocation" in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 4000, maximumAge: 60000 });
      } catch {
        // ignore
      }
    }
    setToastMensaje(nuevo ? "Ubicación en tiempo real activada" : "Ubicación en tiempo real desactivada");
  }

  const notificaciones = [
    ["Notificaciones push", notifPush, handleTogglePush], ["Correo electrónico", notifEmail, handleToggleEmail],
    ["WhatsApp / SMS", notifWhatsapp, handleToggleWhatsapp], ["Promociones", notifPromo, handleTogglePromo],
    ["Estado del traslado", alertaViaje, handleToggleViaje], ["Evidencia disponible", alertaEvidencia, handleToggleEvidencia],
    ["Alertas de pago", alertaPago, handleTogglePago], ["Incidentes", alertaIncidente, handleToggleIncidente],
  ] as const;
  return <div className="user-preferences-view">
    <header className="user-profile-appbar"><Link href="/cuenta?seccion=perfil" aria-label="Volver a mi cuenta" className="user-profile-back">‹ Atrás</Link><h1>Preferencias</h1><span aria-hidden="true" /></header>
    <div className="user-preferences-list">
      <h2>IDIOMA</h2>
      <FilaPreferencia titulo="Idioma" icono="M3 5h12 M9 3v2 M5 8c1 4 4 7 8 9 M13 8c-1 4-4 7-8 9 M15 21l4-11 4 11 M17 17h4">
        <div className="user-language-segments" role="radiogroup" aria-label="Idioma">{([["es", "Español", "Español (México)"], ["en", "English", "English (US)"]] as const).map(([valor, texto, label]) => <button key={valor} type="button" role="radio" aria-label={label} aria-checked={idioma === valor} onClick={() => handleCambiarIdioma(valor)}>{texto}</button>)}</div>
      </FilaPreferencia>
      <h2>APLICACIÓN</h2>
      <button type="button" className="user-preference-row" onClick={() => setNotificacionesAbiertas(true)} aria-haspopup="dialog"><Icono d="M6 8a6 6 0 0 1 12 0v8l3 2H3l3-2V8Z M10 21h4" className="size-4 shrink-0" /><span>Notificaciones y alertas</span><span aria-hidden="true">›</span></button>
      <FilaPreferencia titulo="Tema" icono="M12 3a9 9 0 1 0 9 9c-6 3-12-3-9-9Z"><select aria-label="Tema de la aplicación" value={tema} onChange={e => { const v = e.target.value as typeof tema; setTema(v); guardarLocal("ruum:pref:tema", v); programarSincronizacionGeneral({ tema: v }); setToastMensaje(`Tema aplicado: ${v}`); }}>{["Claro", "Oscuro", "Automático"].map(v => <option key={v}>{v}</option>)}</select></FilaPreferencia>
      <FilaPreferencia titulo="Unidades" icono="M4 5h16v14H4V5Z M8 5v5 M12 5v3 M16 5v5"><select aria-label="Unidades de medida" value={unidades} onChange={e => { const v = e.target.value as typeof unidades; setUnidades(v); guardarLocal("ruum:pref:unidades", v); programarSincronizacionGeneral({ unidades: v }); setToastMensaje(`Unidades actualizadas: ${v}`); }}>{["Métrico", "Imperial"].map(v => <option key={v}>{v}</option>)}</select></FilaPreferencia>
      <FilaPreferencia titulo="Accesibilidad" icono="M12 3v1 M4 8h16 M12 8v8 M8 21l4-5 4 5"><select aria-label="Accesibilidad" value={accesibilidad} onChange={e => { const v = e.target.value as typeof accesibilidad; setAccesibilidad(v); guardarLocal("ruum:pref:accesibilidad", v); programarSincronizacionGeneral({ accesibilidad: v }); setToastMensaje(`Accesibilidad configurada: ${v}`); }}>{["Estándar", "Texto grande", "Alto contraste"].map(v => <option key={v}>{v}</option>)}</select></FilaPreferencia>
      <h2>PRIVACIDAD</h2>
      <FilaPreferencia titulo="Biometría" icono="M6 16V9a6 6 0 0 1 12 0v7 M9 19V9a3 3 0 0 1 6 0v11 M12 8v14"><Interruptor activo={biometrico} onAlternar={handleToggleBiometrico} etiquetaAria="Inicio biométrico" /></FilaPreferencia>
      <FilaPreferencia titulo="Ubicación" icono="M12 22s8-8 8-13a8 8 0 0 0-16 0c0 5 8 13 8 13Z M12 6v6"><Interruptor activo={ubicacion} onAlternar={handleToggleUbicacion} etiquetaAria="Ubicación en tiempo real" /></FilaPreferencia>
      <FilaPreferencia titulo="Uso de datos" icono="M4 4h16v16H4V4Z M8 16v-4 M12 16V8 M16 16v-6"><select aria-label="Uso de datos" value={usoDatos} onChange={e => { const v = e.target.value as typeof usoDatos; setUsoDatos(v); guardarLocal("ruum:pref:usoDatos", v); programarSincronizacionGeneral({ usoDatos: v }); setToastMensaje(`Uso de datos: ${v}`); }}>{["Activado", "Desactivado"].map(v => <option key={v}>{v}</option>)}</select></FilaPreferencia>
    </div>
    <div className="user-preferences-feedback" role="status" aria-live="polite">{toastMensaje}</div>
    {notificacionesAbiertas && <HojaTareaCuenta titulo="Notificaciones y alertas" extendida cerrar={cerrarNotificaciones}><div className="user-preferences-notifications">{notificaciones.map(([titulo, activo, cambiar]) => <FilaPreferencia key={titulo} titulo={titulo}><Interruptor activo={activo} onAlternar={cambiar} etiquetaAria={titulo} /></FilaPreferencia>)}</div></HojaTareaCuenta>}
  </div>;
}
function FilaPreferencia({ titulo, icono, children }: { titulo: string; icono?: string; children: ReactNode }) {
  return <div className="user-preference-row">{icono && <Icono d={icono} className="size-4 shrink-0" />}<span>{titulo}</span>{children}</div>;
}
