"use client";

import { Button as BaseButton, Card, Badge } from "@ruum/ui/base";
import Link from "next/link";
import { folioViaje, type PasaporteRow } from "./panel-utils";

interface PanelActiveTripCardProps {
  viaje: PasaporteRow;
}

export const getPasoActualLabel = (estado: string) => {
  switch (estado) {
    case "conductor_asignado":
      return "Asignado - Pendiente";
    case "conductor_en_camino_al_origen":
      return "En camino al origen";
    case "conductor_en_punto_de_recoleccion":
    case "verificacion_vehiculo_en_proceso":
      return "En punto de recolección";
    case "evidencia_inicial_en_proceso":
    case "evidencia_inicial_completada":
    case "vehiculo_recibido":
      return "Checklist de recolección";
    case "traslado_en_curso":
      return "Trayecto activo";
    case "llegada_a_destino":
      return "Llegada a destino";
    case "evidencia_final_en_proceso":
    case "evidencia_final_completada":
      return "Checklist de entrega";
    case "entrega_confirmada":
    case "servicio_cerrado":
      return "Servicio cerrado";
    default:
      return "Traslado activo";
  }
};

export const getPasoActualDescription = (estado: string) => {
  switch (estado) {
    case "conductor_asignado":
      return "Espera a iniciar el traslado";
    case "conductor_en_camino_al_origen":
      return "Dirígete al punto de recolección";
    case "conductor_en_punto_de_recoleccion":
    case "verificacion_vehiculo_en_proceso":
      return "Confirma tu llegada en el punto de recolección";
    case "evidencia_inicial_en_proceso":
    case "evidencia_inicial_completada":
    case "vehiculo_recibido":
      return "Registra la evidencia física del vehículo";
    case "traslado_en_curso":
      return "Conduce de manera segura hacia el destino";
    case "llegada_a_destino":
      return "Dirígete al punto de entrega y entrega las llaves";
    case "evidencia_final_en_proceso":
    case "evidencia_final_completada":
      return "Registra la evidencia física de la entrega";
    case "entrega_confirmada":
    case "servicio_cerrado":
      return "El traslado ha concluido con éxito";
    default:
      return "Completa las actividades pendientes";
  }
};

export const getContinuarTrasladoHref = (viaje: PasaporteRow) => {
  if (viaje.estado === "evidencia_inicial_en_proceso" || viaje.estado === "evidencia_final_en_proceso") {
    return `/viajes/${viaje.traslado_id}/evidencia`;
  }
  return `/viajes/${viaje.traslado_id}`;
};

export function PanelActiveTripCard({ viaje }: PanelActiveTripCardProps) {
  if (!viaje.estado) return null;

  return (
    <Card asChild><article className="space-y-3 p-4" aria-label="Traslado activo">
      <div className="flex items-center justify-between gap-2">
        <Badge tone="info" dot>Traslado activo</Badge>
        <BaseButton variant="ghost" type="button" onClick={() => {
          if (navigator.clipboard) void navigator.clipboard.writeText(folioViaje(viaje));
        }} className="min-h-11 px-2 font-mono text-sm font-semibold" aria-label={`Copiar folio ${folioViaje(viaje)}`}>
          #{folioViaje(viaje)}
        </BaseButton>
      </div>
      <p className="font-display text-base font-semibold">{getPasoActualLabel(viaje.estado)}</p>
      <p className="font-body text-xs text-ui-fg-muted">{getPasoActualDescription(viaje.estado)}</p>
      <BaseButton asChild className="min-h-14 w-full"><Link href={getContinuarTrasladoHref(viaje)}>
        Continuar traslado <span aria-hidden="true">→</span>
      </Link></BaseButton>
    </article></Card>
  );
}
