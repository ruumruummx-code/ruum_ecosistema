"use client";

import Link from "next/link";
import type { PasaporteRow } from "./panel-utils";
import type { Disponibilidad } from "./usePanelData";

interface PanelOpportunitiesCardProps {
  disponibilidad: Disponibilidad;
  TrasladosDisponibles: PasaporteRow[];
  ultimaActualizacion?: Date | null;
  refrescando?: boolean;
  onRecargar?: () => void;
  onActivar?: () => void;
}

export function PanelOpportunitiesCard({
  disponibilidad,
  TrasladosDisponibles,
  refrescando = false,
  onRecargar,
  onActivar
}: PanelOpportunitiesCardProps) {
  const disponible = disponibilidad === "disponible";
  const cantidad = TrasladosDisponibles.length;
  const primerViaje = TrasladosDisponibles[0];
  const titulo = !disponible ? "Activa tu disponibilidad" : cantidad > 0 ? `${cantidad} traslado${cantidad > 1 ? "s" : ""} disponible${cantidad > 1 ? "s" : ""}` : "Sin traslados por ahora";
  const descripcion = !disponible
    ? "Activa tu estado para recibir solicitudes cercanas."
    : cantidad > 0
      ? `${primerViaje?.origen_ciudad || "Origen"} → ${primerViaje?.destino_ciudad || "Destino"}`
      : "Te avisaremos con sonido cuando haya traslados.";

  const buscar = () => {
    onRecargar?.();
  };

  return (
    <section className="driver-opportunity-card rounded-2xl border border-border/60 bg-surface p-4 shadow-[0_5px_20px_rgba(13,43,94,0.05)]" aria-labelledby="titulo-oportunidades">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-[76px] shrink-0 items-center justify-center rounded-2xl bg-route-action/10 text-route-action" aria-hidden>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></svg>
        </span>
        <div className="min-w-0">
          <h2 id="titulo-oportunidades" className="font-display text-lg font-black leading-tight text-text-primary">{titulo}</h2>
          <p className="mt-1 font-body text-sm leading-5 text-text-secondary">{descripcion}</p>
        </div>
      </div>

      {!disponible ? (
        <button type="button" onClick={onActivar} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-route-action px-4 font-display text-base font-black text-white shadow-md shadow-route-action/20 transition hover:bg-route-action/90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route-action">Activarme ahora →</button>
      ) : (
        <Link href="/viajes" onClick={buscar} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-route-action px-4 font-display text-base font-black text-white shadow-md shadow-route-action/20 transition hover:bg-route-action/90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route-action">
          <span className="mr-2 text-2xl font-normal leading-none" aria-hidden>+</span>{refrescando ? "Buscando traslados…" : "Buscar traslados ahora"}<span className="ml-3 text-xl leading-none" aria-hidden>→</span>
        </Link>
      )}
    </section>
  );
}
