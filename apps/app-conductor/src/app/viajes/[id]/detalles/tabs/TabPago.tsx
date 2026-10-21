"use client";

import { formatearMoneda } from "./detalles-utils";

interface TabPagoProps {
  depositoPago: number;
  folio: string;
  precioBasePago: number;
  bonosPago: number;
  ajustesPago: number;
  tasaPago: number;
  reembolsoPago: number;
  copiar: (texto: string) => void;
  copiado: string | null;
  setCopiado: (val: string | null) => void;
}

export function TabPago({
  depositoPago,
  folio,
  precioBasePago,
  bonosPago,
  ajustesPago,
  tasaPago,
  reembolsoPago,
  copiar,
  copiado,
  setCopiado,
}: TabPagoProps) {
  return (
    <div className="bg-surface-elevated rounded-3xl border border-border/20 p-5 shadow-sm relative flex flex-col gap-4">
      {/* Mismo desglose que /ganancias — Depósito acumulado */}
      <div className="flex flex-col p-4 bg-surface rounded-2xl border border-border/60 text-left">
        <h3 className="font-display text-lg font-black tracking-tight text-text-primary">
          Deposito acumulado
        </h3>
        <p className="mt-1 font-display text-3xl font-black tracking-tight text-text-primary tabular-nums">
          {formatearMoneda(depositoPago)}
        </p>
        <p className="mt-1 font-body text-xs font-semibold text-text-tertiary">
          Traslado #{folio}
        </p>
        <button
          type="button"
          onClick={() => {
            copiar(String(depositoPago));
            setCopiado("pago");
            setTimeout(() => setCopiado(null), 1200);
          }}
          className="mt-2 self-start text-xs font-bold text-route-action hover:underline focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-offset-1 focus-visible:outline-route-action rounded px-2 py-1 min-h-8"
        >
          {copiado === "pago" ? "Copiado ✓" : "Copiar depósito"}
        </button>
      </div>

      <div className="rounded-2xl border border-border/40 bg-surface overflow-hidden">
        <p className="px-4 pt-3 pb-1 font-body text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
          Desglose:
        </p>
        <div className="grid divide-y divide-border/30">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-secondary">
              Precio base
              <span className="group relative inline-flex">
                <button
                  type="button"
                  aria-label="Qué es el precio base"
                  className="flex size-4 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-bold text-text-tertiary"
                >
                  ?
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-border bg-surface-elevated p-3 font-body text-xs leading-5 text-text-secondary shadow-lg group-hover:block group-focus-within:block">
                  Tarifa cotizada antes de comisiones. Base de cálculo.
                </span>
              </span>
            </span>
            <span className="font-display text-xs font-bold text-text-primary tabular-nums">
              {formatearMoneda(precioBasePago)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-secondary">
              Bonos
              <span className="group relative inline-flex">
                <button
                  type="button"
                  aria-label="Qué son los bonos"
                  className="flex size-4 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-bold text-text-tertiary"
                >
                  ?
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-border bg-surface-elevated p-3 font-body text-xs leading-5 text-text-secondary shadow-lg group-hover:block group-focus-within:block">
                  Incentivos por puntualidad/campañas.
                </span>
              </span>
            </span>
            <span className="font-display text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              + {formatearMoneda(bonosPago)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-secondary">
              Ajustes
              <span className="group relative inline-flex">
                <button
                  type="button"
                  aria-label="Qué son los ajustes"
                  className="flex size-4 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-bold text-text-tertiary"
                >
                  ?
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-border bg-surface-elevated p-3 font-body text-xs leading-5 text-text-secondary shadow-lg group-hover:block group-focus-within:block">
                  Correcciones operativas. Pueden ser positivas o negativas.
                </span>
              </span>
            </span>
            <span className="font-display text-xs font-bold text-text-primary tabular-nums">
              + {formatearMoneda(ajustesPago)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-danger/5">
            <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-red-500">
              Tasa Ruum-Ruum (-)
              <span className="group relative inline-flex">
                <button
                  type="button"
                  aria-label="Qué es la tasa"
                  className="flex size-4 items-center justify-center rounded-full border border-danger/30 bg-surface text-[10px] font-bold text-red-500"
                >
                  ?
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-border bg-surface-elevated p-3 font-body text-xs leading-5 text-text-secondary shadow-lg group-hover:block group-focus-within:block">
                  Comisión de plataforma.
                </span>
              </span>
            </span>
            <span className="font-display text-xs font-bold text-red-500 tabular-nums">
              − {formatearMoneda(tasaPago)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-secondary">
              Reembolso gastos (+)
              <span className="group relative inline-flex">
                <button
                  type="button"
                  aria-label="Qué es reembolso"
                  className="flex size-4 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-bold text-text-tertiary"
                >
                  ?
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-border bg-surface-elevated p-3 font-body text-xs leading-5 text-text-secondary shadow-lg group-hover:block group-focus-within:block">
                  Gastos autorizados comprobados.
                </span>
              </span>
            </span>
            <span className="font-display text-xs font-bold text-text-primary tabular-nums">
              + {formatearMoneda(reembolsoPago)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border/15">
        <div className="flex flex-col">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Modalidad de Dispersión
          </span>
          <span className="font-semibold text-xs text-text-primary mt-0.5">
            Transferencia Bancaria SPEI
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Acreditación
          </span>
          <span className="text-xs font-black text-text-primary mt-0.5">
            Al Cierre Operativo
          </span>
        </div>
      </div>
    </div>
  );
}
