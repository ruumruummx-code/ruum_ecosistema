"use client";

import Link from "next/link";
import { Card, FinancialCard } from "@ruum/ui";
import {
  formatearMoneda,
  formatearRango,
  ResumenGanancias
} from "./useEarningsLedger";

interface EarningsSummaryProps {
  resumen: ResumenGanancias;
  fechaDispersion: string;
  periodoActivo: string;
  rangoActual: { inicio: Date; fin: Date };
  setInfoSheet: (sheet: { titulo: string; texto: string } | null) => void;
}

export function EarningsSummary({
  resumen,
  fechaDispersion,
  periodoActivo,
  rangoActual,
  setInfoSheet
}: EarningsSummaryProps) {
  return (
    <section className="mt-5 grid gap-4" aria-label="Resumen financiero del periodo">
      {/* Fila 1: Traslados | Vehículos — mismo nivel, sin # */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="flex flex-col border-border/40" padding="none">
          <div className="p-4 sm:p-5">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-text-tertiary">Traslados</p>
            <p className="mt-2 font-display text-3xl sm:text-4xl font-black tracking-tight text-text-primary tabular-nums">
              {resumen.totalTraslados}
            </p>
            <p className="mt-1 font-body text-xs font-semibold text-text-tertiary">Traslados realizados</p>
          </div>
        </Card>
        <Card className="flex flex-col border-border/40" padding="none">
          <div className="p-4 sm:p-5">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-text-tertiary">Vehículos</p>
            <p className="mt-2 font-display text-3xl sm:text-4xl font-black tracking-tight text-text-primary tabular-nums">
              {resumen.totalVehiculos}
            </p>
            <p className="mt-1 font-body text-xs font-semibold text-text-tertiary">vehículos trasladados</p>
          </div>
        </Card>
      </div>

      {/* Tarjeta única: Devengo del periodo + Desglose completo con tooltips */}
      <FinancialCard className="overflow-hidden p-0 border-border/60" padding="none">
        <div className="px-4 sm:px-6 pt-5 sm:pt-6">
          <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-text-primary">
            Depósito acumulado
          </h2>
          <p className="mt-2 font-display text-3xl sm:text-4xl font-black tracking-tight text-text-primary tabular-nums">
            {formatearMoneda(resumen.depositoAcumulado)}
          </p>
          <p className="mt-1.5 font-body text-xs font-semibold text-text-tertiary">
            (Dispersión {fechaDispersion})
          </p>
        </div>

        <div className="mt-4 mx-4 sm:mx-6 mb-5 sm:mb-6 rounded-2xl border border-border/40 bg-surface-elevated overflow-hidden">
          <p className="px-4 pt-3 pb-1 font-body text-xs font-bold uppercase tracking-widest text-text-tertiary">
            Desglose:
          </p>
          <div className="grid divide-y divide-border/30">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-text-secondary">
                Precio base
                <button
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Precio base",
                      texto: "Tarifa cotizada del traslado antes de comisiones y ajustes. Es la base para el cálculo de tu ganancia. Ejemplo: si el traslado se cotizó en $1,000, este es tu punto de partida."
                    })
                  }
                  aria-label="Qué es el precio base, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-text-tertiary hover:border-signal/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                >
                  ?
                </button>
              </span>
              <span className="font-display text-sm font-bold text-text-primary tabular-nums">
                {formatearMoneda(resumen.precioBase)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-text-secondary">
                Bonos
                <button
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Bonos",
                      texto: "Incentivos por puntualidad, disponibilidad o campañas vigentes. Se suman a tu ganancia. Ejemplo: +$150 por racha de 5 traslados sin incidencias."
                    })
                  }
                  aria-label="Qué son los bonos, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-text-tertiary hover:border-signal/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                >
                  ?
                </button>
              </span>
              <span className="font-display text-sm font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                + {formatearMoneda(resumen.bonos)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-text-secondary">
                Ajustes
                <button
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Ajustes",
                      texto: "Correcciones operativas del periodo (diferencias de tarifa, compensaciones). Pueden ser positivos o negativos. Si ves un ajuste negativo, es una corrección acordada con soporte."
                    })
                  }
                  aria-label="Qué son los ajustes, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-text-tertiary hover:border-signal/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                >
                  ?
                </button>
              </span>
              <span className={`font-display text-sm font-bold tabular-nums ${resumen.ajuste < 0 ? "text-red-500" : "text-text-primary"}`}>
                {resumen.ajuste >= 0 ? "+" : ""} {formatearMoneda(resumen.ajuste)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-danger/5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-red-500">
                Tasa Ruum (–)
                <button
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Tasa Ruum",
                      texto: "Comisión de plataforma por intermediación, soporte operativo y seguro. Se descuenta del precio base. Ejemplo: de $1,000 con tasa 15%, recibes $850 antes de bonos."
                    })
                  }
                  aria-label="Qué es la tasa Ruum, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-danger/30 bg-surface text-xs font-bold text-red-500 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                >
                  ?
                </button>
              </span>
              <span className="font-display text-sm font-bold text-red-500 tabular-nums">
                − {formatearMoneda(resumen.comisionRuum)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-text-secondary">
                Reembolso gastos (+)
                <button
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Reembolso de gastos",
                      texto: "Gastos autorizados y comprobados (combustible, peajes) que Ruum te reembolsa. Se suma al depósito final. Guarda tu ticket y repórtalo a soporte."
                    })
                  }
                  aria-label="Qué es el reembolso de gastos, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-text-tertiary hover:border-signal/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                >
                  ?
                </button>
              </span>
              <span className="font-display text-sm font-bold text-text-primary tabular-nums">
                + {formatearMoneda(resumen.reembolsoGastos)}
              </span>
            </div>
          </div>
          {resumen.retenciones > 0 && (
            <p className="px-4 py-2 font-body text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 border-t border-amber-500/20">
              Retenciones en revisión descontadas: {formatearMoneda(resumen.retenciones)}
            </p>
          )}
        </div>
      </FinancialCard>
    </section>
  );
}
