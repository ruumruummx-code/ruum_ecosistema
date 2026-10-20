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
    <div className="w-full flex flex-col gap-4" aria-label="Cargando panel operativo" aria-busy="true">
      <div className="h-10 w-full animate-pulse rounded-lg bg-surface-elevated" />
      <div className="flex flex-col gap-3">
        <div className="h-8 w-full animate-pulse rounded-lg bg-surface-elevated" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-[96px] animate-pulse rounded-xl bg-surface-elevated" />
          <div className="h-[96px] animate-pulse rounded-xl bg-surface-elevated" />
        </div>
      </div>
      <div className="h-[88px] animate-pulse rounded-xl bg-surface-elevated" />
      <button className="h-12 w-full animate-pulse rounded-xl bg-surface-elevated" disabled />
    </div>
  );
}

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
    seleccionarDisponibilidad,
    persistirDisponibilidad,
    setDisponibilidadPendiente,
    recargar
  } = usePanelData();

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
        const intervaloMs = intervaloTrackingMs({ disponible: disponibilidad === "disponible", enViaje: Boolean(viajeActivoPrincipal), battery });
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
        timeout: altaPrecision ? 15_000 : 10_000
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
    <div className={`driver-dashboard mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-[calc(88px+env(safe-area-inset-bottom))] ${viajeActivoPrincipal ? "" : "driver-dashboard-empty"}`}>
      <RegistroViajeActivo
        viaje={viajeActivoPrincipal ? registroViajeActivoDesdePasaporte(viajeActivoPrincipal) : null}
      />

      {/* Indicador pull-to-refresh */}
      {pullOffset > 0 && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-surface-elevated border border-border shadow-md px-3 py-1.5 flex items-center gap-2" aria-hidden>
          <span className={`size-2 rounded-full ${pullOffset > 48 ? "bg-signal" : "bg-text-tertiary"}`} />
          <span className="font-body text-xs font-bold text-text-secondary">{pullOffset > 48 ? "Suelta para actualizar" : "Desliza para actualizar"}</span>
        </div>
      )}
      {avisoPullBloqueado && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-surface-elevated border border-amber-500/30 shadow-md px-3 py-1.5 flex items-center gap-2 animate-fadeIn" role="status" aria-live="polite">
          <span className="size-2 rounded-full bg-amber-500" aria-hidden />
          <span className="font-body text-xs font-bold text-text-primary">Actualización pausada durante viaje</span>
          <span className="font-body text-[11px] text-text-tertiary">🔒 termina el traslado</span>
        </div>
      )}
      {refrescando && (
        <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 h-1 bg-signal/20" aria-hidden>
          <div className="h-full w-1/3 animate-pulse conductor-refresh-bar bg-signal" />
        </div>
      )}

      <header className="grid min-h-16 grid-cols-[44px_1fr_88px] items-center gap-1 pt-[max(8px,env(safe-area-inset-top))]" aria-label="Encabezado del panel">
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-primary transition hover:bg-surface-elevated active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-route-action"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <Link href="/panel" className="justify-self-center" aria-label="Ruum Ruum, inicio">
          <Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={132} height={43} priority className="h-9 w-auto" />
        </Link>
        <div className="flex items-center justify-end gap-0.5">
          <Link
            href="/notificaciones"
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-primary transition hover:bg-surface-elevated active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-route-action"
            aria-label={notificacionesCount > 0 ? `Notificaciones (${notificacionesCount > 99 ? "99+" : notificacionesCount} sin leer)` : "Notificaciones"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            {notificacionesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-black rounded-full min-w-4 h-4 px-0.5 flex items-center justify-center border-2 border-surface shadow-xs tabular-nums">
                {notificacionesCount > 99 ? "99+" : notificacionesCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSoporteAbierto(true)}
            aria-label="Abrir soporte técnico"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-primary transition hover:bg-surface-elevated active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-route-action"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" /><path d="M17 19c-1.1 1.2-2.7 2-5 2" /></svg>
          </button>
        </div>
      </header>

      {/* Aviso Modo Offline — compacto */}
      {!estaOnline && (
        <div className="mt-3 px-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger-soft/20 px-3 py-2 shadow-sm" role="alert" aria-live="assertive">
            <p className="font-body text-xs leading-5 text-danger">
              <span className="font-bold">⚠️ Sin conexión:</span> Ves datos guardados.
            </p>
            <button
              type="button"
              onClick={() => void recargar()}
              className="shrink-0 inline-flex min-h-9 items-center rounded-lg border border-danger/40 bg-surface px-2 py-1 font-body text-[11px] font-bold text-danger hover:bg-surface-elevated focus-visible:outline-none"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {cargando ? (
        <PanelLoadingSkeleton />
      ) : (
        <div className="driver-dashboard-content w-full flex flex-col flex-1 gap-3 pb-2">
          <section className="driver-dashboard-welcome flex items-center gap-3 pt-1" aria-labelledby="titulo-bienvenida">
            <span className="inline-flex size-[58px] shrink-0 items-center justify-center rounded-full bg-route-action/10 text-route-action" aria-hidden>
              <svg width="31" height="31" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="3.5" /><path d="M4 20c0-3.7 3.2-6.4 8-6.4s8 2.7 8 6.4" /></svg>
            </span>
            <div className="min-w-0">
              <h1 id="titulo-bienvenida" className="font-display text-[28px] font-black leading-none tracking-tight text-text-primary">¡Hola, {conductor?.nombre?.trim().split(/\s+/)[0] || "Conductor"}!</h1>
              <p className="mt-1 font-body text-base leading-none text-text-secondary">Conduce, gana y avanza</p>
            </div>
          </section>

          <section className="driver-availability-card rounded-2xl border border-border/60 bg-surface p-4 shadow-[0_5px_20px_rgba(13,43,94,0.05)]" aria-labelledby="titulo-estado-conductor">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm" aria-hidden><svg width="31" height="31" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg></span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-semibold leading-none text-text-secondary">Estado</p>
                <h2 id="titulo-estado-conductor" className="mt-1 font-display text-2xl font-black leading-none text-text-primary">{disponibilidad === "en_viaje" ? "En viaje" : esDisponible ? "Disponible" : "No disponible"}</h2>
                <p className="mt-1 font-body text-sm leading-none text-text-secondary">{disponibilidad === "en_viaje" ? "Traslado activo" : esDisponible ? "Recibiendo solicitudes" : "Solicitudes pausadas"}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={esDisponible}
                aria-labelledby="titulo-estado-conductor"
                aria-label={esDisponible ? "Disponible: recibir traslados" : "No disponible: pausar traslados"}
                onClick={alCambiarDisponibilidad}
                disabled={disponibilidad === "en_viaje" || persistiendoDisponibilidad || !estaOnline}
                className={`relative inline-flex h-10 w-[68px] shrink-0 cursor-pointer items-center rounded-full border-2 p-1 transition-all duration-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  esDisponible
                    ? "bg-signal border-signal shadow-md shadow-signal/20"
                    : "bg-surface-elevated border-border"
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    esDisponible ? "translate-x-7" : "translate-x-0"
                  }`}
                  aria-hidden
                />
              </button>
            </div>
            {persistiendoDisponibilidad && (
              <p className="mt-1 font-body text-[10px] text-text-tertiary" aria-live="polite">Actualizando estado…</p>
            )}
          </section>

          {/* 2. Traslado activo (sticky si existe) */}
          {viajeActivoPrincipal && (
            <div className="sticky top-[64px] z-10">
              <PanelActiveTripCard viaje={viajeActivoPrincipal} />
            </div>
          )}

          {/* 3. Salud operacional — StatusRow horizontal compacto (BottomSheet al tap) */}
          <PanelStatusRow
            gpsActivo={gpsActivo}
            gpsUltimaSenal={gpsUltimaSenal}
            estaOnline={estaOnline}
            documentoBloqueante={documentoBloqueante}
            documentoPorVencer={documentoPorVencer}
            conductorEstado={conductor?.estado}
          />

          {/* 4. Oportunidades (cuando no hay viaje activo) */}
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

          {/* 5. Métricas — grid 2 columnas, sparkline oculto si $0 */}
          <PanelMetrics gananciasHoy={gananciasHoy} trasladosHoy={trasladosHoy} />
        </div>
      )}

      {menuAbierto && (
        <dialog open className="fixed inset-0 z-[60] m-0 flex h-[100dvh] w-full max-w-none items-start border-0 bg-transparent p-0" aria-modal="true" aria-labelledby="titulo-menu-panel">
          <button type="button" onClick={() => setMenuAbierto(false)} className="absolute inset-0 bg-slate-950/40" aria-label="Cerrar menú" />
          <section className="relative mt-[max(12px,env(safe-area-inset-top))] ml-3 w-[min(300px,calc(100vw-24px))] rounded-3xl bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3"><h2 id="titulo-menu-panel" className="font-display text-lg font-black text-text-primary">Menú</h2><button type="button" onClick={() => setMenuAbierto(false)} className="inline-flex size-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface-elevated" aria-label="Cerrar menú">×</button></div>
            <nav className="mt-3 grid gap-1" aria-label="Menú del conductor">
              {[{ href: "/panel", label: "Inicio" }, { href: "/viajes", label: "Traslados" }, { href: "/ganancias", label: "Ganancias" }, { href: "/notificaciones", label: "Notificaciones" }, { href: "/cuenta", label: "Cuenta" }].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuAbierto(false)} className="flex min-h-11 items-center rounded-xl px-3 font-body text-sm font-semibold text-text-primary transition hover:bg-route-action/10">{item.label}</Link>
              ))}
            </nav>
            <button type="button" onClick={() => void cerrarSesion()} disabled={cerrandoSesion} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-danger/30 px-3 font-body text-sm font-bold text-danger transition hover:bg-danger-soft/30 disabled:opacity-50">{cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}</button>
          </section>
        </dialog>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/30 bg-surface/95 px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_rgba(13,43,94,0.08)] backdrop-blur" aria-label="Navegación principal">
        <div className="mx-auto grid w-full max-w-md grid-cols-3">
          {[{ href: "/panel", label: "Inicio", icon: "home" }, { href: "/viajes", label: "Traslados", icon: "trips" }, { href: "/cuenta", label: "Cuenta", icon: "account" }].map((item) => {
            const activo = item.href === "/panel";
            return <Link key={item.href} href={item.href} aria-current={activo ? "page" : undefined} className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl font-body text-xs font-semibold transition active:scale-95 ${activo ? "text-route-action" : "text-text-secondary hover:bg-surface-elevated"}`}>
              <span className="relative inline-flex size-6 items-center justify-center" aria-hidden>{item.icon === "home" ? <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7" /></svg> : item.icon === "trips" ? <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h11l2 5v5H5v-5l2-5Z" /><path d="M8 17v2m8-2v2M4 12h16" /><circle cx="8" cy="14" r="1" fill="currentColor" /><circle cx="17" cy="14" r="1" fill="currentColor" /></svg> : <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.4-7 8-7s8 3 8 7" /></svg>}</span>
              <span>{item.label}</span>{activo && <span className="absolute -bottom-2 h-1 w-12 rounded-full bg-route-action" aria-hidden />}
            </Link>;
          })}
        </div>
      </nav>

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
