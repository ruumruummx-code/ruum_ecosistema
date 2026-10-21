"use client";

import { PeriodoActivo } from "./useEarningsLedger";

interface EarningsTabsProps {
  periodoActivo: PeriodoActivo;
  onCambiarPeriodo: (nuevo: PeriodoActivo) => void;
}

const TABS: { id: PeriodoActivo; label: string }[] = [
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" }
];

export function EarningsTabs({ periodoActivo, onCambiarPeriodo }: EarningsTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Periodo de ganancias"
      className="flex w-full rounded-2xl border border-border/20 bg-surface-elevated p-1"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={periodoActivo === tab.id}
          onClick={() => onCambiarPeriodo(tab.id)}
          className={[
            "flex-1 rounded-xl px-3 py-2.5 font-display text-xs sm:text-sm font-bold transition min-h-11 flex items-center justify-center",
            periodoActivo === tab.id
              ? "bg-signal text-slate-950 shadow-md"
              : "text-text-secondary hover:text-text-primary"
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
