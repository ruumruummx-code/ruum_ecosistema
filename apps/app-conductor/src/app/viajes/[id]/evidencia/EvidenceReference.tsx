"use client";

import type { InspeccionEvidencia } from "./evidence-requirements";

export interface EvidenceReferenceProps {
  evidenciaInicial: InspeccionEvidencia | null;
  estaCargando: boolean;
}

/**
 * Componente que muestra los valores de evidencia inicial como referencia
 * al capturar la evidencia final
 */
export function EvidenceReference({ evidenciaInicial, estaCargando }: EvidenceReferenceProps) {
  if (estaCargando) {
    return (
      <div className="rounded-xl border border-ui-line bg-ui-muted p-4" aria-busy="true">
        <p className="font-body text-sm text-ui-fg-muted">Cargando referencia inicial...</p>
      </div>
    );
  }

  if (!evidenciaInicial) {
    return null;
  }

  const { kilometraje, llavesRecibidas, combustible } = evidenciaInicial;

  return (
    <div className="rounded-xl border border-ui-line bg-ui-muted p-4">
      <h3 className="font-body text-sm font-semibold text-ui-fg">Valores iniciales (referencia)</h3>
      <p className="mt-1 font-body text-xs text-ui-fg-muted">
        Compara estos valores al capturar la evidencia final
      </p>

      <div className="mt-3 grid gap-2 border-t border-ui-line pt-3 sm:grid-cols-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-body text-sm text-ui-fg-muted">Kilometraje:</span>
          <span className="font-body text-sm font-semibold text-ui-fg">
            {kilometraje || "-"} km
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="font-body text-sm text-ui-fg-muted">Llaves:</span>
          <span className="font-body text-sm font-semibold text-ui-fg">
            {llavesRecibidas || "-"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="font-body text-sm text-ui-fg-muted">Combustible:</span>
          <span className="font-body text-sm font-semibold text-ui-fg">
            {combustible || "-"}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-ui-fg-muted">
        * Verifica que estos valores coincidan con el estado actual del vehículo
      </p>
    </div>
  );
}
