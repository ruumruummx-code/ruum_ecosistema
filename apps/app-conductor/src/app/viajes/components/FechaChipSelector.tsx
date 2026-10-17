"use client";

import { claveDia, type DiaCalendario, formatearDiaSelector } from "../trips-utils";

/**
 * Chip de fecha colapsado (📅 Sáb 17 Oct ▼) que reemplaza el carrusel de 7 días.
 * Al hacer tap abre el Bottom Sheet de calendario para seleccionar otra fecha.
 */
interface FechaChipSelectorProps {
  calendario: DiaCalendario[];
  diaSeleccionado: string;
  diaHoy: string;
  onSelectDia: (clave: string) => void;
  onAbrirCalendario: () => void;
}

export function FechaChipSelector({
  calendario,
  diaSeleccionado,
  diaHoy,
  onSelectDia,
  onAbrirCalendario
}: FechaChipSelectorProps) {
  const diaCalendarioSeleccionado = calendario.find(({ dia }) => claveDia(dia) === diaSeleccionado) ?? calendario[0];
  const esHoy = claveDia(diaCalendarioSeleccionado?.dia ?? new Date()) === diaHoy;

  const etiqueta = diaCalendarioSeleccionado
    ? formatearDiaSelector(diaCalendarioSeleccionado.dia)
    : "Hoy";

  return (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-border/20 bg-surface-elevated px-3 py-2.5 select-none">
      <button
        type="button"
        onClick={onAbrirCalendario}
        aria-label={`Seleccionar fecha: ${etiqueta}${esHoy ? " (hoy)" : ""}`}
        className="flex items-center gap-2 text-text-primary"
      >
        <span className="text-xs" aria-hidden>📅</span>
        <span className="font-display text-sm font-bold text-text-primary leading-none">{etiqueta}</span>
        {esHoy && (
          <span className="bg-route-soft text-route-action border border-route-action/30 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
            Hoy
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0" aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
