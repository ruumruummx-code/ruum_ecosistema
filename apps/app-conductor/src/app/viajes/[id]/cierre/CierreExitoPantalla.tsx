"use client";

import Link from "next/link";
import { ConductorStatusBadge } from "@/components/v2/ConductorUI";
import type { PasaporteRow, GastoData } from "./cierre-types";

interface CierreExitoPantallaProps {
  trasladoId: string;
  pasaporte: PasaporteRow;
  gastos: GastoData[];
}

export function CierreExitoPantalla({
  trasladoId,
  pasaporte,
  gastos,
}: CierreExitoPantallaProps) {
  const gananciaTotal = pasaporte.ganancia_conductor || 0;
  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  return (
    <div className="mx-auto w-full max-w-md bg-surface min-h-[calc(100vh-100px)] flex flex-col items-center justify-center text-text-primary pb-6 px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-signal/15 border-2 border-signal/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,196,0,0.15)]">
        <svg
          className="w-12 h-12 text-emerald-600 dark:text-emerald-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <ConductorStatusBadge status="success" label="Traslado completado" className="mb-2" />
      <h1 className="font-display text-3xl font-black text-center mb-2 leading-tight text-text-primary">
        ¡Excelente trabajo!
      </h1>
      <p className="font-body text-text-secondary text-center mb-8 px-4 text-sm">
        Has completado el traslado #{trasladoId.slice(0, 8).toUpperCase()} con trazabilidad certificada.
      </p>

      <div className="border-t border-b border-border/20 py-6 w-full text-center relative">
        <span className="text-xs text-text-secondary font-medium tracking-wide block mb-1">
          Depósito programado
        </span>
        <div className="text-center">
          <span className="font-mono text-4xl font-bold text-text-primary tabular-nums">
            ${gananciaTotal.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-text-secondary ml-1.5 font-bold uppercase">MXN</span>
        </div>

        {totalGastos > 0 && (
          <div className="mt-4 pt-3 border-t border-border/15 flex justify-between items-center text-sm">
            <span className="text-text-secondary text-xs">Gastos registrados reembolsables</span>
            <span className="font-bold font-mono text-xs text-route-action">
              + ${totalGastos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 w-full">
        <Link
          href="/viajes"
          className="conductor-button conductor-button-primary w-full flex items-center justify-center text-center font-bold"
        >
          Volver a Traslados
        </Link>
      </div>
    </div>
  );
}
