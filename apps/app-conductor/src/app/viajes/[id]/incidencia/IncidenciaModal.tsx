"use client";

import { ReportarIncidencia } from "../ReportarIncidencia";

interface IncidenciaModalProps {
  trasladoId: string;
  onCerrar: () => void;
}

export function IncidenciaModal({ trasladoId, onCerrar }: IncidenciaModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg mx-auto bg-surface-elevated border-t border-border/20 rounded-t-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4 text-left select-none animate-slideUp">
        {/* Header del Modal Incidencia */}
        <div className="flex items-center justify-between border-b border-border/15 pb-3">
          <div className="flex items-center gap-2 text-warning">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-display text-base font-black text-text-primary uppercase tracking-wider">
              Reportar Incidencia
            </h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1.5 text-text-tertiary hover:text-text-primary rounded-full hover:bg-surface cursor-pointer"
            aria-label="Cerrar incidencia"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Componente de reporte de Incidencia */}
        <ReportarIncidencia trasladoId={trasladoId} />

        <button
          type="button"
          onClick={onCerrar}
          className="w-full py-2.5 rounded-xl bg-surface hover:bg-surface-elevated text-text-secondary font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer mt-2 border border-border/20"
        >
          Volver a Detalles del Traslado
        </button>
      </div>
    </div>
  );
}
