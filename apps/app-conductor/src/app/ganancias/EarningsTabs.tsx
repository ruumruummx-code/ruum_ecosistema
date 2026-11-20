"use client";

import { Button as BaseButton } from "@ruum/ui/base";
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
      role="group"
      aria-label="Periodo de ganancias"
      className="flex w-full rounded-lg border border-ui-line/20 bg-ui-muted p-1"
    >
      {TABS.map((tab) => (
        <BaseButton variant="ghost"
          key={tab.id}
          type="button"

          aria-pressed={periodoActivo === tab.id}
          onClick={() => onCambiarPeriodo(tab.id)}
          className={[
            "flex-1 rounded-xl px-3 py-2.5 font-display text-xs sm:text-sm font-bold transition min-h-11 flex items-center justify-center",
            periodoActivo === tab.id
              ? "bg-ui-brand text-ui-fg-muted shadow-md"
              : "text-ui-fg-muted hover:text-ui-fg"
          ].join(" ")}
        >
          {tab.label}
        </BaseButton>
      ))}
    </div>
  );
}
