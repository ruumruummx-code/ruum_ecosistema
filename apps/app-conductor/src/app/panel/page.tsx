"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Aviso } from "@ruum/ui";
import { ConfirmarDisponibilidad } from "../ConfirmarDisponibilidad";
import { RegistroViajeActivo } from "../ViajeActivoContext";
import { EstadoRevisionConductor } from "./EstadoRevisionConductor";
import { usePanelData } from "./usePanelData";
import { registroViajeActivoDesdePasaporte } from "../active-trip-state";
import { PanelActiveTripCard } from "./PanelActiveTripCard";
import { PanelOpportunitiesCard } from "./PanelOpportunitiesCard";
import { PanelMetrics } from "./PanelMetrics";
import { PanelStatusRow } from "./PanelStatusRow";
import { PanelSupportSheet } from "./PanelSupportSheet";
import { soportaTrackingNativo, obtenerEstadoTrackingNativo } from "../../lib/background-tracking";
import { getBatteryState, intervaloTrackingMs } from "../../lib/battery";
import { useCerrarSesion } from "../../lib/use-cerrar-sesion";

function PanelLoadingSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4" aria-label="Cargando panel operativo" aria-busy="true">
      <div className="h-16 w-full animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <div className="h-[88px] animate-pulse rounded-2xl bg-slate-200/70 md:h-[138px]" />
        <div className="h-[88px] animate-pulse rounded-2xl bg-slate-200/70 md:h-[138px]" />
        <div className="h-[88px] animate-pulse rounded-2xl bg-slate-200/70 md:h-[138px]" />
        <div className="h-[88px] animate-pulse rounded-2xl bg-slate-200/70 md:h-[138px]" />
      </div>
      <div className="h-[164px] animate-pulse rounded-2xl bg-slate-200/70 md:h-[190px]" />
      <div className="grid grid-cols-2 gap-3 md:gap-5">
        <div className="h-[136px] animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-[136px] animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    </div>
  );
}

function SidebarMenuIcon({ name, active = false }: { name: string; active?: boolean }) {
  switch (name) {
    case "inicio":
      return active ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M11.3 2.5a1.1 1.1 0 0 1 1.4 0l8 6.8c.2.2.3.5.3.8V20a1.5 1.5 0 0 1-1.5 1.5h-4.8v-6.2h-5.4v6.2H4.5A1.5 1.5 0 0 1 3 20V10.1c0-.3.1-.6.3-.8l8-6.8Z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
          <path d="M9 21v-7h6v7" />
        </svg>
      );
    case "traslados":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9h16l-3.5-3.5" />
          <path d="M20 15H4l3.5 3.5" />
        </svg>
      );
    case "ganancias":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" />
          <rect x="15" y="10" width="6" height="4" rx="1" />
        </svg>
      );
    case "cuenta":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-3.8 3.6-6.5 8-6.5s8 2.7 8 6.5" />
        </svg>
      );
    case "preferencias":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
    case "notificaciones":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.8-2.5 2-2.5 3.5" />
          <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

const MENU_LATERAL = [
  { href: "/panel", label: "Inicio", icon: "inicio", active: true },
  { href: "/viajes", label: "Traslados", icon: "traslados", active: false },
  { href: "/ganancias", label: "Ganancias", icon: "ganancias", active: false },
  { href: "/cuenta", label: "Cuenta", icon: "cuenta", active: false },
  { href: "/cuenta/preferencias", label: "Preferencias", icon: "preferencias", active: false },
  { href: "/notificaciones", label: "Notificaciones", icon: "notificaciones", active: false },
  { href: "/cuenta/soporte", label: "Soporte", icon: "soporte", active: false },
] as const;

const MENU_INFERIOR_MOVIL = [
  { href: "/panel", label: "Inicio", icon: "inicio", active: true },
  { href: "/viajes", label: "Traslados", icon: "traslados", active: false },
  { href: "/cuenta", label: "Cuenta", icon: "cuenta", active: false },
] as const;

export default function PaginaPanel() {
  const { cerrarSesion, cerrandoSesion, errorCerrarSesion } = useCerrarSesion();
  const [soporteAbierto, setSoporteAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilMenuAbierto, setPerfilMenuAbierto] = useState(false);
  const [gpsActivo, setGpsActivo] = useState<boolean | null>(null);
  const [gpsUltimaSenal, setGpsUltimaSenal] = useState<Date | null>(null);
  const [pullOffset, setPullOffset] = useState(0);
  const [avisoPullBloqueado, setAvisoPullBloqueado] = useState(false);
  const [estaOnline, setEstaOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const actualizar = () => setEstaOnline(navigator.onLine);
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  const {
    cargando,
    refrescando,
    ultimaActualizacion,
    conductor,
    disponibilidad,
    disponibilidadPendiente,
    persistiendoDisponibilidad,
    enRevision,
    viajeActivoPrincipal,
    TrasladosDisponibles,
    errorDisponibilidad,
    documentoBloqueante,
    documentoPorVencer,
    notificacionesCount = 0,
    gananciasHoy = 0,
    trasladosHoy = 0,
    seleccionarDisponibilidad,
    persistirDisponibilidad,
    setDisponibilidadPendiente,
    recargar,
  } = usePanelData();

  const primerNombre = conductor?.nombre?.trim().split(/\s+/)[0] || "Héctor";
  const esDisponible = disponibilidad === "disponible";

  const alCambiarDisponibilidad = () => {
    if (disponibilidad === "en_viaje" || persistiendoDisponibilidad) return;
    const nuevoEstado = esDisponible ? "no_disponible" : "disponible";
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
    seleccionarDisponibilidad(nuevoEstado);
  };

  // Pull-to-refresh nativo simple (solo en móvil, desde el top)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let startY = 0;
    let pulling = false;
    let bloqueadoNotificado = false;
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
        bloqueadoNotificado = false;
      } else {
        pulling = false;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      if (document.body.classList.contains("conductor-tiene-viaje-activo")) {
        const diff = e.touches[0].clientY - startY;
        if (diff > 32 && !bloqueadoNotificado) {
          bloqueadoNotificado = true;
          setAvisoPullBloqueado(true);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
          window.setTimeout(() => setAvisoPullBloqueado(false), 2500);
        }
        return;
      }
      const diff = e.touches[0].clientY - startY;
      if (diff > 0 && diff < 96) {
        setPullOffset(diff * 0.5);
      }
    };
    const onTouchEnd = () => {
      if (pullOffset > 48 && !refrescando && !document.body.classList.contains("conductor-tiene-viaje-activo")) {
        void recargar();
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(20);
      }
      setPullOffset(0);
      pulling = false;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullOffset, refrescando, recargar]);

  useEffect(() => {
    // Tracking nativo con intervalo adaptado a disponibilidad + batería (OFF-002)
    if (soportaTrackingNativo()) {
      let cancelado = false;
      let interval: number | undefined;
      const iniciar = async () => {
        const battery = await getBatteryState();
        const intervaloMs = intervaloTrackingMs({
          disponible: disponibilidad === "disponible",
          enViaje: Boolean(viajeActivoPrincipal),
          battery,
        });
        const verificarTracking = async () => {
          try {
            const status = await obtenerEstadoTrackingNativo();
            const activo = Boolean(status.active && !status.lastError);
            if (!cancelado) {
              setGpsActivo(activo);
              if (activo) setGpsUltimaSenal(new Date());
            }
          } catch {
            if (!cancelado) setGpsActivo(false);
          }
        };
        void verificarTracking();
        interval = window.setInterval(verificarTracking, intervaloMs);
      };
      void iniciar();
      return () => {
        cancelado = true;
        if (interval !== undefined) window.clearInterval(interval);
      };
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsActivo(false);
      return;
    }
    const altaPrecision = disponibilidad === "disponible" || Boolean(viajeActivoPrincipal);
    const id = navigator.geolocation.watchPosition(
      () => {
        setGpsActivo(true);
        setGpsUltimaSenal(new Date());
      },
      () => setGpsActivo(false),
      {
        enableHighAccuracy: altaPrecision,
        maximumAge: altaPrecision ? 30_000 : 60_000,
        timeout: altaPrecision ? 15_000 : 10_000,
      }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [disponibilidad, viajeActivoPrincipal]);

  if (enRevision) {
    return (
      <EstadoRevisionConductor
        conductorId={enRevision.conductorId}
        solicitudId={enRevision.solicitudId}
        nombre={enRevision.nombre}
        documentosIniciales={enRevision.documentos}
        estadoExpediente={enRevision.estado}
        enviadoEn={enRevision.enviadoEn}
        onSalir={() => void cerrarSesion()}
      />
    );
  }

  return (
    <div
      className={`driver-dashboard flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-white md:bg-[#EEF3FA] md:p-4 lg:p-6 ${
        viajeActivoPrincipal ? "" : "driver-dashboard-empty"
      }`}
    >
      <RegistroViajeActivo
        viaje={viajeActivoPrincipal ? registroViajeActivoDesdePasaporte(viajeActivoPrincipal) : null}
      />

      {/* Indicador pull-to-refresh */}
      {pullOffset > 0 && (
        <div
          className="pointer-events-none fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1.5 shadow-md"
          aria-hidden="true"
        >
          <span className={`size-2 rounded-full ${pullOffset > 48 ? "bg-signal" : "bg-text-tertiary"}`} />
          <span className="font-body text-xs font-bold text-text-secondary">
            {pullOffset > 48 ? "Suelta para actualizar" : "Desliza para actualizar"}
          </span>
        </div>
      )}
      {avisoPullBloqueado && (
        <div
          className="pointer-events-none fixed left-1/2 top-3 z-50 flex -translate-x-1/2 animate-fadeIn items-center gap-2 rounded-full border border-amber-500/30 bg-surface-elevated px-3 py-1.5 shadow-md"
          role="status"
          aria-live="polite"
        >
          <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
          <span className="font-body text-xs font-bold text-text-primary">Actualización pausada durante viaje</span>
          <span className="font-body text-[11px] text-text-tertiary">🔒 termina el traslado</span>
        </div>
      )}
      {refrescando && (
        <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 h-1 bg-signal/20" aria-hidden="true">
          <div className="conductor-refresh-bar h-full w-1/3 animate-pulse bg-signal" />
        </div>
      )}

      {/* Marco principal: fluido en móvil, contenedor de 2 columnas con header superior en Web Desktop */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[calc(88px+env(safe-area-inset-bottom))] md:max-w-[1220px] md:overflow-hidden md:rounded-[28px] md:border md:border-[#DCE7F5] md:bg-[#F9FBFE] md:px-0 md:pb-0 md:shadow-[0_12px_40px_rgba(10,35,66,0.06)]">
        {/* HEADER MÓVIL (< md) */}
        <header
          className="grid min-h-16 grid-cols-[44px_1fr_88px] items-center gap-1 pt-[max(8px,env(safe-area-inset-top))] md:hidden"
          aria-label="Encabezado móvil del panel"
        >
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-[#0A2342] transition hover:bg-slate-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link href="/panel" className="cursor-pointer justify-self-center" aria-label="Ruum Ruum, inicio">
            <Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={132} height={43} priority className="h-9 w-auto" />
          </Link>

          <div className="flex items-center justify-end gap-0.5">
            <Link
              href="/notificaciones"
              className="relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-[#0A2342] transition hover:bg-slate-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF]"
              aria-label={
                notificacionesCount > 0
                  ? `Notificaciones (${notificacionesCount > 99 ? "99+" : notificacionesCount} sin leer)`
                  : "Notificaciones"
              }
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
              <span
                className="absolute right-2.5 top-2.5 size-2.5 rounded-full border-2 border-white bg-[#EF4444]"
                aria-hidden="true"
              />
            </Link>
            <button
              type="button"
              onClick={() => setSoporteAbierto(true)}
              aria-label="Abrir soporte técnico"
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-[#0A2342] transition hover:bg-slate-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
                <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
                <path d="M17 19c-1.1 1.2-2.7 2-5 2" />
              </svg>
            </button>
          </div>
        </header>

        {/* HEADER WEB / DESKTOP (md:) */}
        <header
          data-panel-desktop-header
          className="hidden h-20 shrink-0 items-center justify-between border-b border-[#E5EEF8] bg-white px-7 lg:px-9 md:flex"
          aria-label="Encabezado de escritorio"
        >
          <Link href="/panel" className="inline-flex cursor-pointer items-center" aria-label="Ruum Ruum, inicio">
            <Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={156} height={50} priority className="h-10 w-auto" />
          </Link>

          <div className="relative flex items-center gap-5">
            <span className="h-9 w-px bg-[#E5EEF8]" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setPerfilMenuAbierto((prev) => !prev)}
              aria-expanded={perfilMenuAbierto}
              aria-haspopup="menu"
              aria-label={`Menú de usuario: Hola, ${primerNombre}`}
              className="flex cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-2 text-left transition hover:bg-[#F3F7FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF]"
            >
              <span
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#DCE8FC] text-[#0066FF]"
                aria-hidden="true"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="8" r="3.8" />
                  <path d="M4 20c0-3.7 3.3-6.4 8-6.4s8 2.7 8 6.4" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-base font-extrabold leading-tight text-[#0A2342]">
                    Hola, {primerNombre}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-[#0A2342] transition-transform duration-200 ${perfilMenuAbierto ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <p className="mt-0.5 font-body text-xs text-[#566889]">
                  Hoy es un gran día para conducir 🚀
                </p>
              </div>
            </button>

            {perfilMenuAbierto && (
              <div
                role="menu"
                aria-label="Opciones del conductor"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl border border-[#DCE7F5] bg-white p-2 shadow-xl"
              >
                <Link
                  href="/cuenta/perfil"
                  role="menuitem"
                  onClick={() => setPerfilMenuAbierto(false)}
                  className="flex min-h-10 cursor-pointer items-center rounded-xl px-3 py-2 font-body text-sm font-semibold text-[#0A2342] transition hover:bg-[#F1F6FD]"
                >
                  Mi perfil
                </Link>
                <Link
                  href="/cuenta"
                  role="menuitem"
                  onClick={() => setPerfilMenuAbierto(false)}
                  className="flex min-h-10 cursor-pointer items-center rounded-xl px-3 py-2 font-body text-sm font-semibold text-[#0A2342] transition hover:bg-[#F1F6FD]"
                >
                  Cuenta
                </Link>
                <Link
                  href="/cuenta/preferencias"
                  role="menuitem"
                  onClick={() => setPerfilMenuAbierto(false)}
                  className="flex min-h-10 cursor-pointer items-center rounded-xl px-3 py-2 font-body text-sm font-semibold text-[#0A2342] transition hover:bg-[#F1F6FD]"
                >
                  Preferencias
                </Link>
                <div className="my-1 h-px bg-[#E5EEF8]" aria-hidden="true" />
                <button
                  type="button"
                  role="menuitem"
                  disabled={cerrandoSesion}
                  onClick={() => {
                    setPerfilMenuAbierto(false);
                    void cerrarSesion();
                  }}
                  className="flex min-h-10 w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left font-body text-sm font-bold text-danger transition hover:bg-danger-soft/30 disabled:opacity-50"
                >
                  {cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ESTRUCTURA DE DOS COLUMNAS EN DESKTOP / UNA COLUMNA EN MÓVIL */}
        <div className="flex flex-1 flex-col md:grid md:grid-cols-[248px_1fr] lg:grid-cols-[264px_1fr]">
          {/* MENÚ LATERAL IZQUIERDO PERSISTENTE (Web / Desktop) */}
          <aside
            data-panel-sidebar
            aria-label="Barra lateral de navegación"
            className="hidden flex-col justify-between border-r border-[#E5EEF8] bg-[#F5F9FE] px-4 py-6 md:flex lg:px-5"
          >
            <nav aria-label="Navegación principal" className="flex flex-col gap-1.5">
              {MENU_LATERAL.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={`flex min-h-12 cursor-pointer items-center gap-3.5 rounded-2xl px-4 py-3 font-body text-[15px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF] ${
                    item.active
                      ? "bg-[#DCE8FC] font-extrabold text-[#0057D9]"
                      : "font-semibold text-[#0A2342] hover:bg-[#E7F0FD] hover:text-[#0057D9]"
                  }`}
                >
                  <span className={item.active ? "text-[#0066FF]" : "text-[#0A2342]"}>
                    <SidebarMenuIcon name={item.icon} active={item.active} />
                  </span>
                  <span>{item.label}</span>
                  {item.icon === "notificaciones" && notificacionesCount > 0 && (
                    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#0066FF] px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {notificacionesCount > 99 ? "99+" : notificacionesCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <footer className="mt-8 flex flex-col gap-2.5 px-3 pt-4">
              <Link
                href="/legal/terminos"
                className="cursor-pointer font-body text-[12px] font-medium text-[#566889] transition hover:text-[#0057D9] hover:underline"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/legal/privacidad"
                className="cursor-pointer font-body text-[12px] font-medium text-[#566889] transition hover:text-[#0057D9] hover:underline"
              >
                Política de privacidad
              </Link>
            </footer>
          </aside>

          {/* ÁREA DE CONTENIDO PRINCIPAL */}
          <div className="flex min-w-0 flex-1 flex-col md:p-7 lg:p-10">
            {/* Aviso Modo Offline — compacto */}
            {!estaOnline && (
              <div className="mb-3">
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger-soft/20 px-3 py-2 shadow-sm"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="font-body text-sm leading-5 text-danger">
                    <span className="font-bold">⚠️ Sin conexión:</span> Ves datos guardados.
                  </p>
                  <button
                    type="button"
                    onClick={() => void recargar()}
                    className="inline-flex min-h-9 shrink-0 cursor-pointer items-center rounded-lg border border-danger/40 bg-surface px-2.5 py-1 font-body text-[11px] font-bold text-danger hover:bg-surface-elevated focus-visible:outline-none"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {cargando ? (
              <PanelLoadingSkeleton />
            ) : (
              <div className="driver-dashboard-content flex flex-1 flex-col gap-3 pb-2 md:gap-5 md:pb-0">
                {/* 1. Saludo y Avatar */}
                <section
                  className="driver-dashboard-welcome flex items-center gap-3.5 pt-1 md:gap-5 md:pt-0"
                  aria-labelledby="titulo-bienvenida"
                >
                  <span
                    className="inline-flex size-[58px] shrink-0 items-center justify-center rounded-full bg-[#DCE8FC] text-[#0066FF] md:size-[82px]"
                    aria-hidden="true"
                  >
                    <svg className="size-8 md:size-11" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="8" r="3.8" />
                      <path d="M4 20c0-3.7 3.3-6.4 8-6.4s8 2.7 8 6.4" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h1
                      id="titulo-bienvenida"
                      className="font-display text-[28px] font-black leading-none tracking-tight text-[#0A2342] md:text-[36px]"
                    >
                      ¡Hola, {primerNombre}!
                    </h1>
                    <p className="mt-1.5 font-body text-base leading-none text-[#566889] md:hidden">
                      Conduce, gana y avanza
                    </p>
                    <p className="mt-2 hidden font-body text-lg leading-none text-[#566889] md:block">
                      Hoy es un gran día para conducir 🚀
                    </p>
                  </div>
                </section>

                {/* 2. Fila de Estado (Switch de Disponibilidad) */}
                <section
                  className={`driver-availability-card rounded-2xl border p-4 shadow-[0_5px_20px_rgba(13,43,94,0.05)] transition-colors md:px-6 md:py-5 md:shadow-none ${
                    esDisponible
                      ? "border-[#E4ECF7] bg-white md:border-[#CBEAD9] md:bg-[#EAF7F0]"
                      : "border-[#E4ECF7] bg-white"
                  }`}
                  aria-labelledby="titulo-estado-conductor"
                >
                  <div className="flex items-center gap-3.5 md:gap-4">
                    <span
                      className={`inline-flex size-13 shrink-0 items-center justify-center rounded-full text-white shadow-sm md:size-14 ${
                        disponibilidad === "en_viaje"
                          ? "bg-amber-500"
                          : esDisponible
                            ? "bg-[#10B981]"
                            : "bg-slate-400"
                      }`}
                      aria-hidden="true"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="font-body text-xs font-semibold leading-none text-[#566889] md:hidden">
                        Estado
                      </p>
                      <h2
                        id="titulo-estado-conductor"
                        className="mt-1 font-display text-[22px] font-black leading-none text-[#0A2342] md:mt-0 md:text-2xl"
                      >
                        <span className="md:hidden">
                          {disponibilidad === "en_viaje"
                            ? "En viaje"
                            : esDisponible
                              ? "Disponible"
                              : "No disponible"}
                        </span>
                        <span className="hidden md:inline">
                          {disponibilidad === "en_viaje" ? (
                            <>
                              Estás <span className="text-amber-600">en viaje</span>
                            </>
                          ) : esDisponible ? (
                            <>
                              Estás <span className="text-[#10B981]">disponible</span>
                            </>
                          ) : (
                            <>
                              Estás <span className="text-slate-500">no disponible</span>
                            </>
                          )}
                        </span>
                      </h2>
                      <p className="mt-1 font-body text-xs sm:text-sm leading-none text-[#566889] md:mt-1.5 md:text-[15px]">
                        <span className="md:hidden">
                          {disponibilidad === "en_viaje"
                            ? "Traslado activo"
                            : esDisponible
                              ? "Recibiendo solicitudes"
                              : "Solicitudes pausadas"}
                        </span>
                        <span className="hidden md:inline">
                          {disponibilidad === "en_viaje"
                            ? "Traslado activo en curso"
                            : esDisponible
                              ? "Recibiendo solicitudes de traslado"
                              : "Solicitudes de traslado pausadas"}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={esDisponible}
                      aria-labelledby="titulo-estado-conductor"
                      aria-label={esDisponible ? "Disponible: recibir traslados" : "No disponible: pausar traslados"}
                      onClick={alCambiarDisponibilidad}
                      disabled={disponibilidad === "en_viaje" || persistiendoDisponibilidad || !estaOnline}
                      className={`relative inline-flex h-10 w-[68px] shrink-0 cursor-pointer items-center rounded-full border-2 p-1 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF] disabled:cursor-not-allowed disabled:opacity-50 md:h-11 md:w-[76px] ${
                        esDisponible
                          ? "border-[#0066FF] bg-[#0066FF] shadow-md shadow-[#0066FF]/20"
                          : "border-slate-300 bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block size-7 transform rounded-full bg-white shadow-sm transition-transform duration-300 md:size-8 ${
                          esDisponible ? "translate-x-7 md:translate-x-8" : "translate-x-0"
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {persistiendoDisponibilidad && (
                    <p className="mt-1 font-body text-[11px] text-[#566889]" aria-live="polite">
                      Actualizando estado…
                    </p>
                  )}
                </section>

                {/* 3. Traslado activo (sticky si existe) */}
                {viajeActivoPrincipal && (
                  <div className="sticky top-[64px] z-10">
                    <PanelActiveTripCard viaje={viajeActivoPrincipal} />
                  </div>
                )}

                {/* 4. Grid de Requisitos (4 columnas: Documentos/Docu, Perfil, GPS, Conexión) */}
                <PanelStatusRow
                  gpsActivo={gpsActivo}
                  gpsUltimaSenal={gpsUltimaSenal}
                  estaOnline={estaOnline}
                  documentoBloqueante={documentoBloqueante}
                  documentoPorVencer={documentoPorVencer}
                  conductorEstado={conductor?.estado}
                />

                {/* 5. Sección Central — Banner de búsqueda de traslados */}
                {!viajeActivoPrincipal && (
                  <PanelOpportunitiesCard
                    disponibilidad={disponibilidad}
                    TrasladosDisponibles={TrasladosDisponibles}
                    ultimaActualizacion={ultimaActualizacion}
                    refrescando={refrescando}
                    onRecargar={() => void recargar()}
                    onActivar={() => seleccionarDisponibilidad("disponible")}
                  />
                )}

                {/* 6. Tarjetas de Métricas (Footer) */}
                <PanelMetrics gananciasHoy={gananciasHoy} trasladosHoy={trasladosHoy} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BARRA DE NAVEGACIÓN INFERIOR FIJA EN MÓVIL (3 accesos rápidos: Inicio, Traslados, Cuenta) */}
      <div
        data-panel-mobile-nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4ECF7] bg-white/95 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-6px_24px_rgba(10,35,66,0.06)] backdrop-blur-md md:hidden"
      >
        <nav aria-label="Navegación principal móvil" className="mx-auto w-full max-w-md px-2">
          <div className="grid grid-cols-3 gap-1">
            {MENU_INFERIOR_MOVIL.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`flex min-h-[54px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 font-body text-xs transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF] ${
                  item.active
                    ? "font-extrabold text-[#0066FF]"
                    : "font-medium text-[#566889] hover:text-[#0A2342]"
                }`}
              >
                <SidebarMenuIcon name={item.icon} active={item.active} />
                <span className="leading-none">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Menú Hamburguesa Móvil */}
      {menuAbierto && (
        <dialog
          open
          className="fixed inset-0 z-[60] m-0 flex h-[100dvh] w-full max-w-none items-start border-0 bg-transparent p-0"
          aria-modal="true"
          aria-labelledby="titulo-menu-panel"
        >
          <button
            type="button"
            onClick={() => setMenuAbierto(false)}
            className="absolute inset-0 cursor-pointer bg-slate-950/40"
            aria-label="Cerrar menú"
          />
          <section className="relative ml-3 mt-[max(12px,env(safe-area-inset-top))] w-[min(300px,calc(100vw-24px))] rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titulo-menu-panel" className="font-display text-lg font-black text-[#0A2342]">
                Menú
              </h2>
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-[#566889] hover:bg-slate-100"
                aria-label="Cerrar menú"
              >
                ×
              </button>
            </div>
            <nav className="mt-3 grid gap-1" aria-label="Menú del conductor">
              {MENU_LATERAL.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAbierto(false)}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 font-body text-sm transition ${
                    item.active
                      ? "bg-[#DCE8FC] font-extrabold text-[#0057D9]"
                      : "font-semibold text-[#0A2342] hover:bg-slate-100"
                  }`}
                >
                  <SidebarMenuIcon name={item.icon} active={item.active} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-100 pt-3 px-2">
              <Link
                href="/legal/terminos"
                onClick={() => setMenuAbierto(false)}
                className="cursor-pointer font-body text-[12px] font-medium text-[#566889] hover:text-[#0057D9]"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/legal/privacidad"
                onClick={() => setMenuAbierto(false)}
                className="cursor-pointer font-body text-[12px] font-medium text-[#566889] hover:text-[#0057D9]"
              >
                Política de privacidad
              </Link>
            </div>
            <button
              type="button"
              onClick={() => void cerrarSesion()}
              disabled={cerrandoSesion}
              className="mt-4 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-danger/30 px-3 font-body text-sm font-bold text-danger transition hover:bg-danger-soft/30 disabled:opacity-50"
            >
              {cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </section>
        </dialog>
      )}

      {/* Modal de Confirmación de Disponibilidad */}
      <ConfirmarDisponibilidad
        abierto={disponibilidadPendiente === "no_disponible"}
        persistiendo={persistiendoDisponibilidad}
        onCancelar={() => {
          if (!persistiendoDisponibilidad) setDisponibilidadPendiente(null);
        }}
        onConfirmar={() => void persistirDisponibilidad("no_disponible")}
      />

      {/* Sheet de Soporte */}
      <PanelSupportSheet abierto={soporteAbierto} onCerrar={() => setSoporteAbierto(false)} />

      {/* Toasts no intrusivos */}
      {(errorCerrarSesion || errorDisponibilidad) && (
        <div className="pointer-events-none fixed inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom))] z-40 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:max-w-sm">
          {errorCerrarSesion && (
            <div className="pointer-events-auto" role="alert">
              <Aviso tono="danger">{errorCerrarSesion}</Aviso>
            </div>
          )}
          {errorDisponibilidad && (
            <div className="pointer-events-auto" role="alert">
              <Aviso tono="danger">{errorDisponibilidad}</Aviso>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
