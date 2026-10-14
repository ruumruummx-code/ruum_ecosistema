"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icono } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { actualizarPreferenciasNotificaciones } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

export interface PreferenciasProps {
  usuario?: Usuario | null;
}

/* ─────────────────────────────────────────────────────────────
   Iconos SVG accesibles
───────────────────────────────────────────────────────────── */

function IconoAjustes({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconoCampana({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconoCorreo({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconoMensaje({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconoEtiqueta({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function IconoCamion({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconoCamara({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconoTarjeta({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function IconoAlertaTriangulo({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconoPaleta({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function IconoRegla({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 5 4 4" />
      <path d="m13 7 4 4" />
      <path d="m11 9 4 4" />
      <path d="m9 11 4 4" />
      <path d="m17 3 4 4L7 21l-4-4L17 3z" />
    </svg>
  );
}

function IconoAccesibilidad({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="4" r="2" />
      <path d="m4.5 8.5 7.5 2 7.5-2" />
      <path d="M12 10.5V20" />
      <path d="m8 22 4-2 4 2" />
    </svg>
  );
}

function IconoHuella({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 0 0 8 11a4 4 0 1 1 8 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0 0 15.5 16m-.786 5.568a18.064 18.064 0 0 0 2.274-3.068" />
    </svg>
  );
}

function IconoUbicacion({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconoBaseDatos({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

function IconoInfo({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function IconoChevron({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconoCheck({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Componente Toggle Switch
───────────────────────────────────────────────────────────── */

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
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a2342] disabled:opacity-50",
        activo ? "bg-[#0a2342]" : "bg-[#d5e2f0]",
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
   Componente Principal Preferencias
───────────────────────────────────────────────────────────── */

type TipoModal = "tema" | "unidades" | "accesibilidad" | "datos" | null;

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
  // Notificaciones generales
  const [notifPush, setNotifPush] = useState(usuario?.notificaciones_push ?? true);
  const [notifEmail, setNotifEmail] = useState(usuario?.notificaciones_email ?? true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(usuario?.notificaciones_sms_whatsapp ?? false);
  const [notifPromo, setNotifPromo] = useState(usuario?.notificaciones_promocionales ?? false);

  // Alertas de traslado
  const [alertaViaje, setAlertaViaje] = useState(usuario?.alertas_viaje ?? true);
  const [alertaEvidencia, setAlertaEvidencia] = useState(usuario?.alertas_evidencia ?? true);
  const [alertaPago, setAlertaPago] = useState(usuario?.alertas_pago ?? true);
  const [alertaIncidente, setAlertaIncidente] = useState(() => leerLocal("ruum:pref:alertaIncidente", true));

  // Idioma
  const [idioma, setIdioma] = useState<"es" | "en">(() => leerLocal("ruum:pref:idioma", "es"));

  // Preferencias de la app
  const [tema, setTema] = useState<"Claro" | "Oscuro" | "Automático">(() => leerLocal("ruum:pref:tema", "Claro"));
  const [unidades, setUnidades] = useState<"Métrico" | "Imperial">(() => leerLocal("ruum:pref:unidades", "Métrico"));
  const [accesibilidad, setAccesibilidad] = useState<"Estándar" | "Texto grande" | "Alto contraste">(() => leerLocal("ruum:pref:accesibilidad", "Estándar"));

  // Privacidad y seguridad
  const [biometrico, setBiometrico] = useState(() => leerLocal("ruum:pref:biometrico", true));
  const [ubicacion, setUbicacion] = useState(() => leerLocal("ruum:pref:ubicacion", true));
  const [usoDatos, setUsoDatos] = useState<"Activado" | "Desactivado">(() => leerLocal("ruum:pref:usoDatos", "Activado"));

  // Estado del modal y selección temporal
  const [modalAbierto, setModalAbierto] = useState<TipoModal>(null);
  const [tempTema, setTempTema] = useState<"Claro" | "Oscuro" | "Automático">("Claro");
  const [tempUnidades, setTempUnidades] = useState<"Métrico" | "Imperial">("Métrico");
  const [tempAccesibilidad, setTempAccesibilidad] = useState<"Estándar" | "Texto grande" | "Alto contraste">("Estándar");
  const [tempDatos, setTempDatos] = useState<"Activado" | "Desactivado">("Activado");

  // Toast de feedback
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // Cerrar modales con Escape
  useEffect(() => {
    function manejarKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalAbierto(null);
      }
    }
    window.addEventListener("keydown", manejarKeyDown);
    return () => window.removeEventListener("keydown", manejarKeyDown);
  }, []);

  // Timer para limpiar toast
  useEffect(() => {
    if (!toastMensaje) return;
    const t = setTimeout(() => setToastMensaje(null), 3000);
    return () => clearTimeout(t);
  }, [toastMensaje]);

  // Función genérica para guardar campo en Supabase si aplica
  async function sincronizarNotificacion(campo: string, valor: boolean) {
    guardarLocal(`ruum:pref:${campo}`, valor);
    if (tieneSupabaseConfigurado()) {
      try {
        const cliente = crearClienteNavegador();
        await actualizarPreferenciasNotificaciones(cliente, { [campo]: valor });
      } catch (err) {
        console.warn("[preferencias] Error sincronizando con Supabase:", err);
      }
    }
  }

  function handleTogglePush() {
    const nuevo = !notifPush;
    setNotifPush(nuevo);
    void sincronizarNotificacion("notificaciones_push", nuevo);
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
    setToastMensaje(nuevo ? "Alertas de incidentes activadas" : "Alertas de incidentes desactivadas");
  }

  function handleCambiarIdioma(nuevo: "es" | "en") {
    setIdioma(nuevo);
    guardarLocal("ruum:pref:idioma", nuevo);
    setToastMensaje(nuevo === "es" ? "Idioma cambiado a Español (México)" : "Language changed to English (US)");
  }

  function handleToggleBiometrico() {
    const nuevo = !biometrico;
    setBiometrico(nuevo);
    guardarLocal("ruum:pref:biometrico", nuevo);
    setToastMensaje(nuevo ? "Inicio biométrico activado" : "Inicio biométrico desactivado");
  }

  function handleToggleUbicacion() {
    const nuevo = !ubicacion;
    setUbicacion(nuevo);
    guardarLocal("ruum:pref:ubicacion", nuevo);
    setToastMensaje(nuevo ? "Ubicación en tiempo real activada" : "Ubicación en tiempo real desactivada");
  }

  // Modales
  function abrirModal(tipo: TipoModal) {
    if (tipo === "tema") setTempTema(tema);
    if (tipo === "unidades") setTempUnidades(unidades);
    if (tipo === "accesibilidad") setTempAccesibilidad(accesibilidad);
    if (tipo === "datos") setTempDatos(usoDatos);
    setModalAbierto(tipo);
  }

  function aplicarModal() {
    if (modalAbierto === "tema") {
      setTema(tempTema);
      guardarLocal("ruum:pref:tema", tempTema);
      setToastMensaje(`Tema aplicado: ${tempTema}`);
    } else if (modalAbierto === "unidades") {
      setUnidades(tempUnidades);
      guardarLocal("ruum:pref:unidades", tempUnidades);
      setToastMensaje(`Unidades actualizadas: ${tempUnidades}`);
    } else if (modalAbierto === "accesibilidad") {
      setAccesibilidad(tempAccesibilidad);
      guardarLocal("ruum:pref:accesibilidad", tempAccesibilidad);
      setToastMensaje(`Accesibilidad configurada: ${tempAccesibilidad}`);
    } else if (modalAbierto === "datos") {
      setUsoDatos(tempDatos);
      guardarLocal("ruum:pref:usoDatos", tempDatos);
      setToastMensaje(`Uso de datos: ${tempDatos}`);
    }
    setModalAbierto(null);
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Toast flotante */}
      {toastMensaje && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-[#0a2342] px-5 py-3 text-xs font-semibold text-[#fff] shadow-xl animate-fade-in"
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-emerald-400 text-[#0a2342]">
            <IconoCheck className="size-3" />
          </span>
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Header con botón regresar */}
      <header className="flex items-center gap-3.5 border-b border-[#f0f4fa] bg-white px-3 py-3 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <Link
          href="/cuenta"
          aria-label="Volver a mi cuenta"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f2f6fc] text-[#0a2342] transition-all hover:bg-[#e3ebf5] active:scale-95"
        >
          <Icono nombre="atras" className="size-4" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-tight text-[#0a2342] leading-snug">
            Preferencias
          </h1>
          <p className="text-[12px] font-medium text-[#4e5f80]">
            Personaliza tu experiencia
          </p>
        </div>
      </header>

      {/* Hero: Tus preferencias */}
      <section
        aria-label="Resumen de preferencias"
        className="relative overflow-hidden rounded-[26px] p-6 text-[#fff] shadow-[0_16px_32px_-12px_rgba(11,30,51,0.4)]"
        style={{ background: "linear-gradient(135deg, #0a2342 0%, #143560 100%)" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-10 size-36 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)" }}
        />
        <div className="relative z-[1] flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-white/12 text-white backdrop-blur-sm">
            <IconoAjustes className="size-7 text-white" />
          </div>
          <div>
            <h2 className="text-[20px] font-extrabold tracking-tight text-[#fff] leading-tight">
              Tus preferencias
            </h2>
            <p className="mt-1 text-[13px] font-medium text-[rgba(255,255,255,0.7)] leading-relaxed">
              Configura notificaciones, idioma y privacidad a tu medida
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECCIÓN: NOTIFICACIONES
      ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#4e5f80]">
          Notificaciones
        </h2>
        <div className="overflow-hidden rounded-[22px] border border-[#eef2f7] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
          {/* Push */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#e9f3ee] text-[#1f6b4a]">
                <IconoCampana className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Notificaciones push
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Alertas en tiempo real del traslado
                </span>
              </div>
            </div>
            <Interruptor
              activo={notifPush}
              onAlternar={handleTogglePush}
              etiquetaAria="Notificaciones push"
            />
          </div>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* Email */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#e9f3ee] text-[#1f6b4a]">
                <IconoCorreo className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Correo electrónico
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Resúmenes, confirmaciones y facturas
                </span>
              </div>
            </div>
            <Interruptor
              activo={notifEmail}
              onAlternar={handleToggleEmail}
              etiquetaAria="Correo electrónico"
            />
          </div>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* WhatsApp / SMS */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#e9f3ee] text-[#1f6b4a]">
                <IconoMensaje className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  WhatsApp / SMS
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Mensajes de estado del traslado
                </span>
              </div>
            </div>
            <Interruptor
              activo={notifWhatsapp}
              onAlternar={handleToggleWhatsapp}
              etiquetaAria="WhatsApp / SMS"
            />
          </div>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* Promociones */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#fef4e6] text-[#b36b1e]">
                <IconoEtiqueta className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Promociones
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Ofertas y novedades de Ruum Ruum
                </span>
              </div>
            </div>
            <Interruptor
              activo={notifPromo}
              onAlternar={handleTogglePromo}
              etiquetaAria="Promociones"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          SECCIÓN: ALERTAS DE TRASLADO
      ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#4e5f80]">
          Alertas de traslado
        </h2>
        <div className="overflow-hidden rounded-[22px] border border-[#eef2f7] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
          {/* Estado del traslado */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f0f5fe] text-[#2e5a88]">
                <IconoCamion className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Estado del traslado
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Conductor asignado, en camino, llegada
                </span>
              </div>
            </div>
            <Interruptor
              activo={alertaViaje}
              onAlternar={handleToggleViaje}
              etiquetaAria="Estado del traslado"
            />
          </div>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* Evidencia disponible */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f0f5fe] text-[#2e5a88]">
                <IconoCamara className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Evidencia disponible
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Check inicial y final cargados
                </span>
              </div>
            </div>
            <Interruptor
              activo={alertaEvidencia}
              onAlternar={handleToggleEvidencia}
              etiquetaAria="Evidencia disponible"
            />
          </div>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* Alertas de pago */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f0f5fe] text-[#2e5a88]">
                <IconoTarjeta className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Alertas de pago
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Confirmaciones y cargos
                </span>
              </div>
            </div>
            <Interruptor
              activo={alertaPago}
              onAlternar={handleTogglePago}
              etiquetaAria="Alertas de pago"
            />
          </div>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* Incidentes */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#fdeaea] text-[#b33c3c]">
                <IconoAlertaTriangulo className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Incidentes
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Problemas durante el traslado
                </span>
              </div>
            </div>
            <Interruptor
              activo={alertaIncidente}
              onAlternar={handleToggleIncidente}
              etiquetaAria="Incidentes"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          SECCIÓN: IDIOMA Y REGIÓN
      ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#4e5f80]">
          Idioma y región
        </h2>
        <div className="overflow-hidden rounded-[22px] border border-[#eef2f7] bg-white p-[18px] shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-0" role="radiogroup" aria-label="Selección de idioma">
            {/* Español */}
            <div
              role="radio"
              aria-checked={idioma === "es"}
              tabIndex={0}
              onClick={() => handleCambiarIdioma("es")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCambiarIdioma("es");
                }
              }}
              className="flex cursor-pointer items-center gap-3 border-b border-[#f0f4fa] py-3.5 transition first:pt-0 hover:bg-[#fafcfe]"
            >
              <div
                className={[
                  "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition",
                  idioma === "es" ? "border-[#0a2342] bg-[#0a2342]" : "border-[#d5e2f0] bg-white",
                ].join(" ")}
              >
                {idioma === "es" && <span className="size-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[#0a2342]">Español (México)</div>
                <div className="text-[12px] font-medium text-[#4e5f80]">Idioma predeterminado</div>
              </div>
            </div>

            {/* English */}
            <div
              role="radio"
              aria-checked={idioma === "en"}
              tabIndex={0}
              onClick={() => handleCambiarIdioma("en")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCambiarIdioma("en");
                }
              }}
              className="flex cursor-pointer items-center gap-3 py-3.5 transition last:pb-0 hover:bg-[#fafcfe]"
            >
              <div
                className={[
                  "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition",
                  idioma === "en" ? "border-[#0a2342] bg-[#0a2342]" : "border-[#d5e2f0] bg-white",
                ].join(" ")}
              >
                {idioma === "en" && <span className="size-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[#0a2342]">English (US)</div>
                <div className="text-[12px] font-medium text-[#4e5f80]">English</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          SECCIÓN: PREFERENCIAS DE LA APP
      ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#4e5f80]">
          Preferencias de la app
        </h2>
        <div className="overflow-hidden rounded-[22px] border border-[#eef2f7] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
          {/* Tema */}
          <button
            type="button"
            onClick={() => abrirModal("tema")}
            className="flex w-full items-center justify-between gap-3.5 px-[18px] py-[15px] text-left transition active:bg-[#f8fbfe] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f2eef9] text-[#5e3b8c]">
                <IconoPaleta className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Tema de la aplicación
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Claro, oscuro o automático
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[13px] font-semibold text-[#4e5f80]">{tema}</span>
              <IconoChevron className="text-[#c3cfdd]" />
            </div>
          </button>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* Unidades */}
          <button
            type="button"
            onClick={() => abrirModal("unidades")}
            className="flex w-full items-center justify-between gap-3.5 px-[18px] py-[15px] text-left transition active:bg-[#f8fbfe] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f2eef9] text-[#5e3b8c]">
                <IconoRegla className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Unidades de medida
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Kilómetros, litros, moneda
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[13px] font-semibold text-[#4e5f80]">{unidades}</span>
              <IconoChevron className="text-[#c3cfdd]" />
            </div>
          </button>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* Accesibilidad */}
          <button
            type="button"
            onClick={() => abrirModal("accesibilidad")}
            className="flex w-full items-center justify-between gap-3.5 px-[18px] py-[15px] text-left transition active:bg-[#f8fbfe] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f2eef9] text-[#5e3b8c]">
                <IconoAccesibilidad className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Accesibilidad
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Texto grande, alto contraste
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[13px] font-semibold text-[#4e5f80]">{accesibilidad}</span>
              <IconoChevron className="text-[#c3cfdd]" />
            </div>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          SECCIÓN: PRIVACIDAD Y SEGURIDAD
      ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#4e5f80]">
          Privacidad y seguridad
        </h2>
        <div className="overflow-hidden rounded-[22px] border border-[#eef2f7] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
          {/* Biométrico */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f0f5fe] text-[#2e5a88]">
                <IconoHuella className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Inicio de sesión biométrico
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Face ID o huella digital
                </span>
              </div>
            </div>
            <Interruptor
              activo={biometrico}
              onAlternar={handleToggleBiometrico}
              etiquetaAria="Inicio de sesión biométrico"
            />
          </div>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* Ubicación */}
          <div className="flex items-center justify-between gap-3.5 px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f0f5fe] text-[#2e5a88]">
                <IconoUbicacion className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Ubicación en tiempo real
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Permitir seguimiento del conductor
                </span>
              </div>
            </div>
            <Interruptor
              activo={ubicacion}
              onAlternar={handleToggleUbicacion}
              etiquetaAria="Ubicación en tiempo real"
            />
          </div>

          <div className="relative">
            <span aria-hidden="true" className="absolute left-[68px] right-[18px] top-0 h-px bg-[#f0f4fa]" />
          </div>

          {/* Uso de datos */}
          <button
            type="button"
            onClick={() => abrirModal("datos")}
            className="flex w-full items-center justify-between gap-3.5 px-[18px] py-[15px] text-left transition active:bg-[#f8fbfe] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f0f5fe] text-[#2e5a88]">
                <IconoBaseDatos className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <span className="block text-[14.5px] font-bold tracking-tight text-[#0a2342]">
                  Uso de datos
                </span>
                <span className="block truncate text-[12px] font-medium text-[#4e5f80]">
                  Compartir datos anónimos de uso
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[13px] font-semibold text-[#4e5f80]">{usoDatos}</span>
              <IconoChevron className="text-[#c3cfdd]" />
            </div>
          </button>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#dfe8f3] bg-[#f0f5fe] p-4 text-[#3d5470]">
        <IconoInfo className="mt-0.5 size-5 shrink-0 text-[#2e5a88]" />
        <p className="text-[12.5px] font-medium leading-relaxed">
          Puedes cambiar tus preferencias en cualquier momento. Las alertas de traslado activo se recomiendan mantener activadas para no perderte actualizaciones importantes.
        </p>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          MODAL: TEMA (Bottom Sheet)
      ═════════════════════════════════════════════════════════════ */}
      {modalAbierto === "tema" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-tema-titulo"
          aria-describedby="modal-tema-desc"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:items-center sm:p-4"
          onClick={() => setModalAbierto(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#f2eef9] text-[#5e3b8c]">
              <IconoPaleta className="size-7" />
            </div>
            <h2 id="modal-tema-titulo" className="text-center text-[19px] font-extrabold text-[#0a2342] tracking-tight">
              Tema de la aplicación
            </h2>
            <p id="modal-tema-desc" className="mt-1 text-center text-[13.5px] font-medium text-[#4e5f80] leading-relaxed">
              Elige cómo quieres ver Ruum Ruum
            </p>

            <div className="mt-5 flex flex-col gap-2.5" role="radiogroup" aria-label="Opciones de tema">
              {[
                { valor: "Claro", sub: "Interfaz luminosa y nítida" },
                { valor: "Oscuro", sub: "Interfaz oscura, ideal de noche" },
                { valor: "Automático", sub: "Cambia según la hora del día" },
              ].map((opt) => {
                const activo = tempTema === opt.valor;
                return (
                  <div
                    key={opt.valor}
                    role="radio"
                    aria-checked={activo}
                    tabIndex={0}
                    onClick={() => setTempTema(opt.valor as typeof tempTema)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTempTema(opt.valor as typeof tempTema);
                      }
                    }}
                    className={[
                      "flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-3.5 transition",
                      activo
                        ? "border-[#0a2342] bg-white shadow-[0_0_0_3px_rgba(11,30,51,0.06)]"
                        : "border-[#e6edf6] bg-[#fafcfe] hover:border-[#cbd7e6]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition",
                        activo ? "border-[#0a2342] bg-[#0a2342]" : "border-[#d5e2f0] bg-white",
                      ].join(" ")}
                    >
                      {activo && <span className="size-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-[#0a2342]">{opt.valor}</div>
                      <div className="text-[12px] font-medium text-[#4e5f80]">{opt.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={aplicarModal}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a2342] py-3.5 text-center text-[15px] font-bold text-white shadow-lg transition hover:bg-[#143560] active:scale-98 cursor-pointer"
              >
                <IconoCheck className="size-4" /> Aplicar
              </button>
              <button
                type="button"
                onClick={() => setModalAbierto(null)}
                className="w-full py-2.5 text-center text-[14px] font-bold text-[#4e5f80] transition hover:text-[#0a2342] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL: UNIDADES (Bottom Sheet)
      ═════════════════════════════════════════════════════════════ */}
      {modalAbierto === "unidades" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-unidades-titulo"
          aria-describedby="modal-unidades-desc"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:items-center sm:p-4"
          onClick={() => setModalAbierto(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#f2eef9] text-[#5e3b8c]">
              <IconoRegla className="size-7" />
            </div>
            <h2 id="modal-unidades-titulo" className="text-center text-[19px] font-extrabold text-[#0a2342] tracking-tight">
              Unidades de medida
            </h2>
            <p id="modal-unidades-desc" className="mt-1 text-center text-[13.5px] font-medium text-[#4e5f80] leading-relaxed">
              Selecciona el sistema de medidas que prefieras
            </p>

            <div className="mt-5 flex flex-col gap-2.5" role="radiogroup" aria-label="Opciones de unidades">
              {[
                { valor: "Métrico", sub: "Kilómetros, litros, MXN" },
                { valor: "Imperial", sub: "Millas, galones, USD" },
              ].map((opt) => {
                const activo = tempUnidades === opt.valor;
                return (
                  <div
                    key={opt.valor}
                    role="radio"
                    aria-checked={activo}
                    tabIndex={0}
                    onClick={() => setTempUnidades(opt.valor as typeof tempUnidades)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTempUnidades(opt.valor as typeof tempUnidades);
                      }
                    }}
                    className={[
                      "flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-3.5 transition",
                      activo
                        ? "border-[#0a2342] bg-white shadow-[0_0_0_3px_rgba(11,30,51,0.06)]"
                        : "border-[#e6edf6] bg-[#fafcfe] hover:border-[#cbd7e6]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition",
                        activo ? "border-[#0a2342] bg-[#0a2342]" : "border-[#d5e2f0] bg-white",
                      ].join(" ")}
                    >
                      {activo && <span className="size-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-[#0a2342]">{opt.valor}</div>
                      <div className="text-[12px] font-medium text-[#4e5f80]">{opt.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={aplicarModal}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a2342] py-3.5 text-center text-[15px] font-bold text-white shadow-lg transition hover:bg-[#143560] active:scale-98 cursor-pointer"
              >
                <IconoCheck className="size-4" /> Aplicar
              </button>
              <button
                type="button"
                onClick={() => setModalAbierto(null)}
                className="w-full py-2.5 text-center text-[14px] font-bold text-[#4e5f80] transition hover:text-[#0a2342] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL: ACCESIBILIDAD (Bottom Sheet)
      ═════════════════════════════════════════════════════════════ */}
      {modalAbierto === "accesibilidad" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-accesibilidad-titulo"
          aria-describedby="modal-accesibilidad-desc"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:items-center sm:p-4"
          onClick={() => setModalAbierto(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#f2eef9] text-[#5e3b8c]">
              <IconoAccesibilidad className="size-7" />
            </div>
            <h2 id="modal-accesibilidad-titulo" className="text-center text-[19px] font-extrabold text-[#0a2342] tracking-tight">
              Accesibilidad
            </h2>
            <p id="modal-accesibilidad-desc" className="mt-1 text-center text-[13.5px] font-medium text-[#4e5f80] leading-relaxed">
              Ajusta la interfaz para que sea más fácil de usar
            </p>

            <div className="mt-5 flex flex-col gap-2.5" role="radiogroup" aria-label="Opciones de accesibilidad">
              {[
                { valor: "Estándar", sub: "Tamaño de texto y contraste predeterminados" },
                { valor: "Texto grande", sub: "Aumenta el tamaño de la tipografía" },
                { valor: "Alto contraste", sub: "Mejora la legibilidad con colores más fuertes" },
              ].map((opt) => {
                const activo = tempAccesibilidad === opt.valor;
                return (
                  <div
                    key={opt.valor}
                    role="radio"
                    aria-checked={activo}
                    tabIndex={0}
                    onClick={() => setTempAccesibilidad(opt.valor as typeof tempAccesibilidad)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTempAccesibilidad(opt.valor as typeof tempAccesibilidad);
                      }
                    }}
                    className={[
                      "flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-3.5 transition",
                      activo
                        ? "border-[#0a2342] bg-white shadow-[0_0_0_3px_rgba(11,30,51,0.06)]"
                        : "border-[#e6edf6] bg-[#fafcfe] hover:border-[#cbd7e6]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition",
                        activo ? "border-[#0a2342] bg-[#0a2342]" : "border-[#d5e2f0] bg-white",
                      ].join(" ")}
                    >
                      {activo && <span className="size-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-[#0a2342]">{opt.valor}</div>
                      <div className="text-[12px] font-medium text-[#4e5f80]">{opt.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={aplicarModal}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a2342] py-3.5 text-center text-[15px] font-bold text-white shadow-lg transition hover:bg-[#143560] active:scale-98 cursor-pointer"
              >
                <IconoCheck className="size-4" /> Aplicar
              </button>
              <button
                type="button"
                onClick={() => setModalAbierto(null)}
                className="w-full py-2.5 text-center text-[14px] font-bold text-[#4e5f80] transition hover:text-[#0a2342] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL: USO DE DATOS (Bottom Sheet)
      ═════════════════════════════════════════════════════════════ */}
      {modalAbierto === "datos" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-datos-titulo"
          aria-describedby="modal-datos-desc"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:items-center sm:p-4"
          onClick={() => setModalAbierto(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#f0f5fe] text-[#2e5a88]">
              <IconoBaseDatos className="size-7" />
            </div>
            <h2 id="modal-datos-titulo" className="text-center text-[19px] font-extrabold text-[#0a2342] tracking-tight">
              Uso de datos
            </h2>
            <p id="modal-datos-desc" className="mt-1 text-center text-[13.5px] font-medium text-[#4e5f80] leading-relaxed">
              Ayúdanos a mejorar Ruum Ruum compartiendo datos anónimos de uso
            </p>

            <div className="mt-5 flex flex-col gap-2.5" role="radiogroup" aria-label="Opciones de uso de datos">
              {[
                { valor: "Activado", sub: "Compartir datos anónimos de uso" },
                { valor: "Desactivado", sub: "No compartir datos de uso" },
              ].map((opt) => {
                const activo = tempDatos === opt.valor;
                return (
                  <div
                    key={opt.valor}
                    role="radio"
                    aria-checked={activo}
                    tabIndex={0}
                    onClick={() => setTempDatos(opt.valor as typeof tempDatos)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTempDatos(opt.valor as typeof tempDatos);
                      }
                    }}
                    className={[
                      "flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-3.5 transition",
                      activo
                        ? "border-[#0a2342] bg-white shadow-[0_0_0_3px_rgba(11,30,51,0.06)]"
                        : "border-[#e6edf6] bg-[#fafcfe] hover:border-[#cbd7e6]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition",
                        activo ? "border-[#0a2342] bg-[#0a2342]" : "border-[#d5e2f0] bg-white",
                      ].join(" ")}
                    >
                      {activo && <span className="size-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-[#0a2342]">{opt.valor}</div>
                      <div className="text-[12px] font-medium text-[#4e5f80]">{opt.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={aplicarModal}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a2342] py-3.5 text-center text-[15px] font-bold text-white shadow-lg transition hover:bg-[#143560] active:scale-98 cursor-pointer"
              >
                <IconoCheck className="size-4" /> Aplicar
              </button>
              <button
                type="button"
                onClick={() => setModalAbierto(null)}
                className="w-full py-2.5 text-center text-[14px] font-bold text-[#4e5f80] transition hover:text-[#0a2342] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
