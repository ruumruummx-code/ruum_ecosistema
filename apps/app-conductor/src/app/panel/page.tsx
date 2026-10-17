"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { ConfirmarDisponibilidad } from "../ConfirmarDisponibilidad";
import { RegistroViajeActivo } from "../ViajeActivoContext";
import { EstadoRevisionConductor } from "./EstadoRevisionConductor";
import { usePanelData } from "./usePanelData";
import { registroViajeActivoDesdePasaporte } from "../active-trip-state";
import { useCerrarSesion } from "../../lib/use-cerrar-sesion";
import { PanelActiveTripCard } from "./PanelActiveTripCard";
import { soportaTrackingNativo, obtenerEstadoTrackingNativo } from "../../lib/background-tracking";
import { getBatteryState, intervaloTrackingMs } from "../../lib/battery";
import { MapaConductor } from "./components/MapaConductor";
import { FloatingPills } from "./components/FloatingPills";
import { OperacionBottomSheet } from "./components/OperacionBottomSheet";

function PanelLoadingSkeleton() {
  return (
    <output className="w-full flex flex-col gap-4" aria-label="Cargando panel operativo" aria-busy="true">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 animate-pulse rounded-full bg-surface-elevated" />
        <div className="h-4 w-24 animate-pulse rounded bg-surface-elevated" />
      </div>
      <div className="h-[148px] w-full animate-pulse rounded-3xl bg-surface-elevated" />
      <div className="flex gap-2">
        <div className="h-7 w-1/3 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="h-7 w-1/3 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="h-7 w-1/3 animate-pulse rounded-lg bg-surface-elevated" />
      </div>
    </output>
  );
}

export default function PaginaPanel() {
  const { cerrarSesion, cerrandoSesion, errorCerrarSesion } = useCerrarSesion();
  const [gpsActivo, setGpsActivo] = useState<boolean | null>(null);
  const [gpsUltimaSenal, setGpsUltimaSenal] = useState<Date | null>(null);
  const [estaOnline, setEstaOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [avisoPullBloqueado, setAvisoPullBloqueado] = useState(false);

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
    gananciasHoy,
    trasladosHoy,
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

  // Pull-to-resumen bloqueado durante viaje (aviso no intrusivo, sin scroll)
  useEffect(() => {
    const actualizar = () => setEstaOnline(navigator.onLine);
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

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
    <div className="conductor-panel-root relative min-h-[100dvh] w-full overflow-hidden bg-surface text-text-primary">
      <RegistroViajeActivo
        viaje={viajeActivoPrincipal ? registroViajeActivoDesdePasaporte(viajeActivoPrincipal) : null}
      />

      {/* ===================== MAPA DE FONDO 100% PANTALLA =====================
         El mapa de operación abarca el 100% de la vista como fondo interactivo.
         Los controles se superponen sin desplazarlo. ===================== */}
      {!cargando && (
        <div className="absolute inset-0 z-0 bg-surface">
          <MapaConductor />
        </div>
      )}

      {/* ===================== MICRO-INDICADOR DE ESTADO =====================
         Punto de conexión integrado en el header (superpuesto al mapa). ===================== */}
      {!cargando && (
        <div className="absolute left-4 top-[calc(env(safe-area-inset-top)+74px)] z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/30 bg-surface/90 backdrop-blur-sm shadow-sm">
          <span className={`size-2 rounded-full ${estaOnline ? "bg-emerald-500" : "bg-danger"}`} aria-hidden />
          <span className="font-body text-[10px] font-bold text-text-primary">{estaOnline ? "Conectado" : "Sin conexión"}</span>
        </div>
      )}

      {/* Aviso de conexión caída (superpuesto, no desplaza el mapa) */}
      {!cargando && !estaOnline && (
        <div className="absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+116px)] z-20">
          <div className="rounded-xl border border-danger/40 bg-danger-soft/20 px-3 py-2 flex items-center justify-between gap-2 shadow-sm">
            <p className="font-body text-xs font-bold text-danger leading-none">
              <span className="font-bold">⚠️ Sin conexión:</span> Datos guardados. Se sincronizarán al volver la red.
            </p>
            <button
              type="button"
              onClick={() => void recargar()}
              className="shrink-0 inline-flex min-h-9 items-center rounded-lg border border-danger/40 bg-surface px-2 py-1 font-body text-[11px] font-bold text-danger hover:bg-surface-elevated focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-danger"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* ===================== PÍLDORAS FLOTANTES (métricas) =====================
         Superpuestas en la parte superior del mapa. Tap para desglose. ===================== */}
      {!cargando && (
        <div className="absolute left-0 right-0 top-[calc(env(safe-area-inset-top)+160px)] z-20">
          <FloatingPills
            gananciasHoy={gananciasHoy}
            trasladosHoy={trasladosHoy}
            gpsActivo={gpsActivo}
            estaOnline={estaOnline}
            documentoBloqueante={documentoBloqueante}
            documentoPorVencer={documentoPorVencer}
          />
        </div>
      )}

      {/* Esqueleto de carga centrado sobre el mapa */}
      {cargando && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm">
          <PanelLoadingSkeleton />
        </div>
      )}

      {/* Viaje activo destacado (superpuesto sobre el mapa, debajo del header) */}
      {!cargando && viajeActivoPrincipal && (
        <div className="absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+16px)] z-20 mx-auto w-full max-w-md">
          <div className="sticky top-[calc(env(safe-area-inset-top)+16px)] z-10">
            <PanelActiveTripCard viaje={viajeActivoPrincipal} />
          </div>
        </div>
      )}

      {/* ===================== BOTTOM SHEET DE OPERACIÓN =====================
         Toggle de estado + módulo de búsqueda, anclado encima de la Bottom Tab Bar. ===================== */}
      {!cargando && !enRevision && (
        <OperacionBottomSheet
          disponibilidad={disponibilidad}
          TrasladosDisponibles={TrasladosDisponibles}
          ultimaActualizacion={ultimaActualizacion}
          refrescando={refrescando}
          esDisponible={esDisponible}
          seleccionarDisponibilidad={seleccionarDisponibilidad}
          persistiendoDisponibilidad={persistiendoDisponibilidad}
          onRecargar={() => void recargar()}
          onActivar={() => seleccionarDisponibilidad("disponible")}
        />
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

      {/* Toasts no intrusivos (anclados arriba del bottom sheet, no empujan layout) */}
      {(errorCerrarSesion || errorDisponibilidad) && (
        <div className="pointer-events-none fixed inset-x-4 bottom-[calc(180px+env(safe-area-inset-bottom))] z-40 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:max-w-sm">
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
