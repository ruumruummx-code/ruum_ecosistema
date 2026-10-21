"use client";

interface EvidenciaLlavesSectionProps {
  llavesCount: number;
  setLlavesCount: (v: number) => void;
}

export function EvidenciaLlavesSection({ llavesCount, setLlavesCount }: EvidenciaLlavesSectionProps) {
  return (
    <section id="evid-llaves" className="mt-8 flex flex-col gap-3 scroll-mt-20">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-surface-elevated text-text-secondary flex items-center justify-center font-display text-[10px] font-bold">
          3
        </span>
        <h2 className="font-display text-xs font-black text-text-tertiary tracking-widest uppercase">
          LLAVES ENTREGADAS
        </h2>
      </div>

      <div className="bg-surface-elevated/40 border border-border/30 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-text-tertiary">
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="M21 2l-9.6 9.6" />
            <path d="M15.5 9.5l3 3L22 9l-3-3z" />
          </svg>
          <span>Número de llaves recibidas</span>
        </div>

        {/* Stepper counter */}
        <div className="flex items-center gap-2 bg-surface border border-border/30 rounded-lg p-1 shrink-0">
          <button
            type="button"
            onClick={() => setLlavesCount(Math.max(0, llavesCount - 1))}
            className="w-8 h-8 rounded-md bg-transparent hover:bg-border/20 border-none text-text-primary text-lg font-black cursor-pointer select-none flex items-center justify-center"
          >
            -
          </button>
          <span className="font-display text-base font-extrabold text-text-primary w-5 text-center">{llavesCount}</span>
          <button
            type="button"
            onClick={() => setLlavesCount(llavesCount + 1)}
            className="w-8 h-8 rounded-md bg-transparent hover:bg-border/20 border-none text-text-primary text-lg font-black cursor-pointer select-none flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>
    </section>
  );
}
