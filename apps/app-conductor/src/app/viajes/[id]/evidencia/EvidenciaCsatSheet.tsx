"use client";

interface EvidenciaCsatSheetProps {
  showCsatSheet: boolean;
  setShowCsatSheet: (v: boolean) => void;
  csatValor: number | null;
  setCsatValor: (v: number | null) => void;
  cesValor: number | null;
  setCesValor: (v: number | null) => void;
  enviandoFeedback: boolean;
  setEnviandoFeedback: (v: boolean) => void;
  onEnviarFeedback: () => Promise<void>;
  onOmitirFeedback: () => void;
}

export function EvidenciaCsatSheet({
  showCsatSheet,
  setShowCsatSheet,
  csatValor,
  setCsatValor,
  cesValor,
  setCesValor,
  enviandoFeedback,
  setEnviandoFeedback,
  onEnviarFeedback,
  onOmitirFeedback
}: EvidenciaCsatSheetProps) {
  if (!showCsatSheet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Cuéntanos cómo te fue">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onOmitirFeedback} aria-label="Omitir feedback" />
      <div className="relative w-full max-w-md bg-surface-elevated rounded-t-[2rem] border-t border-border/40 p-6 flex flex-col gap-5 animate-slideUp shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border/40" aria-hidden />
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-black text-text-primary">¡Evidencia enviada! Cuéntanos</h2>
          <p className="font-body text-xs text-text-secondary">
            2 preguntas rápidas (10s) nos ayudan a mejorar tu pago y tu tiempo. 1 de cada 3 traslados.
          </p>
        </div>

        {/* CSAT 1-5 */}
        <div className="flex flex-col gap-2">
          <span className="font-display text-xs font-black tracking-wide text-text-primary">
            ¿Qué tan fácil fue este traslado? <span className="font-normal text-text-tertiary">(CSAT)</span>
          </span>
          <div className="flex gap-1.5" role="group" aria-label="Calificación del traslado 1 a 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCsatValor(n)}
                aria-pressed={csatValor === n}
                className={`flex-1 min-h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action ${csatValor === n ? "bg-signal border-signal text-slate-950 shadow-md" : "bg-surface border-border/40 text-text-secondary hover:border-signal/30"}`}
              >
                <span className="text-base leading-none">{n === 1 ? "😞" : n === 2 ? "😐" : n === 3 ? "🙂" : n === 4 ? "😊" : "🤩"}</span>
                <span className="font-display text-[11px] font-black">{n}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between font-body text-[10px] text-text-tertiary px-1">
            <span>Muy difícil</span>
            <span>Muy fácil</span>
          </div>
        </div>

        {/* CES 1-7 */}
        <div className="flex flex-col gap-2">
          <span className="font-display text-xs font-black tracking-wide text-text-primary">
            ¿Cuánto esfuerzo te tomó la evidencia? <span className="font-normal text-text-tertiary">(CES)</span>
          </span>
          <div className="grid grid-cols-7 gap-1" role="group" aria-label="Esfuerzo de evidencia 1 a 7">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCesValor(n)}
                aria-pressed={cesValor === n}
                className={`min-h-11 rounded-xl border flex items-center justify-center font-display text-xs font-black transition-all focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-offset-1 focus-visible:outline-route-action ${cesValor === n ? "bg-route-action border-route-action text-white shadow-md" : "bg-surface border-border/30 text-text-secondary hover:border-route-action/30"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between font-body text-[10px] text-text-tertiary px-1">
            <span>Muy poco</span>
            <span>Mucho</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onOmitirFeedback} className="flex-1 min-h-11 rounded-xl border border-border bg-surface font-display text-sm font-bold text-text-secondary hover:bg-surface-elevated">
            Omitir
          </button>
          <button
            type="button"
            onClick={onEnviarFeedback}
            disabled={csatValor == null || cesValor == null || enviandoFeedback}
            className="flex-1 min-h-11 rounded-xl bg-signal text-slate-950 font-display text-sm font-bold shadow-md hover:bg-signal/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enviandoFeedback ? "Enviando…" : "Enviar · Gracias"}
          </button>
        </div>
        <p className="font-body text-[10px] text-center text-text-tertiary">
          Se registra anónimo para NPS/CSAT. ¡Gracias por conducir con RUUM!
        </p>
      </div>
    </div>
  );
}
