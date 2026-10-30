"use client";

import { Card } from "@ruum/ui";
import { formatearFecha } from "./useEarningsLedger";

interface PayoutResumen {
  id: string;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  monto_bruto: number | null;
  ajustes: number | null;
  monto_neto: number | null;
  estado: string;
  pagado_en?: string|null;
  referencia_externa_validada?: string|null;
  referencia_pago: string | null;
}

interface EarningsPayoutsSectionProps {
  payoutsFiltrados: PayoutResumen[];
  estatusPayout: (payout: PayoutResumen) => string;
}

export function EarningsPayoutsSection({
  payoutsFiltrados,
  estatusPayout: estatusPayoutFn
}: EarningsPayoutsSectionProps) {
  return (
    <div className="mt-8">
      <h3 className="font-display text-sm font-bold text-text-primary">Liquidaciones del periodo</h3>
      <div className="mt-3 grid gap-3">
        {payoutsFiltrados.map((payout) => (
          <Card key={payout.id} className="p-4" padding="none">
            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <p className="font-body text-xs font-bold uppercase tracking-wider text-text-tertiary">
                    Periodo Operativo
                  </p>
                  <h4 className="font-display text-sm font-bold text-text-primary">
                    {formatearFecha(payout.periodo_inicio ?? "")} ➔ {formatearFecha(payout.periodo_fin ?? "")}
                  </h4>
                </div>
                <span className={`font-display text-xs font-bold ${estatusPayoutFn(payout) === "pagado" ? "text-emerald-600" : estatusPayoutFn(payout) === "programado" ? "text-amber-600" : "text-rose-600"}`}>
                  {estatusPayoutFn(payout)}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 font-body text-xs">
                <div className="rounded-xl border border-border/40 bg-surface-elevated p-3">
                  <p className="text-text-tertiary font-semibold uppercase">Monto Bruto</p>
                  <p className="mt-1 font-display text-sm font-bold text-text-primary">
                    ${Number(payout.monto_bruto ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl border border-border/40 bg-surface-elevated p-3">
                  <p className="text-text-tertiary font-semibold uppercase">Ajustes</p>
                  <p className="mt-1 font-display text-sm font-bold text-text-primary">
                    ${Number(payout.ajustes ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-surface-elevated p-3">
                  <p className="text-text-primary font-bold uppercase text-xs">Monto Neto</p>
                  <p className="mt-1 font-display text-sm font-black text-text-primary">
                    ${Number(payout.monto_neto ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              {payout.referencia_pago && (
                <p className="font-body text-xs text-text-tertiary">Referencia administrativa (no confirma transferencia): {payout.referencia_pago}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
