"use client";

import { formatearRango } from "@/app/ganancias/useEarningsLedger";

interface EvidenciaProgressProps {
  porcentaje: number;
  totalCapturados: number;
  totalRequisitos: number;
  fotosObligCapturadas: number;
  fotosObligatorias: number;
  faltantesFotos: string[];
  onIrAFotos: () => void;
}

export function EvidenciaProgress({
  porcentaje,
  totalCapturados,
  totalRequisitos,
  fotosObligCapturadas,
  fotosObligatorias,
  faltantesFotos,
  onIrAFotos
}: EvidenciaProgressProps) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - porcentaje / 100);

  return (
    <div className="mt-5 bg-surface-elevated border border-border/20 rounded-2xl p-4.5 flex flex-col gap-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-display text-[9px] font-black text-text-tertiary tracking-widest uppercase">
            PROGRESO GENERAL DE REVISIÓN
          </span>
          <span className="font-body text-xs text-text-secondary font-bold mt-0.5">
            {totalCapturados} de {totalRequisitos} verificaciones · {fotosObligCapturadas}/{fotosObligatorias} fotos
          </span>
          {faltantesFotos.length > 0 && faltantesFotos.length <= 3 && (
            <span className="font-body text-[11px] font-bold text-amber-800 dark:text-amber-300 mt-1">
              Falta: {faltantesFotos.join(", ")} →{" "}
              <a href="#evid-fotos" onClick={(e) => { e.preventDefault(); onIrAFotos(); }} className="underline hover:text-amber-700">
                ir
              </a>
            </span>
          )}
        </div>
        <div className="relative size-14 shrink-0">
          <svg width={56} height={56} viewBox="0 0 56 56" className="-rotate-90" aria-hidden>
            <circle cx={28} cy={28} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-border/30" />
            <circle
              cx={28}
              cy={28}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              className="text-route-action conductor-progress-ring"
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[13px] font-black leading-none text-route-action">{porcentaje}%</span>
            <span className="font-display text-[7px] font-extrabold uppercase tracking-wider text-text-tertiary">completo</span>
          </span>
        </div>
      </div>

      <div className="w-full bg-surface rounded-full h-3.5 overflow-hidden border border-border/15 relative p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 conductor-progress-fill ${
            porcentaje === 100 ? "bg-signal shadow-[0_0_12px_rgba(255,196,0,0.4)]" : "bg-route-action shadow-[0_0_10px_rgba(30,136,229,0.3)]"
          }`}
          data-progress={porcentaje}
        />
      </div>

      {porcentaje === 100 ? (
        <span className="font-body text-xs text-route-action font-extrabold flex items-center gap-1.5 animate-pulse">
          ✓ ¡Checklist completado al 100%! Puedes finalizar evidencias.
        </span>
      ) : (
        <span className="font-body text-[11px] text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
          ⚠️ Faltan {totalRequisitos - totalCapturados} elementos por verificar para poder finalizar.
        </span>
      )}
    </div>
  );
}
