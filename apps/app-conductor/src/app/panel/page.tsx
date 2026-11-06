"use client";

import { useState, useEffect } from "react";
import styles from "./panel.module.css";
import Link from "next/link";
import { ConductorDialog } from "../components/ConductorDialog";
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
      <div className="grid grid-cols-4 gap-2">
        <div className="h-[88px] animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-[88px] animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-[88px] animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-[88px] animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
      <div className="h-[164px] animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-3">
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

export default function PaginaPanel() {
  const { cerrarSesion, cerrandoSesion, errorCerrarSesion } = useCerrarSesion();
  const [soporteAbierto, setSoporteAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
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
    gananciasHoyEstimadas = false,
    gananciasHoyIncompletas = false,
    gananciasHoyDesconocidas = false,
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
      className={`${styles.screen} driver-dashboard ${
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

      <div className={styles.frame}>
        {/* HEADER MÓVIL (< md) */}
        <header
          className={styles.header}
          aria-label="Encabezado del conductor"
        >
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-[var(--conductor-primary)] transition hover:bg-slate-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF]"
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
              className="relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-[var(--conductor-primary)] transition hover:bg-slate-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF]"
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
              {notificacionesCount > 0 && <span className="absolute right-2.5 top-2.5 size-2.5 rounded-full border-2 border-white bg-[#EF4444]" aria-hidden="true" />}
            </Link>
            <button
              type="button"
              onClick={() => setSoporteAbierto(true)}
              aria-label="Abrir soporte técnico"
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-[var(--conductor-primary)] transition hover:bg-slate-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
                <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
                <path d="M17 19c-1.1 1.2-2.7 2-5 2" />
              </svg>
            </button>
          </div>
        </header>

        <div className={styles.workspace}>
          {/* ÁREA DE CONTENIDO PRINCIPAL */}
          <div className={styles.main}>
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
              <div className={`${styles.content} driver-dashboard-content`}>
                {/* 1. Saludo y Avatar */}
                <section
                  className="driver-dashboard-welcome flex items-center gap-3.5 pt-1"
                  aria-labelledby="titulo-bienvenida"
                >
                  <span
                    className="inline-flex size-[58px] shrink-0 items-center justify-center rounded-full bg-[var(--conductor-surface-secondary)] text-[var(--conductor-action)]"
                    aria-hidden="true"
                  >
                    <svg className="size-8" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="8" r="3.8" />
                      <path d="M4 20c0-3.7 3.3-6.4 8-6.4s8 2.7 8 6.4" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h1
                      id="titulo-bienvenida"
                      className="font-display text-[28px] font-black leading-none tracking-tight text-[var(--conductor-primary)]"
                    >
                      ¡Hola, {primerNombre}!
                    </h1>
                    <p className="mt-1.5 font-body text-base leading-none text-[var(--conductor-muted)]">
                      Conduce, gana y avanza
                    </p>
                    <p className="mt-2 hidden font-body text-lg leading-none text-[var(--conductor-muted)]">
                      Hoy es un gran día para conducir 🚀
                    </p>
                  </div>
                </section>

                {/* 2. Fila de Estado (Switch de Disponibilidad) */}
                <section
                  className={`driver-availability-card rounded-2xl border p-4 shadow-[0_5px_20px_rgba(13,43,94,0.05)] transition-colors    ${
                    esDisponible
                      ? "border-[var(--conductor-border)] bg-[var(--conductor-surface)]  "
                      : "border-[var(--conductor-border)] bg-[var(--conductor-surface)]"
                  }`}
                  aria-labelledby="titulo-estado-conductor"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`inline-flex size-13 shrink-0 items-center justify-center rounded-full text-[var(--ruum-on-primary)] shadow-sm  ${
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
                      <p className="font-body text-xs font-semibold leading-none text-[var(--conductor-muted)]">
                        Estado
                      </p>
                      <h2
                        id="titulo-estado-conductor"
                        className="mt-1 font-display text-[22px] font-black leading-none text-[var(--conductor-primary)]"
                      >
                        <span className="">
                          {disponibilidad === "en_viaje"
                            ? "En viaje"
                            : esDisponible
                              ? "Disponible"
                              : "No disponible"}
                        </span>
                        <span className="hidden">
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
                      <p className="mt-1 font-body text-xs sm:text-sm leading-none text-[var(--conductor-muted)]">
                        <span className="">
                          {disponibilidad === "en_viaje"
                            ? "Traslado activo"
                            : esDisponible
                              ? "Recibiendo solicitudes"
                              : "Solicitudes pausadas"}
                        </span>
                        <span className="hidden">
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
                      className={`relative inline-flex h-10 w-[68px] shrink-0 cursor-pointer items-center rounded-full border-2 p-1 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF] disabled:cursor-not-allowed disabled:opacity-50   ${
                        esDisponible
                          ? "border-[var(--conductor-action)] bg-[var(--conductor-action)] shadow-none"
                          : "border-slate-300 bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block size-7 transform rounded-full bg-[var(--conductor-surface)] shadow-sm transition-transform duration-300  ${
                          esDisponible ? "translate-x-7 " : "translate-x-0"
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {persistiendoDisponibilidad && (
                    <p className="mt-1 font-body text-[11px] text-[var(--conductor-muted)]" aria-live="polite">
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
                <PanelMetrics
                  gananciasHoy={gananciasHoy}
                  trasladosHoy={trasladosHoy}
                  gananciasEstimadas={gananciasHoyEstimadas}
                  gananciasIncompletas={gananciasHoyIncompletas}
                  gananciasDesconocidas={gananciasHoyDesconocidas}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menú Hamburguesa Móvil */}
      {menuAbierto && (
        <ConductorDialog open={menuAbierto} onClose={() => setMenuAbierto(false)} labelledBy="titulo-menu-panel">
          <section className="bg-[var(--conductor-surface)]">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titulo-menu-panel" className="font-display text-lg font-black text-[var(--conductor-primary)]">
                Menú
              </h2>
            </div>
            <nav className="mt-3 grid gap-1" aria-label="Menú del conductor">
              {MENU_LATERAL.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAbierto(false)}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 font-body text-sm transition ${
                    item.active
                      ? "bg-[var(--conductor-surface-secondary)] font-extrabold text-[var(--conductor-action)]"
                      : "font-semibold text-[var(--conductor-primary)] hover:bg-slate-100"
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
                className="cursor-pointer font-body text-[12px] font-medium text-[var(--conductor-muted)] hover:text-[var(--conductor-action)]"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/legal/privacidad"
                onClick={() => setMenuAbierto(false)}
                className="cursor-pointer font-body text-[12px] font-medium text-[var(--conductor-muted)] hover:text-[var(--conductor-action)]"
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
        </ConductorDialog>
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
