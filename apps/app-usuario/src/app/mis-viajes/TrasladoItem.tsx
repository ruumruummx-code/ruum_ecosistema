"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, UserRound } from "lucide-react";
import { Button, cn } from "@ruum/ui/base";
import { placaVisible } from "../../lib/traslado-presentacion";
import { EstadoTraslado, VehiculoTraslado } from "./VisualesTraslado";
import { presentarViaje, primerNombre } from "./presentacion";
import { fechaProgramada, folioCorto, vehiculoNombre, type ViajeLista } from "./useGestionTraslados";

/**
 * Fila de traslado: la misma tarjeta en móvil y escritorio.
 * Toda la tarjeta es pulsable (abre el detalle); la acción contextual va aparte.
 */
export function TrasladoItem({
  viaje,
  seleccionado = false,
  onAbrir,
}: {
  viaje: ViajeLista;
  seleccionado?: boolean;
  onAbrir: (viaje: ViajeLista) => void;
}) {
  const p = viaje.pasaporte;
  const vista = presentarViaje(viaje);
  const nombre = vehiculoNombre(p);
  const fecha = fechaProgramada(viaje.traslado?.fecha_hora_programada ?? null);
  const conductor = primerNombre(p.conductor_nombre) ?? "Por asignar";

  return (
    <article
      data-selected={seleccionado || undefined}
      className={cn(
        "group relative rounded-lg border border-ui-line bg-ui-card p-4 shadow-ui-sm transition-[border-color,box-shadow]",
        "hover:border-ui-line-strong hover:shadow-ui-md",
        "data-[selected]:border-ui-brand data-[selected]:ring-4 data-[selected]:ring-ui-ring",
        vista.categoria === "cancelados" && "opacity-80",
      )}
    >
      <div className="flex items-start gap-3">
        <VehiculoTraslado viaje={viaje} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-sm font-semibold text-ui-fg [overflow-wrap:anywhere] sm:text-base">
              <button
                type="button"
                aria-label={`Ver ${nombre}`}
                aria-pressed={seleccionado}
                onClick={() => onAbrir(viaje)}
                className="cursor-pointer text-left after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-ui-ring"
              >
                {nombre}
              </button>
            </h3>
            <EstadoTraslado viaje={viaje} className="relative" />
          </div>
          <p className="mt-0.5 font-mono text-xs text-ui-fg-muted">
            {placaVisible(p.vehiculo_placas)} · {folioCorto(p.traslado_id)}
          </p>
        </div>
      </div>

      <p className="mt-3 flex min-w-0 items-center gap-2 text-sm text-ui-fg">
        <span className="min-w-0 truncate">{vista.origen}</span>
        <ArrowRight className="size-4 shrink-0 text-ui-fg-muted" aria-label="hacia" />
        <span className="min-w-0 truncate">{vista.destino}</span>
      </p>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-ui-line pt-3">
        <dl className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ui-fg-muted">
          <div className="flex items-center gap-1.5">
            <dt><CalendarDays className="size-3.5" aria-label="Fecha" /></dt>
            <dd>{fecha.fecha}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt><UserRound className="size-3.5" aria-label="Conductor" /></dt>
            <dd className="font-medium text-ui-fg">{conductor}</dd>
          </div>
        </dl>
        <Button asChild size="sm" variant={vista.accionDestacada ? "primary" : "secondary"} className="relative">
          <Link href={vista.url}>{vista.accion}</Link>
        </Button>
      </div>
    </article>
  );
}
