"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CircleX, UserRound } from "lucide-react";
import { Button, Card } from "@ruum/ui/base";
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
  conPanel = false,
  onAbrir,
}: {
  viaje: ViajeLista;
  seleccionado?: boolean;
  conPanel?: boolean;
  onAbrir: (viaje: ViajeLista) => void;
}) {
  const p = viaje.pasaporte;
  const vista = presentarViaje(viaje);
  const nombre = vehiculoNombre(p);
  const folio = folioCorto(p.traslado_id);
  const fechaCierre = p.cerrado_en && Number.isFinite(Date.parse(p.cerrado_en))
    ? fechaProgramada(p.cerrado_en).fecha
    : null;
  const fecha = fechaProgramada(viaje.traslado?.fecha_hora_programada ?? null);
  const conductor = primerNombre(p.conductor_nombre) ?? "Por asignar";

  return (
    <article
      data-selected={seleccionado || undefined}
      className="relative rounded-lg transition-shadow focus-within:ring-2 focus-within:ring-ui-ring"
    >
      <Card className={seleccionado
        ? "border-ui-brand bg-ui-brand-soft p-3 ring-2 ring-ui-brand"
        : "p-3 hover:border-ui-line-strong hover:shadow-ui-md"}
      >
        <div className="flex items-start gap-3">
          <VehiculoTraslado viaje={viaje} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-sm font-semibold text-ui-fg [overflow-wrap:anywhere] sm:text-base">
                <Button
                  variant="link"
                  aria-label={`Ver ${folio} · ${nombre}${conPanel ? " en el panel" : ""}`}
                  aria-pressed={conPanel ? seleccionado : undefined}
                  onClick={() => onAbrir(viaje)}
                  className="whitespace-normal text-left font-mono text-base font-bold text-ui-fg after:absolute after:inset-0 after:rounded-lg"
                >
                  {folio}
                </Button>
              </h3>
              <EstadoTraslado viaje={viaje} className="relative" />
            </div>
            <p className="mt-0.5 text-xs text-ui-fg-muted">
              {nombre} · <span className="font-mono">{placaVisible(p.vehiculo_placas)}</span>
            </p>
          </div>
        </div>

        <p className="mt-2 flex min-w-0 items-center gap-2 text-sm font-semibold text-ui-fg">
          <span className="min-w-0 [overflow-wrap:anywhere]">{vista.origen}</span>
          <ArrowRight className="size-4 shrink-0 text-ui-fg-muted" aria-label="hacia" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{vista.destino}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-ui-line pt-2">
          <dl className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ui-fg-muted">
            {vista.cancelado ? (
              <div className="flex items-center gap-1.5">
                <dt><CircleX className="size-3.5" aria-label="Cierre" /></dt>
                <dd>Servicio cancelado{fechaCierre && ` · ${fechaCierre}`}</dd>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <dt><CalendarDays className="size-3.5" aria-label="Fecha" /></dt>
                  <dd>{fecha.fecha}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt><UserRound className="size-3.5" aria-label="Conductor" /></dt>
                  <dd className="font-medium text-ui-fg">{conductor}</dd>
                </div>
              </>
            )}
          </dl>
          <Button asChild size="sm" variant={vista.accionDestacada ? "primary" : "secondary"} className="relative">
            <Link href={vista.url} aria-label={`${vista.accion} de ${folio}`}>{vista.accion}</Link>
          </Button>
        </div>
      </Card>
    </article>
  );
}
