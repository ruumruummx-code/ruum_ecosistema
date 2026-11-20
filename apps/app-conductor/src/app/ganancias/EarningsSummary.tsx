"use client";

import { Button as BaseButton } from "@ruum/ui/base";
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
        <Card className="flex flex-col border-ui-line/40" padding="none">
          <div className="p-4 sm:p-5">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-ui-fg-muted">Traslados</p>
            <p className="mt-2 font-display text-3xl sm:text-4xl font-black tracking-tight text-ui-fg tabular-nums">
              {resumen.totalTraslados}
            </p>
            <p className="mt-1 font-body text-xs font-semibold text-ui-fg-muted">Traslados realizados</p>
          </div>
        </Card>
        <Card className="flex flex-col border-ui-line/40" padding="none">
          <div className="p-4 sm:p-5">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-ui-fg-muted">Vehículos</p>
            <p className="mt-2 font-display text-3xl sm:text-4xl font-black tracking-tight text-ui-fg tabular-nums">
              {resumen.totalVehiculos}
            </p>
            <p className="mt-1 font-body text-xs font-semibold text-ui-fg-muted">vehículos trasladados</p>
          </div>
        </Card>
      </div>

      {/* Tarjeta única: Devengo del periodo + Desglose completo con tooltips */}
      <FinancialCard className="overflow-hidden p-0 border-ui-line/60" padding="none">
        <div className="px-4 sm:px-6 pt-5 sm:pt-6">
          <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-ui-fg">
            Depósito acumulado
          </h2>
          <p className="mt-2 font-display text-3xl sm:text-4xl font-black tracking-tight text-ui-fg tabular-nums">
            {formatearMoneda(resumen.depositoAcumulado)}
          </p>
          <p className="mt-1.5 font-body text-xs font-semibold text-ui-fg-muted">
            (Dispersión {fechaDispersion})
          </p>
        </div>

        <div className="mt-4 mx-4 sm:mx-6 mb-5 sm:mb-6 rounded-lg border border-ui-line/40 bg-ui-muted overflow-hidden">
          <p className="px-4 pt-3 pb-1 font-body text-xs font-bold uppercase tracking-widest text-ui-fg-muted">
            Desglose:
          </p>
          <div className="grid divide-y divide-ui-line/30">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-fg-muted">
                Precio base
                <BaseButton variant="ghost"
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Precio base",
                      texto: "Tarifa cotizada del traslado antes de comisiones y ajustes. Es la base para el cálculo de tu ganancia. Ejemplo: si el traslado se cotizó en $1,000, este es tu punto de partida."
                    })
                  }
                  aria-label="Qué es el precio base, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-ui-line bg-ui-card text-xs font-bold text-ui-fg-muted hover:border-ui-brand/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                >
                  ?
                </BaseButton>
              </span>
              <span className="font-display text-sm font-bold text-ui-fg tabular-nums">
                {formatearMoneda(resumen.precioBase)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-fg-muted">
                Bonos
                <BaseButton variant="ghost"
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Bonos",
                      texto: "Incentivos por puntualidad, disponibilidad o campañas vigentes. Se suman a tu ganancia. Ejemplo: +$150 por racha de 5 traslados sin incidencias."
                    })
                  }
                  aria-label="Qué son los bonos, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-ui-line bg-ui-card text-xs font-bold text-ui-fg-muted hover:border-ui-brand/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                >
                  ?
                </BaseButton>
              </span>
              <span className="font-display text-sm font-bold text-ui-success  tabular-nums">
                {resumen.bonos !== null ? `+ ${formatearMoneda(resumen.bonos)}` : "Por calcular"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-fg-muted">
                Ajustes
                <BaseButton variant="ghost"
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Ajustes",
                      texto: "Correcciones operativas del periodo (diferencias de tarifa, compensaciones). Pueden ser positivos o negativos. Si ves un ajuste negativo, es una corrección acordada con soporte."
                    })
                  }
                  aria-label="Qué son los ajustes, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-ui-line bg-ui-card text-xs font-bold text-ui-fg-muted hover:border-ui-brand/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                >
                  ?
                </BaseButton>
              </span>
              <span className={`font-display text-sm font-bold tabular-nums ${resumen.ajuste < 0 ? "text-ui-danger" : "text-ui-fg"}`}>
                {resumen.ajuste >= 0 ? "+" : ""} {formatearMoneda(resumen.ajuste)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-ui-danger/5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-danger">
                Tasa Ruum (–)
                <BaseButton variant="ghost"
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Tasa Ruum",
                      texto: "Comisión de plataforma por intermediación, soporte operativo y seguro. Se descuenta del precio base. Ejemplo: de $1,000 con tasa 15%, recibes $850 antes de bonos."
                    })
                  }
                  aria-label="Qué es la tasa Ruum, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-ui-danger/30 bg-ui-card text-xs font-bold text-ui-danger focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                >
                  ?
                </BaseButton>
              </span>
              <span className="font-display text-sm font-bold text-ui-danger tabular-nums">
                {resumen.comisionRuum !== null ? `− ${formatearMoneda(resumen.comisionRuum)}` : "Por calcular"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-fg-muted">
                Reembolso gastos (+)
                <BaseButton variant="ghost"
                  type="button"
                  onClick={() =>
                    setInfoSheet({
                      titulo: "Reembolso de gastos",
                      texto: "Gastos autorizados y comprobados (combustible, peajes) que Ruum te reembolsa. Se suma al depósito final. Guarda tu ticket y repórtalo a soporte."
                    })
                  }
                  aria-label="Qué es el reembolso de gastos, toca para ver explicación"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-ui-line bg-ui-card text-xs font-bold text-ui-fg-muted hover:border-ui-brand/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                >
                  ?
                </BaseButton>
              </span>
              <span className="font-display text-sm font-bold text-ui-fg tabular-nums">
                {resumen.reembolsoGastos !== null ? `+ ${formatearMoneda(resumen.reembolsoGastos)}` : "Por calcular"}
              </span>
            </div>
          </div>
          {resumen.totalesIncompletos && (
            <p className="px-4 py-2 font-body text-xs text-ui-warning  bg-ui-warning/10 border-t border-ui-warning/30">
              ⚠️ <strong>Totales preliminares:</strong> El desglose de bonos o gastos está en conciliación operativa y no se asume en cero.
            </p>
          )}
          {resumen.retenciones > 0 && (
            <p className="px-4 py-2 font-body text-xs text-ui-warning  bg-ui-warning/5 border-t border-ui-warning/20">
              Retenciones en revisión descontadas: {formatearMoneda(resumen.retenciones)}
            </p>
          )}
        </div>
      </FinancialCard>
    </section>
  );
}
