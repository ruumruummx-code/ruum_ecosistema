"use client";
import React from "react";
import type { FilaMasiva } from "../../hooks/useCargaMasiva";
import { PagoStripe } from "@/app/PagoStripe";

interface Props {
  filas: FilaMasiva[];
  totalMXN: number;
  /** ID del traslado masivo para el checkout */
  cargaId?: string;
  clientSecret?: string;
  onEstadoPago: (estado: { listo: boolean; procesando: boolean }) => void;
  onPagado: () => void;
}

export function CheckoutMasivo({ filas, totalMXN, cargaId, clientSecret, onPagado, onEstadoPago }: Props) {
  const formId = `pago-masivo-${cargaId ?? "pendiente"}`;
  const filasConTarifa = filas.filter((f) => !f.eliminada && f.tarifa != null);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* ── Resumen de traslados ─────────────────────────────── */}
      <section aria-label="Resumen de traslados">
        <h3 className="mb-2 text-sm font-bold">
          {filasConTarifa.length} traslado{filasConTarifa.length !== 1 ? "s" : ""} en esta carga
        </h3>
        <div className="max-h-48 overflow-y-auto overscroll-contain rounded-xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)]">
          {filasConTarifa.map((fila) => (
            <div
              key={fila.indice}
              className="flex items-center justify-between border-b border-[var(--user-color-border)] px-4 py-2 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">
                  {fila.datos.marca} {fila.datos.modelo}
                </p>
                <p className="truncate text-[10px] text-[var(--user-color-muted)]">
                  {fila.datos.origenCodigoPostal} → {fila.datos.destinoCodigoPostal}
                  {fila.distanciaKm != null &&
                    ` · ${fila.distanciaKm.toLocaleString("es-MX", { maximumFractionDigits: 1 })} km`}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-[var(--user-color-primary)]">
                {fila.tarifa != null
                  ? `$${fila.tarifa.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stripe embed ─────────────────────────────────────── */}
      <section aria-label="Pago seguro" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mb-3 flex items-center gap-2 text-[10px] text-[var(--user-color-muted)]">
          <span>🔒</span>
          <span>Cifrado Stripe · No guardamos tu tarjeta</span>
          <svg width="22" height="14" viewBox="0 0 22 14" role="img" aria-label="Visa">
            <rect width="22" height="14" rx="2" fill="white" />
            <text x="2" y="10" fill="#1434cb" fontSize="8" fontWeight="bold" fontStyle="italic">
              VISA
            </text>
          </svg>
          <svg width="22" height="14" viewBox="0 0 22 14" role="img" aria-label="Mastercard">
            <circle cx="8" cy="7" r="5" fill="#eb001b" />
            <circle cx="14" cy="7" r="5" fill="#f79e1b" fillOpacity=".9" />
          </svg>
        </div>
        {cargaId ? (
          <PagoStripe
            clientSecretExterno={clientSecret}
            returnPath="/mis-viajes?pago=masivo"
            onEstadoPago={onEstadoPago}
            trasladoId={cargaId}
            monto={totalMXN}
            onPagado={onPagado}
            compacto
            formId={formId}
          />
        ) : (
          <p role="status" className="text-sm text-[var(--user-color-muted)]">
            Preparando el pago masivo…
          </p>
        )}
      </section>
    </div>
  );
}
