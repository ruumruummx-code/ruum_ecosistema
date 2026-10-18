"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { ConductorStatusBadge } from "../../components/v2/ConductorUI";
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
  const [abHeader, setAbHeader] = useState<"A" | "B">("A");
  const [gpsActivo, setGpsActivo] = useState<boolean | null>(null);
  const [gpsUltimaSenal, setGpsUltimaSenal] = useState<Date | null>(null);
  const [pullOffset, setPullOffset] = useState(0);
  const [avisoPullBloqueado, setAvisoPullBloqueado] = useState(false);
  const [estaOnline, setEstaOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // R5 — A/B header simplificado (50/50)
  useEffect(() => {
    let cancelado = false;
    async function cargarAb() {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        const { value } = await Preferences.get({ key: "ruum_ab_header_panel" });
        if (!cancelado && (value === "A" || value === "B")) {
          setAbHeader(value as "A" | "B");
          return;
        }
      } catch {}
      try {
        const v = localStorage.getItem("ruum_ab_header_panel");
        if (!cancelado && (v === "A" || v === "B")) {
          setAbHeader(v as "A" | "B");
          return;
        }
      } catch {}
      const asignado = Math.random() < 0.5 ? "A" : "B";
      if (!cancelado) setAbHeader(asignado);
    }
    void cargarAb();
    return () => {
      cancelado = true;
    };
  }, []);

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
    <div className="conductor-road-pilot mx-auto w-full max-w-md px-4 pb-[calc(88px+env(safe-area-inset-bottom))] flex flex-col min-h-[100dvh]">
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

      {/* Header mínimo: título + notificaciones (sin logo grande, sin menú, sin migas de pan) */}
      <header className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 border-b border-border/30">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-text-primary">Panel</h1>
        <div className="flex items-center gap-1 shrink-0">
          {abHeader === "B" && (
            <button
              type="button"
              onClick={() => setSoporteAbierto(true)}
              aria-label="Ayuda y soporte operativo"
              className="p-1.5 min-h-[40px] min-w-[40px] flex items-center justify-center text-text-secondary hover:text-signal rounded-full hover:bg-surface-elevated transition-colors focus-visible:outline-none"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          )}
          <Link
            href="/notificaciones"
            className="relative p-1.5 min-h-[40px] min-w-[40px] flex items-center justify-center text-text-primary hover:text-route-action transition-colors rounded-full hover:bg-surface-elevated focus-visible:outline-none"
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
            onClick={() => void cerrarSesion()}
            disabled={cerrandoSesion}
            aria-label="Cerrar sesión"
            className="p-1.5 min-h-[40px] min-w-[40px] flex items-center justify-center text-text-tertiary hover:text-red-400 rounded-full hover:bg-red-500/10 transition-colors focus-visible:outline-none disabled:opacity-50"
          >
            {cerrandoSesion ? (
              <span className="text-xs font-bold text-red-400 animate-pulse" aria-live="polite">…</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            )}
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
        <div className="w-full flex flex-col flex-1 gap-3">
          {/* 1. Estado del conductor (toggle compacto) */}
          <section className="bg-surface rounded-xl p-3 text-left border border-border/20" aria-labelledby="titulo-estado-conductor">
            <div className="flex justify-between items-start gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <ConductorStatusBadge
                  status={disponibilidad === "en_viaje" ? "active" : esDisponible ? "success" : "neutral"}
                  label={disponibilidad === "en_viaje" ? "En viaje" : esDisponible ? "Disponible" : "No disponible"}
                />
                <span id="titulo-estado-conductor" className="sr-only">
                  Estado del conductor
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display text-sm font-black text-text-primary uppercase tracking-wide">
                    {disponibilidad === "en_viaje" ? "En viaje" : esDisponible ? "Disponible" : "No Disponible"}
                  </span>
                </div>
                <p className="font-body text-[10px] text-text-secondary mt-0.5">
                  {disponibilidad === "en_viaje"
                    ? "Traslado activo — disponibilidad bloqueada"
                    : esDisponible
                      ? "Recibiendo solicitudes · Te avisaremos con sonido"
                      : "No recibirás traslados hasta activarte"}
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
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 p-0.5 transition-all duration-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  esDisponible
                    ? "bg-signal border-signal shadow-md shadow-signal/20"
                    : "bg-surface-elevated border-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    esDisponible ? "translate-x-6" : "translate-x-0"
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
              {registroViajeActivoDesdePasaporte(viajeActivoPrincipal) && (
                <PanelActiveTripCard
                  viaje={registroViajeActivoDesdePasaporte(viajeActivoPrincipal) as any}
                />
              )}
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
              gananciasHoy={gananciasHoy}
              trasladosHoy={trasladosHoy}
              ultimaActualizacion={ultimaActualizacion}
              refrescando={refrescando}
              onRecargar={() => void recargar()}
              onActivar={() => seleccionarDisponibilidad("disponible")}
            />
          )}

          {/* 5. Métricas — grid 2 columnas, sparkline oculto si $0 */}
          <PanelMetrics gananciasHoy={gananciasHoy} trasladosHoy={trasladosHoy} />

          {/* 6. Botón "Buscar ahora" ancho completo (thumb zone) */}
          {!viajeActivoPrincipal && esDisponible && !cargando && (
            <Link
              href="/viajes"
              aria-label={`Ver mapa de oportunidades${TrasladosDisponibles.length > 0 ? `, ${TrasladosDisponibles.length} traslados disponibles` : ""}`}
              className="block w-full min-h-12 items-center justify-center rounded-xl bg-signal px-4 py-3 font-display text-sm font-black text-slate-950 shadow-lg shadow-signal/20 hover:bg-signal/90 active:scale-[0.98] transition-all focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mr-2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              Buscar ahora
              {TrasladosDisponibles.length > 0 && (
                <span className="ml-auto rounded-full bg-slate-950 text-signal px-2 py-0.5 text-[10px] font-black tabular-nums">
                  {TrasladosDisponibles.length}
                </span>
              )}
            </Link>
          )}
        </div>
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
