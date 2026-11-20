"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import Link from "next/link";
import type { EstadoEconomicoExplicito } from "@ruum/shared/constants";
import { etiquetaEstadoUnica, formatearFecha, formatearFechaCorta, formatearMoneda } from "./useEarningsLedger";

interface ViajeResumen {
  id: string;
  fecha: string;
  fechaDate: Date;
  vehiculo: string;
  vehiculoId?: string;
  origen: string;
  destino: string;
  montoGanado: number | null;
  precioBase: number;
  comisionRuum: number | null;
  gastosAutorizados: number | null;
  bonos: number | null;
  ajuste: number | null;
  estatusEconomico: EstadoEconomicoExplicito;
  liberacion: string;
  estadoTraslado: string;
}

interface EarningsTripRowProps {
  viaje: ViajeResumen;
  expandido: string | null;
  setViajeExpandido: (id: string | null) => void;
  setInfoSheet: (sheet: { titulo: string; texto: string } | null) => void;
}

export function EarningsTripRow({
  viaje,
  expandido,
  setViajeExpandido,
  setInfoSheet
}: EarningsTripRowProps) {
  const badge = etiquetaEstadoUnica(viaje.estatusEconomico);
  const estaExpandido = expandido === viaje.id;

  return (
    <div
      key={viaje.id}
      className={[
        "rounded-lg border bg-ui-card overflow-hidden transition-all",
        estaExpandido ? "border-ui-brand/40 shadow-sm" : "border-ui-line hover:border-ui-brand/30"
      ].join(" ")}
    >
      <BaseButton variant="ghost"
        type="button"
        onClick={() => setViajeExpandido(estaExpandido ? null : viaje.id)}
        aria-expanded={estaExpandido}
        aria-controls={`acordeon-${viaje.id}`}
        className="w-full flex items-center gap-3 p-4 text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-ui-line bg-ui-muted text-ui-brand text-xl">
          🚘
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-bold text-ui-fg truncate">{viaje.vehiculo}</h3>
          <p className="mt-0.5 font-body text-xs font-semibold text-ui-fg flex items-center gap-1.5 flex-wrap">
            <span>{viaje.origen}</span>
            <span className="text-ui-brand font-bold">➔</span>
            <span>{viaje.destino}</span>
            <span className="text-ui-fg-muted font-normal">•</span>
            <span className="text-ui-fg-muted font-normal">{formatearFechaCorta(viaje.fecha)}</span>
          </p>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <p className="font-body text-xs font-bold uppercase tracking-wider text-ui-fg-muted">Ganancia</p>
          <p className="font-display text-sm font-bold text-ui-success ">
            {formatearMoneda(viaje.montoGanado)}
          </p>
        </div>
        <span className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 font-body text-xs font-bold shrink-0 ${badge.clase}`}>
          {badge.texto}
        </span>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full border bg-ui-muted text-ui-fg-muted transition-transform ${estaExpandido ? "rotate-180 border-ui-brand text-ui-brand" : "border-ui-line"}`}
          aria-hidden
        >
          ⌄
        </span>
      </BaseButton>

      <div
        id={`acordeon-${viaje.id}`}
        className={`grid transition-all duration-200 ${estaExpandido ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-ui-line/40 bg-ui-muted/50 p-4 space-y-4">
            <div className="sm:hidden flex items-center justify-between gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-body text-xs font-bold ${badge.clase}`}>
                {badge.texto}
              </span>
              <span className="font-display text-sm font-bold text-ui-success ">
                {formatearMoneda(viaje.montoGanado)}
              </span>
            </div>

            <div className="grid gap-2 rounded-xl border border-ui-line/40 bg-ui-card p-3">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-ui-fg-muted">Desglose:</p>
              <div className="grid divide-y divide-ui-line/30 rounded-xl border border-ui-line/30 bg-ui-muted overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-ui-fg-muted">
                    Precio base
                    <BaseButton variant="ghost"
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Precio base", texto: "Tarifa cotizada antes de comisiones. Es tu base de ganancia." })}
                      aria-label="Qué es el precio base, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-ui-line bg-ui-card text-xs font-bold text-ui-fg-muted focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                    >
                      ?
                    </BaseButton>
                  </span>
                  <span className="font-display text-xs font-bold text-ui-fg tabular-nums">{formatearMoneda(viaje.precioBase)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-ui-fg-muted">
                    Bonos
                    <BaseButton variant="ghost"
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Bonos", texto: "Incentivos por puntualidad o campañas. Se liquidan en corte." })}
                      aria-label="Qué son los bonos, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-ui-line bg-ui-card text-xs font-bold text-ui-fg-muted focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                    >
                      ?
                    </BaseButton>
                  </span>
                  <span className="font-display text-xs font-bold text-ui-success  tabular-nums">
                    {viaje.bonos !== null ? `+ ${formatearMoneda(viaje.bonos)}` : "No desglosado"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-ui-fg-muted">
                    Ajustes
                    <BaseButton variant="ghost"
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Ajustes", texto: "Correcciones operativas. Se aplican en el corte de liquidación." })}
                      aria-label="Qué son los ajustes, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-ui-line bg-ui-card text-xs font-bold text-ui-fg-muted focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                    >
                      ?
                    </BaseButton>
                  </span>
                  <span className="font-display text-xs font-bold text-ui-fg tabular-nums">
                    {viaje.ajuste !== null ? `+ ${formatearMoneda(viaje.ajuste)}` : "En corte"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-ui-danger/5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-ui-danger">
                    Tasa Ruum-Ruum (-)
                    <BaseButton variant="ghost"
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Tasa Ruum", texto: "Comisión de plataforma por intermediación y soporte." })}
                      aria-label="Qué es la tasa Ruum, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-ui-danger/30 bg-ui-card text-xs font-bold text-ui-danger focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                    >
                      ?
                    </BaseButton>
                  </span>
                  <span className="font-display text-xs font-bold text-ui-danger tabular-nums">
                    {viaje.comisionRuum !== null ? `− ${formatearMoneda(viaje.comisionRuum)}` : "No disponible"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-ui-fg-muted">
                    Reembolso gastos (+)
                    <BaseButton variant="ghost"
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Reembolso de gastos", texto: "Gastos autorizados comprobados (peajes, combustible) reembolsados en corte." })}
                      aria-label="Qué es el reembolso, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-ui-line bg-ui-card text-xs font-bold text-ui-fg-muted focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                    >
                      ?
                    </BaseButton>
                  </span>
                  <span className="font-display text-xs font-bold text-ui-fg tabular-nums">
                    {viaje.gastosAutorizados !== null ? `+ ${formatearMoneda(viaje.gastosAutorizados)}` : "Ver en corte"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-ui-muted border border-ui-line px-3 py-2">
                <span className="font-body text-xs font-bold text-ui-fg-muted">Ganancia del viaje</span>
                <span className="font-display text-xs font-black text-ui-fg tabular-nums">
                  {formatearMoneda(viaje.montoGanado)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 font-body text-xs">
              <span className="rounded-full border border-ui-line bg-ui-card px-3 py-1.5">
                <span className="text-ui-fg-muted">Fecha:</span> <strong className="text-ui-fg">{formatearFecha(viaje.fecha)}</strong>
              </span>
              <span className="rounded-full border border-ui-line bg-ui-card px-3 py-1.5">
                <span className="text-ui-fg-muted">Liberación:</span> <strong className="text-ui-fg">{viaje.liberacion}</strong>
              </span>
              <span className="rounded-full border border-ui-line bg-ui-card px-3 py-1.5">
                <span className="text-ui-fg-muted">Estado:</span> <strong className="text-ui-fg capitalize">{viaje.estadoTraslado.replace(/_/g, " ")}</strong>
              </span>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/viajes/${viaje.id}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-ui-brand px-4 py-2.5 font-display text-sm font-bold text-ui-on-brand hover:bg-ui-brand/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
              >
                Ver detalle del traslado →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
