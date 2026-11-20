"use client";

import { Button as BaseButton } from "@ruum/ui/base";
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
    <div className="bg-ui-muted rounded-xl border border-ui-line/20 p-5 shadow-sm relative flex flex-col gap-4">
      {/* Mismo desglose que /ganancias — Depósito acumulado */}
      <div className="flex flex-col p-4 bg-ui-card rounded-lg border border-ui-line/60 text-left">
        <h3 className="font-display text-lg font-black tracking-tight text-ui-fg">
          Deposito acumulado
        </h3>
        <p className="mt-1 font-display text-3xl font-black tracking-tight text-ui-fg tabular-nums">
          {formatearMoneda(depositoPago)}
        </p>
        <p className="mt-1 font-body text-sm font-semibold text-ui-fg-muted">
          Traslado #{folio}
        </p>
        <BaseButton variant="ghost"
          type="button"
          onClick={() => {
            copiar(String(depositoPago));
            setCopiado("pago");
            setTimeout(() => setCopiado(null), 1200);
          }}
          className="mt-2 self-start text-sm font-bold text-ui-brand hover:underline focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-offset-1 focus-visible:outline-ui-brand rounded px-2 py-1 min-h-8"
        >
          {copiado === "pago" ? "Copiado ✓" : "Copiar depósito"}
        </BaseButton>
      </div>

      <div className="rounded-lg border border-ui-line/40 bg-ui-card overflow-hidden">
        <p className="px-4 pt-3 pb-1 font-body text-sm font-bold uppercase tracking-normal text-ui-fg-muted">
          Desglose:
        </p>
        <div className="grid divide-y divide-ui-line/30">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-fg-muted">
              Precio base
              <span className="group relative inline-flex">
                <BaseButton variant="ghost"
                  type="button"
                  aria-label="Qué es el precio base"
                  className="flex size-4 items-center justify-center rounded-full border border-ui-line bg-ui-card text-sm font-bold text-ui-fg-muted"
                >
                  ?
                </BaseButton>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-ui-line bg-ui-muted p-3 font-body text-sm leading-5 text-ui-fg-muted shadow-lg group-hover:block group-focus-within:block">
                  Tarifa cotizada antes de comisiones. Base de cálculo.
                </span>
              </span>
            </span>
            <span className="font-display text-sm font-bold text-ui-fg tabular-nums">
              {formatearMoneda(precioBasePago)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-fg-muted">
              Bonos
              <span className="group relative inline-flex">
                <BaseButton variant="ghost"
                  type="button"
                  aria-label="Qué son los bonos"
                  className="flex size-4 items-center justify-center rounded-full border border-ui-line bg-ui-card text-sm font-bold text-ui-fg-muted"
                >
                  ?
                </BaseButton>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-ui-line bg-ui-muted p-3 font-body text-sm leading-5 text-ui-fg-muted shadow-lg group-hover:block group-focus-within:block">
                  Incentivos por puntualidad/campañas.
                </span>
              </span>
            </span>
            <span className="font-display text-sm font-bold text-ui-success  tabular-nums">
              + {formatearMoneda(bonosPago)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-fg-muted">
              Ajustes
              <span className="group relative inline-flex">
                <BaseButton variant="ghost"
                  type="button"
                  aria-label="Qué son los ajustes"
                  className="flex size-4 items-center justify-center rounded-full border border-ui-line bg-ui-card text-sm font-bold text-ui-fg-muted"
                >
                  ?
                </BaseButton>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-ui-line bg-ui-muted p-3 font-body text-sm leading-5 text-ui-fg-muted shadow-lg group-hover:block group-focus-within:block">
                  Correcciones operativas. Pueden ser positivas o negativas.
                </span>
              </span>
            </span>
            <span className="font-display text-sm font-bold text-ui-fg tabular-nums">
              + {formatearMoneda(ajustesPago)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-ui-danger/5">
            <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-danger">
              Tasa Ruum-Ruum (-)
              <span className="group relative inline-flex">
                <BaseButton variant="ghost"
                  type="button"
                  aria-label="Qué es la tasa"
                  className="flex size-4 items-center justify-center rounded-full border border-ui-danger/30 bg-ui-card text-sm font-bold text-ui-danger"
                >
                  ?
                </BaseButton>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-ui-line bg-ui-muted p-3 font-body text-sm leading-5 text-ui-fg-muted shadow-lg group-hover:block group-focus-within:block">
                  Comisión de plataforma.
                </span>
              </span>
            </span>
            <span className="font-display text-sm font-bold text-ui-danger tabular-nums">
              − {formatearMoneda(tasaPago)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-ui-fg-muted">
              Reembolso gastos (+)
              <span className="group relative inline-flex">
                <BaseButton variant="ghost"
                  type="button"
                  aria-label="Qué es reembolso"
                  className="flex size-4 items-center justify-center rounded-full border border-ui-line bg-ui-card text-sm font-bold text-ui-fg-muted"
                >
                  ?
                </BaseButton>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 mt-2 rounded-xl border border-ui-line bg-ui-muted p-3 font-body text-sm leading-5 text-ui-fg-muted shadow-lg group-hover:block group-focus-within:block">
                  Gastos autorizados comprobados.
                </span>
              </span>
            </span>
            <span className="font-display text-sm font-bold text-ui-fg tabular-nums">
              + {formatearMoneda(reembolsoPago)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-ui-card p-3 rounded-xl border border-ui-line/15">
        <div className="flex flex-col">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Modalidad de Dispersión
          </span>
          <span className="font-semibold text-sm text-ui-fg mt-0.5">
            Transferencia Bancaria SPEI
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Acreditación
          </span>
          <span className="text-sm font-black text-ui-fg mt-0.5">
            Al Cierre Operativo
          </span>
        </div>
      </div>
    </div>
  );
}
