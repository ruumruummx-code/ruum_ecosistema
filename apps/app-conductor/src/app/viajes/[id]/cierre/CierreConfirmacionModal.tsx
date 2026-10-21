"use client";

interface CierreConfirmacionModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  procesando: boolean;
}

export function CierreConfirmacionModal({
  abierto,
  onCerrar,
  onConfirmar,
  procesando,
}: CierreConfirmacionModalProps) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-surface-elevated border border-border/40 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl animate-slideUp">
        <h3 className="font-display text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
          ⚠️ Confirmar Entrega
        </h3>
        <p className="font-body text-xs text-text-secondary leading-relaxed">
          ¿Estás seguro de finalizar el traslado y entregar el vehículo? Esta acción es definitiva y no se puede deshacer.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 min-h-11 rounded-xl bg-transparent border border-border/80 text-text-secondary hover:text-text-primary font-display text-xs font-black tracking-wider transition-colors cursor-pointer select-none"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={procesando}
            className="flex-[2] min-h-11 rounded-xl bg-signal hover:bg-signal/90 text-slate-950 font-display text-xs font-black tracking-wider transition-colors cursor-pointer shadow-md select-none flex items-center justify-center focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            {procesando ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "SÍ, ENTREGAR"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
