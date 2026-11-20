"use client";

import { Button as BaseButton } from "@ruum/ui/base";
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
  onActivar,
}: PanelOpportunitiesCardProps) {
  const disponible = disponibilidad === "disponible";
  const cantidad = TrasladosDisponibles.length;
  const primerViaje = TrasladosDisponibles[0];

  const titulo = !disponible
    ? "Activa tu disponibilidad"
    : cantidad > 0
      ? `${cantidad} traslado${cantidad > 1 ? "s" : ""} disponible${cantidad > 1 ? "s" : ""}`
      : "Sin traslados por ahora";

  const descripcionMovil = !disponible
    ? "Recibe solicitudes cercanas."
    : cantidad > 0
      ? `${primerViaje?.origen_ciudad || "Origen"} → ${primerViaje?.destino_ciudad || "Destino"}`
      : "Te avisaremos si hay traslados.";

  const buscar = () => {
    onRecargar?.();
  };

  return (
    <section
      className="driver-opportunity-card relative overflow-hidden rounded-lg border border-ui-line bg-ui-card p-4 shadow-ui-md"
      aria-labelledby="titulo-oportunidades"
    >
      <div className="flex flex-col">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3.5">
            <span
              className="inline-flex size-16 shrink-0 items-center justify-center rounded-lg bg-ui-muted text-ui-brand"
              aria-hidden="true"
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
                <path d="M9 3v15m6-12v15" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2
                id="titulo-oportunidades"
                className="font-display text-lg font-black leading-tight text-ui-fg"
              >
                {titulo}
              </h2>
              <p className="mt-1 font-body text-sm leading-5 text-ui-fg-muted">
                {descripcionMovil}
              </p>
            </div>
          </div>

          {!disponible ? (
            <BaseButton variant="ghost"
              type="button"
              onClick={onActivar}
              className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-ui-brand px-5 font-display text-sm font-bold text-ui-on-brand shadow-none transition hover:bg-ui-brand-hover active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
            >
              <span>Activarme ahora</span>
              <span aria-hidden="true" className="text-lg leading-none">→</span>
            </BaseButton>
          ) : (
            <Link
              href="/viajes"
              onClick={buscar}
              className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-ui-brand px-5 font-display text-sm font-bold text-ui-on-brand shadow-none transition hover:bg-ui-brand-hover active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
            >
              <span>{refrescando ? "Buscando traslados…" : "Buscar traslados ahora"}</span>
              <span aria-hidden="true" className="text-lg leading-none">→</span>
            </Link>
          )}
        </div>

      </div>
    </section>
  );
}
