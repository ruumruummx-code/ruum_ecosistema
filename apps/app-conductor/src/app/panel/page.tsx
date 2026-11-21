"use client";

import { Button as BaseButton, PageHeader, Skeleton } from "@ruum/ui/base";
import { ConductorIcon } from "@/components/icons";
import { PanelAvailabilityCard } from "./PanelAvailabilityCard";
import { useState, useEffect, useRef } from "react";
import styles from "./panel.module.css";
import Link from "next/link";
import { ConductorDialog } from "../components/ConductorDialog";
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
import { soportaTrackingNativo, obtenerEstadoTrackingNativo } from "../../lib/background-tracking";
import { getBatteryState, intervaloTrackingMs } from "../../lib/battery";
import { useCerrarSesion } from "../../lib/use-cerrar-sesion";

function PanelLoadingSkeleton() {
  return <div className="space-y-4" role="status" aria-label="Cargando panel operativo" aria-busy="true">
    <Skeleton className="h-32 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" />
  </div>;
}

function SidebarMenuIcon({ name }: { name: string }) {
  switch (name) {
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

// Inicio, Traslados, Ganancias y Cuenta viven en la barra inferior; el menú solo
// agrega lo que no está ahí, para no duplicar la navegación principal.
const MENU_LATERAL = [
  { href: "/notificaciones", label: "Notificaciones", icon: "notificaciones" },
  { href: "/cuenta/preferencias", label: "Preferencias", icon: "preferencias" },
  { href: "/cuenta/soporte", label: "Soporte", icon: "soporte" },
] as const;

export default function PaginaPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { cerrarSesion, cerrandoSesion, errorCerrarSesion } = useCerrarSesion();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [gpsActivo, setGpsActivo] = useState<boolean | null>(null);
  const [gpsUltimaSenal, setGpsUltimaSenal] = useState<Date | null>(null);
  const [pullOffset, setPullOffset] = useState(0);
  const [avisoPullBloqueado, setAvisoPullBloqueado] = useState(false);
  const [estaOnline, setEstaOnline] = useState(true);

  useEffect(() => {
    const actualizar = () => setEstaOnline(navigator.onLine);
    actualizar();
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

  const primerNombre = conductor?.nombre?.trim().split(/\s+/)[0] || "Conductor";
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
      if (scrollRef.current?.contains(e.target as Node) && scrollRef.current.scrollTop <= 0) {
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
      if (diff > 0) {
        setPullOffset(Math.min(diff * 0.5, 64));
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
          className="pointer-events-none fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-ui-line bg-ui-muted px-3 py-1.5 shadow-md"
          aria-hidden="true"
        >
          <span className={`size-2 rounded-full ${pullOffset > 48 ? "bg-ui-brand" : "bg-ui-fg-muted"}`} />
          <span className="font-body text-xs font-bold text-ui-fg-muted">
            {pullOffset > 48 ? "Suelta para actualizar" : "Desliza para actualizar"}
          </span>
        </div>
      )}
      {avisoPullBloqueado && (
        <div
          className="pointer-events-none fixed left-1/2 top-3 z-50 flex -translate-x-1/2 animate-fadeIn items-center gap-2 rounded-full border border-ui-warning/30 bg-ui-muted px-3 py-1.5 shadow-md"
          role="status"
          aria-live="polite"
        >
          <span className="size-2 rounded-full bg-ui-warning" aria-hidden="true" />
          <span className="font-body text-xs font-bold text-ui-fg">Actualización pausada durante viaje</span>
          <span className="font-body text-xs text-ui-fg-muted">🔒 termina el traslado</span>
        </div>
      )}
      {refrescando && (
        <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 h-1 bg-ui-brand/20" aria-hidden="true">
          <div className="conductor-refresh-bar h-full w-1/3 animate-pulse bg-ui-brand" />
        </div>
      )}

      <div className={styles.frame}>
        <div className={styles.workspace}>
          {/* ÁREA DE CONTENIDO PRINCIPAL */}
          <div ref={scrollRef} className={styles.main}>
            {/* Aviso Modo Offline — compacto */}
            {!estaOnline && (
              <div className="mb-3">
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-ui-danger/40 bg-ui-danger-soft/20 px-3 py-2 shadow-sm"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="font-body text-sm leading-5 text-ui-danger">
                    <span className="font-bold">⚠️ Sin conexión:</span> Ves datos guardados.
                  </p>
                  <BaseButton variant="ghost"
                    type="button"
                    onClick={() => void recargar()}
                    className="inline-flex min-h-9 shrink-0 cursor-pointer items-center rounded-lg border border-ui-danger/40 bg-ui-card px-2.5 py-1 font-body text-xs font-bold text-ui-danger hover:bg-ui-muted focus-visible:outline-none"
                  >
                    Reintentar
                  </BaseButton>
                </div>
              </div>
            )}

            {cargando ? (
              <PanelLoadingSkeleton />
            ) : (
              <div className={styles.content}>
                <PageHeader titulo="Inicio" descripcion={`Hola, ${primerNombre}. Gestiona tu jornada desde aquí.`}
                  className="[&_h1]:text-2xl [&_p]:block"
                  acciones={<BaseButton variant="outline" size="icon" className="size-12" aria-label="Abrir menú" onClick={() => setMenuAbierto(true)}><ConductorIcon name="menu" /></BaseButton>} />
                <PanelAvailabilityCard disponibilidad={disponibilidad} guardando={persistiendoDisponibilidad}
                  online={estaOnline} onCambiar={alCambiarDisponibilidad} />
                {/* El traslado en curso conserva prioridad sobre el resto de la jornada. */}
                {viajeActivoPrincipal && (
                  <div>
                    <PanelActiveTripCard viaje={viajeActivoPrincipal} />
                  </div>
                )}

                {/* Indicadores agrupados del sistema base. */}
                <PanelMetrics
                  gananciasHoy={gananciasHoy}
                  trasladosHoy={trasladosHoy}
                  gananciasEstimadas={gananciasHoyEstimadas}
                  gananciasIncompletas={gananciasHoyIncompletas}
                  gananciasDesconocidas={gananciasHoyDesconocidas}
                />
                {/* Próxima acción de la jornada. */}
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

                {/* Estado operativo con etiquetas visibles en todos los tamaños. */}
                <PanelStatusRow
                  gpsActivo={gpsActivo}
                  gpsUltimaSenal={gpsUltimaSenal}
                  estaOnline={estaOnline}
                  documentoBloqueante={documentoBloqueante}
                  documentoPorVencer={documentoPorVencer}
                  conductorEstado={conductor?.estado}
                />


              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menú Hamburguesa Móvil */}
      {menuAbierto && (
        <ConductorDialog open={menuAbierto} onClose={() => setMenuAbierto(false)} labelledBy="titulo-menu-panel">
          <section className="bg-ui-card">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titulo-menu-panel" className="font-display text-lg font-black text-ui-fg">
                Menú
              </h2>
            </div>
            <nav className="mt-3 grid gap-1" aria-label="Menú del conductor">
              {MENU_LATERAL.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAbierto(false)}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 font-body text-sm font-semibold text-ui-fg transition hover:bg-ui-muted"
                >
                  <SidebarMenuIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-1.5 border-t border-ui-line pt-3 px-2">
              <Link
                href="/legal/terminos"
                onClick={() => setMenuAbierto(false)}
                className="cursor-pointer font-body text-xs font-medium text-ui-fg-muted hover:text-ui-brand"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/legal/privacidad"
                onClick={() => setMenuAbierto(false)}
                className="cursor-pointer font-body text-xs font-medium text-ui-fg-muted hover:text-ui-brand"
              >
                Política de privacidad
              </Link>
            </div>
            <BaseButton variant="ghost"
              type="button"
              onClick={() => void cerrarSesion()}
              disabled={cerrandoSesion}
              className="mt-4 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-ui-danger/30 px-3 font-body text-sm font-bold text-ui-danger transition hover:bg-ui-danger-soft/30 disabled:opacity-50"
            >
              {cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
            </BaseButton>
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
