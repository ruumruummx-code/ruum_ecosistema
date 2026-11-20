"use client";

import { Button as BaseButton } from "@ruum/ui/base";
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
        <BaseButton variant="ghost"
          type="button"
          onClick={onCerrar}
          className="w-full min-h-[48px] rounded-xl border border-ui-line bg-transparent text-ui-fg-muted text-sm font-semibold hover:text-ui-fg transition-colors cursor-pointer mt-2"
        >
          Volver a Detalles del Traslado
        </BaseButton>
      </div>
    </TripDialog>
  );
}
