import { ETAPAS_TRASLADO, indiceEtapaActual } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";

export function EtapasTrasladoUsuario({ estado }: { estado: Database["public"]["Enums"]["estado_traslado"] | null }) {
  // Usuario collects payment before operation; a payment is not a completed trip.
  const indice = estado === "pago_pendiente" || estado === "pago_completado" ? 1 : estado ? indiceEtapaActual(estado) : -1;
  if (indice < 0) return <p className="text-sm text-[var(--user-color-muted)]">Seguimiento del estado disponible en el pasaporte</p>;
  return <div className="space-y-2">
    <p className="text-sm font-medium text-[var(--user-color-primary)]">Etapa {indice + 1} de {ETAPAS_TRASLADO.length}: {ETAPAS_TRASLADO[indice].etiqueta}</p>
    <div className="flex gap-1" aria-hidden="true">
      {ETAPAS_TRASLADO.map((etapa, i) => <span key={etapa.id} className={`h-1.5 flex-1 rounded-full ${i <= indice ? "bg-[var(--user-color-brand-dark)]" : "bg-[var(--user-color-border)]"}`} />)}
    </div>
  </div>;
}
