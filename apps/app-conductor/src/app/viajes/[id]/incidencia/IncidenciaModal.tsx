"use client";

import { ReportarIncidencia } from "../ReportarIncidencia";
import { TripDialog } from "../TripDialog";

interface IncidenciaModalProps {
  trasladoId: string;
  onCerrar: () => void;
}

export function IncidenciaModal({ trasladoId, onCerrar }: IncidenciaModalProps) {
  return (
    <TripDialog title="Incidencia del traslado" onClose={onCerrar}>
      <div className="flex flex-col gap-4 text-left">

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
    </TripDialog>
  );
}
