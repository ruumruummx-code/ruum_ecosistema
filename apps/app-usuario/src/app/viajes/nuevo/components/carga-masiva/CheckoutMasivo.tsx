"use client";
import { useFormatoDistancia } from "@/lib/use-formato-distancia";
import React from "react";
import type { FilaMasiva } from "../../hooks/useCargaMasiva";
import { PagoStripe } from "@/app/PagoStripe";

interface Props {
  filas: FilaMasiva[];
  totalMXN: number;
  /** ID del traslado masivo para el checkout */
  cargaId?: string;
  clientSecret?: string;
  parcial?: boolean;
  onEstadoPago: (estado: { listo: boolean; procesando: boolean }) => void;
  onPagado: () => void;
}

export function CheckoutMasivo({ filas, totalMXN, cargaId, clientSecret, parcial, onPagado, onEstadoPago }: Props) {
  const formatearDistancia = useFormatoDistancia();
  const formId = `pago-masivo-${cargaId ?? "pendiente"}`;
  const filasConTarifa = filas.filter((f) => !f.eliminada && f.tarifa != null);
  const pendientes = filas.filter((f) => !f.eliminada && (f.estado === "error" || f.errorCotizacion)).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* ── Banner de pago parcial ───────────────────────────── */}
      {(parcial || pendientes > 0) && (
        <aside
          role="status"
          aria-label="Aviso de pago parcial"
          className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/90 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200"
        >
          <span className="text-base leading-none">ℹ️</span>
          <div>
            <p className="font-bold">Pago parcial de traslados válidos</p>
            <p className="mt-0.5 text-[11px] text-blue-700 dark:text-blue-300">
              Estás procesando el pago de {filasConTarifa.length} traslado{filasConTarifa.length !== 1 ? "s" : ""} listos. {pendientes > 0 ? `Los ${pendientes} traslados con incidencias quedan guardados como borrador para que puedas corregirlos y reintentar su cobro sin recapturar todo el archivo.` : ""}
            </p>
          </div>
        </aside>
      )}

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
                    ` · ${formatearDistancia(fila.distanciaKm)}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                  ✓ Cotizado
                </span>
                <p className="text-sm font-bold text-[var(--user-color-primary)]">
                  {fila.tarifa != null
                    ? `$${fila.tarifa.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </p>
              </div>
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
