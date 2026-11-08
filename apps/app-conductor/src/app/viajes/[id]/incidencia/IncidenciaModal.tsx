"use client";

import { ReportarIncidencia } from "../ReportarIncidencia";
import { TripDialog } from "../TripDialog";

interface IncidenciaModalProps {
  trasladoId: string;
  onCerrar: () => void;
}

export function IncidenciaModal({ trasladoId, onCerrar }: IncidenciaModalProps) {
  return (
    <TripDialog title="Reportar un problema" onClose={onCerrar}>
      <div className="flex flex-col gap-4 text-left">
        <ReportarIncidencia trasladoId={trasladoId} />
        <button
          type="button"
          onClick={onCerrar}
          className="w-full min-h-[48px] rounded-xl border border-border bg-transparent text-text-secondary text-sm font-semibold hover:text-text-primary transition-colors cursor-pointer mt-2"
        >
          Volver a Detalles del Traslado
        </button>
      </div>
    </TripDialog>
  );
}
