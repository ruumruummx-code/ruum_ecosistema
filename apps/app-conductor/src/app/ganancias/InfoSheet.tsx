"use client";

export interface InfoSheetProps {
  titulo: string;
  texto: string;
  onCerrar: () => void;
}

export function InfoSheet({ titulo, texto, onCerrar }: InfoSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCerrar} aria-label="Cerrar explicación" />
      <div className="relative w-full max-w-md bg-surface-elevated rounded-t-[2rem] border-t border-border/40 p-6 flex flex-col gap-4 animate-slideUp shadow-2xl">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border/40" aria-hidden />
        <div className="flex justify-between items-start gap-3">
          <h2 className="font-display text-lg font-black text-text-primary">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="min-h-11 min-w-11 flex items-center justify-center rounded-full border border-border bg-surface text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <p className="font-body text-sm leading-6 text-text-secondary">{texto}</p>
        <div className="rounded-xl border border-border/30 bg-surface p-3">
          <p className="font-body text-xs font-semibold text-text-tertiary">Fórmula: <span className="text-text-primary font-bold">Depósito = Precio base + Bonos + Ajustes − Tasa + Reembolso</span></p>
        </div>
        <button type="button" onClick={onCerrar} className="w-full min-h-11 rounded-xl bg-signal font-display text-sm font-black text-on-primary hover:bg-signal/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-signal">Entendido</button>
      </div>
    </div>
  );
}
