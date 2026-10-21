"use client";

import { TEXTOS_CARGANDO } from "@ruum/shared/constants";

import type { AnguloEvidencia } from "@ruum/shared/types";

interface EvidenciaFooterProps {
  totalCapturados: number;
  totalRequisitos: number;
  enviando: AnguloEvidencia | "guardar" | "confirmar" | null;
  onGuardarBorrador: () => Promise<void>;
  onFinalizar: () => Promise<void>;
  soporteAbierto: boolean;
  setSoporteAbierto: (v: boolean) => void;
}

export function EvidenciaFooter({
  totalCapturados,
  totalRequisitos,
  enviando,
  onGuardarBorrador,
  onFinalizar,
  soporteAbierto,
  setSoporteAbierto
}: EvidenciaFooterProps) {
  return (
    <>
      {/* Sticky Primary Action Buttons Bar */}
      <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border/20 py-3 px-4 shadow-2xl select-none">
        <div className="max-w-md mx-auto flex gap-3">
          {/* GUARDAR BORRADOR */}
          <button
            type="button"
            onClick={onGuardarBorrador}
            disabled={Boolean(enviando)}
            className="flex-1 min-h-11 rounded-xl bg-transparent border-2 border-border/60 hover:border-white text-text-primary font-display text-xs font-bold tracking-wide transition-all cursor-pointer shadow-xs select-none flex items-center justify-center focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action disabled:opacity-50"
          >
            {enviando === "guardar" ? "Guardando…" : "Guardar borrador"}
          </button>

          {/* FINALIZAR EVIDENCIAS */}
          <button
            type="button"
            onClick={onFinalizar}
            disabled={Boolean(enviando) || totalCapturados < totalRequisitos}
            title={totalCapturados < totalRequisitos ? `Faltan ${totalRequisitos - totalCapturados} requisitos` : undefined}
            className={`flex-1 min-h-11 rounded-xl font-display text-xs font-bold tracking-wide transition-all cursor-pointer shadow-md select-none flex items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed ${
              totalCapturados === totalRequisitos
                ? "bg-signal hover:bg-signal/90 text-slate-950"
                : "bg-signal/60 text-slate-950/60 cursor-not-allowed"
            }`}
          >
            {enviando === "confirmar" ? TEXTOS_CARGANDO.actualizando : `Finalizar evidencias ${totalCapturados === totalRequisitos ? "✓" : `(${totalCapturados}/${totalRequisitos})`}`}
          </button>
        </div>
        {totalCapturados < totalRequisitos && (
          <p className="max-w-md mx-auto mt-2 text-center font-body text-[11px] font-semibold text-text-tertiary">
            Completa {totalRequisitos - totalCapturados} requisitos para habilitar el envío
          </p>
        )}
      </div>
    </>
  );
}
