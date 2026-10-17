"use client";

import Link from "next/link";
import type { PasaporteRow } from "../panel-utils";
import type { Disponibilidad } from "../usePanelData";
import { conductorButtonClasses } from "../../../components/v2/ConductorUI";

/**
 * Bottom Sheet de Operación flotante, anclado por encima de la Bottom Tab Bar.
 * Agrupa el toggle de estado del conductor (Disponible / Inactivo) y el módulo
 * central de búsqueda ("Sin traslados por ahora" / "Buscar ahora").
 * Se mantiene en el tercio inferior (zona de alcance del pulgar) sin desplazar
 * el mapa de fondo.
 */
interface OperacionBottomSheetProps {
  disponibilidad: Disponibilidad;
  TrasladosDisponibles: PasaporteRow[];
  ultimaActualizacion: Date | null;
  refrescando: boolean;
  esDisponible: boolean;
  seleccionarDisponibilidad: (nuevo: Disponibilidad) => void;
  persistiendoDisponibilidad: boolean;
  onRecargar: () => void;
  onActivar: () => void;
}

function formatoHaceMinutos(fecha: Date | null | undefined) {
  if (!fecha) return null;
  const diffMs = Date.now() - fecha.getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "hace segundos";
  if (mins === 1) return "hace 1 min";
  return `hace ${mins} min`;
}

export function OperacionBottomSheet({
  disponibilidad,
  TrasladosDisponibles,
  ultimaActualizacion,
  refrescando,
  esDisponible,
  seleccionarDisponibilidad,
  persistiendoDisponibilidad,
  onRecargar,
  onActivar
}: OperacionBottomSheetProps) {
  const cantidadDisponibles = TrasladosDisponibles.length;
  const hace = formatoHaceMinutos(ultimaActualizacion);

  return (
    <section
      className="fixed left-0 right-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-20 mt-2 mx-auto w-full max-w-md rounded-3xl border border-border/30 bg-surface-elevated/98 backdrop-blur-md p-4 shadow-xl supports-[backdrop-filter]:bg-surface-elevated/90"
      aria-label="Controles de operación del conductor"
    >
      {/* Handle visual para indicar que es un sheet deslizable */}
      <div className="mx-auto w-10 h-1.5 rounded-full bg-border/40 mb-2" aria-hidden />

      {/* Toggle de estado del conductor (zona de pulgar) */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-body text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Estado del conductor</span>
          <span className={`font-display text-sm font-black text-text-primary leading-none ${
            disponibilidad === "en_viaje" ? "text-route-action" : esDisponible ? "text-emerald-600 dark:text-emerald-400" : "text-text-secondary"
          }`}>
            {disponibilidad === "en_viaje" ? "En viaje" : esDisponible ? "Disponible" : "No disponible"}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={esDisponible}
          aria-label={esDisponible ? "Pasar a no disponible (pausar traslados)" : "Pasar a disponible (recibir traslados)"}
          disabled={disponibilidad === "en_viaje" || persistiendoDisponibilidad}
          onClick={() => seleccionarDisponibilidad(esDisponible ? "no_disponible" : "disponible")}
          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 p-1 transition-all duration-300 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action disabled:cursor-not-allowed disabled:opacity-50 ${
            esDisponible
              ? "bg-signal border-signal shadow-md shadow-signal/20"
              : "bg-surface border-border"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
              esDisponible ? "translate-x-7" : "translate-x-0"
            }`}
            aria-hidden
          />
        </button>
      </div>

      {disponibilidad === "en_viaje" && (
        <p className="mt-0.5 rounded-lg border border-route-action/20 bg-route-soft px-3 py-2 font-body text-xs font-semibold text-route-action flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Traslado activo — disponibilidad bloqueada.
        </p>
      )}

      {/* Módulo central de búsqueda */}
      <div className="mt-3">
        {!esDisponible ? (
          <button
            type="button"
            onClick={onActivar}
            disabled={persistiendoDisponibilidad}
            className={conductorButtonClasses({ variant: "primary", className: "w-full" })}
          >
            {persistiendoDisponibilidad ? "Actualizando…" : "Activarme ahora →"}
          </button>
        ) : cantidadDisponibles === 0 ? (
          <div className="flex gap-2">
            <Link
              href="/viajes"
              className={conductorButtonClasses({ variant: "secondary", className: "flex-1" })}
            >
              Ver bandeja →
            </Link>
            <button
              type="button"
              onClick={onRecargar}
              disabled={refrescando}
              className={conductorButtonClasses({ variant: "ghost", className: "shrink-0 px-4" })}
            >
              {refrescando ? "Buscando…" : "Buscar ahora"}
            </button>
          </div>
        ) : (
          <Link
            href="/viajes"
            className={conductorButtonClasses({ variant: "primary", className: "w-full" })}
          >
            {`Ver traslados (${cantidadDisponibles}) →`}
          </Link>
        )}
      </div>

      {esDisponible && cantidadDisponibles === 0 && hace && (
        <p className="mt-2 font-body text-[11px] text-text-tertiary text-center">
          Última búsqueda {hace} · Pull para refrescar
        </p>
      )}
    </section>
  );
}
