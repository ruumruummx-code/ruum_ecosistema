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
      <h3 className="font-display text-sm font-bold text-ui-fg">Liquidaciones del periodo</h3>
      <div className="mt-3 grid gap-3">
        {payoutsFiltrados.map((payout) => (
          <Card key={payout.id} className="p-4" padding="none">
            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ui-line/40 pb-3">
                <div>
                  <p className="font-body text-xs font-bold uppercase tracking-wider text-ui-fg-muted">
                    Periodo Operativo
                  </p>
                  <h4 className="font-display text-sm font-bold text-ui-fg">
                    {formatearFecha(payout.periodo_inicio ?? "")} ➔ {formatearFecha(payout.periodo_fin ?? "")}
                  </h4>
                </div>
                <span className={`font-display text-xs font-bold ${estatusPayoutFn(payout) === "pagado" ? "text-ui-success" : estatusPayoutFn(payout) === "programado" ? "text-ui-warning" : "text-ui-danger"}`}>
                  {estatusPayoutFn(payout)}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 font-body text-xs">
                <div className="rounded-xl border border-ui-line/40 bg-ui-muted p-3">
                  <p className="text-ui-fg-muted font-semibold uppercase">Monto Bruto</p>
                  <p className="mt-1 font-display text-sm font-bold text-ui-fg">
                    ${Number(payout.monto_bruto ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl border border-ui-line/40 bg-ui-muted p-3">
                  <p className="text-ui-fg-muted font-semibold uppercase">Ajustes</p>
                  <p className="mt-1 font-display text-sm font-bold text-ui-fg">
                    ${Number(payout.ajustes ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl border border-ui-line/60 bg-ui-muted p-3">
                  <p className="text-ui-fg font-bold uppercase text-xs">Monto Neto</p>
                  <p className="mt-1 font-display text-sm font-black text-ui-fg">
                    ${Number(payout.monto_neto ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              {payout.referencia_pago && (
                <p className="font-body text-xs text-ui-fg-muted">Referencia administrativa (no confirma transferencia): {payout.referencia_pago}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
