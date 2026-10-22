"use client";

import Link from "next/link";
import type { EstadoEconomicoExplicito } from "@ruum/shared/constants";
import { etiquetaEstadoUnica, formatearFecha, formatearFechaCorta, formatearMoneda } from "./useEarningsLedger";

interface ViajeResumen {
  id: string;
  fecha: string;
  fechaDate: Date;
  vehiculo: string;
  origen: string;
  destino: string;
  montoGanado: number;
  precioBase: number;
  comisionRuum: number;
  gastosAutorizados: number;
  bonos: number;
  ajuste: number;
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
        "rounded-2xl border bg-surface overflow-hidden transition-all",
        estaExpandido ? "border-signal/40 shadow-sm" : "border-border hover:border-signal/30"
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => setViajeExpandido(estaExpandido ? null : viaje.id)}
        aria-expanded={estaExpandido}
        aria-controls={`acordeon-${viaje.id}`}
        className="w-full flex items-center gap-3 p-4 text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated text-route-action text-xl">
          🚘
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-bold text-text-primary truncate">{viaje.vehiculo}</h3>
          <p className="mt-0.5 font-body text-xs font-semibold text-text-primary flex items-center gap-1.5 flex-wrap">
            <span>{viaje.origen}</span>
            <span className="text-route-action font-bold">➔</span>
            <span>{viaje.destino}</span>
            <span className="text-text-tertiary font-normal">•</span>
            <span className="text-text-tertiary font-normal">{formatearFechaCorta(viaje.fecha)}</span>
          </p>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <p className="font-body text-xs font-bold uppercase tracking-wider text-text-tertiary">Ganancia</p>
          <p className="font-display text-sm font-bold text-emerald-800 dark:text-emerald-300">
            {formatearMoneda(viaje.montoGanado)}
          </p>
        </div>
        <span className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 font-body text-xs font-bold shrink-0 ${badge.clase}`}>
          {badge.texto}
        </span>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full border bg-surface-elevated text-text-tertiary transition-transform ${estaExpandido ? "rotate-180 border-route-action text-route-action" : "border-border"}`}
          aria-hidden
        >
          ⌄
        </span>
      </button>

      <div
        id={`acordeon-${viaje.id}`}
        className={`grid transition-all duration-200 ${estaExpandido ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/40 bg-surface-elevated/50 p-4 space-y-4">
            <div className="sm:hidden flex items-center justify-between gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-body text-xs font-bold ${badge.clase}`}>
                {badge.texto}
              </span>
              <span className="font-display text-sm font-bold text-emerald-800 dark:text-emerald-300">
                {formatearMoneda(viaje.montoGanado)}
              </span>
            </div>

            <div className="grid gap-2 rounded-xl border border-border/40 bg-surface p-3">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-text-tertiary">Desglose:</p>
              <div className="grid divide-y divide-border/30 rounded-xl border border-border/30 bg-surface-elevated overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-secondary">
                    Precio base
                    <button
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Precio base", texto: "Tarifa cotizada antes de comisiones. Es tu base de ganancia." })}
                      aria-label="Qué es el precio base, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-text-tertiary focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                    >
                      ?
                    </button>
                  </span>
                  <span className="font-display text-xs font-bold text-text-primary tabular-nums">{formatearMoneda(viaje.precioBase)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-secondary">
                    Bonos
                    <button
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Bonos", texto: "Incentivos por puntualidad o campañas. Se suman." })}
                      aria-label="Qué son los bonos, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-text-tertiary focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                    >
                      ?
                    </button>
                  </span>
                  <span className="font-display text-xs font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">+ {formatearMoneda(viaje.bonos)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-secondary">
                    Ajustes
                    <button
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Ajustes", texto: "Correcciones operativas. Pueden ser positivas o negativas." })}
                      aria-label="Qué son los ajustes, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-text-tertiary focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                    >
                      ?
                    </button>
                  </span>
                  <span className="font-display text-xs font-bold text-text-primary tabular-nums">+ {formatearMoneda(viaje.ajuste)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-danger/5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-red-500">
                    Tasa Ruum-Ruum (-)
                    <button
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Tasa Ruum", texto: "Comisión de plataforma por intermediación y soporte." })}
                      aria-label="Qué es la tasa Ruum, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-danger/30 bg-surface text-xs font-bold text-red-500 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                    >
                      ?
                    </button>
                  </span>
                  <span className="font-display text-xs font-bold text-red-500 tabular-nums">− {formatearMoneda(viaje.comisionRuum)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-secondary">
                    Reembolso gastos (+)
                    <button
                      type="button"
                      onClick={() => setInfoSheet({ titulo: "Reembolso de gastos", texto: "Gastos autorizados comprobados (peajes, combustible)." })}
                      aria-label="Qué es el reembolso, toca para ver explicación"
                      className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-text-tertiary focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                    >
                      ?
                    </button>
                  </span>
                  <span className="font-display text-xs font-bold text-text-primary tabular-nums">+ {formatearMoneda(viaje.gastosAutorizados)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-elevated border border-border px-3 py-2">
                <span className="font-body text-xs font-bold text-text-secondary">Aporte del viaje al depósito</span>
                <span className="font-display text-xs font-black text-text-primary tabular-nums">
                  {formatearMoneda(viaje.precioBase + viaje.bonos + viaje.ajuste - viaje.comisionRuum + viaje.gastosAutorizados)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 font-body text-xs">
              <span className="rounded-full border border-border bg-surface px-3 py-1.5">
                <span className="text-text-tertiary">Fecha:</span> <strong className="text-text-primary">{formatearFecha(viaje.fecha)}</strong>
              </span>
              <span className="rounded-full border border-border bg-surface px-3 py-1.5">
                <span className="text-text-tertiary">Liberación:</span> <strong className="text-text-primary">{viaje.liberacion}</strong>
              </span>
              <span className="rounded-full border border-border bg-surface px-3 py-1.5">
                <span className="text-text-tertiary">Estado:</span> <strong className="text-text-primary capitalize">{viaje.estadoTraslado.replace(/_/g, " ")}</strong>
              </span>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/viajes/${viaje.id}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-signal px-4 py-2.5 font-display text-sm font-bold text-on-primary hover:bg-signal/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-signal"
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
