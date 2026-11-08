"use client";
import type { PasaporteRow } from "../trips-utils";
import { getTripPresentation } from "@/lib/trip-presentation";
import { TripStage } from "./TripStage";

export function TripStatusSummary({ pasaporte, volver, closing = false }: { pasaporte: PasaporteRow; volver: string; closing?: boolean }) {
  const presentation = getTripPresentation(pasaporte.estado!);
  const stateLabels = new Map(Object.entries({ servicio_cerrado: "Servicio cerrado", pago_pendiente: "Pago pendiente", pago_completado: "Pago completado", servicio_cancelado: "Servicio cancelado", traslado_fallido: "Traslado fallido", incidencia_reportada: "Incidencia reportada", disputa_abierta: "Disputa abierta", disputa_resuelta: "Disputa resuelta", reclamo_abierto: "Reclamo abierto", reclamo_resuelto: "Reclamo resuelto", dano_no_reportado_en_revision: "Daño en revisión", cierre_operativo_con_incidencia_abierta: "Incidencia en revisión" }));
  const stopped = pasaporte.estado === "servicio_cancelado" || pasaporte.estado === "traslado_fallido";
  const finished = ["servicio_cerrado", "pago_pendiente", "pago_completado"].includes(pasaporte.estado || "");
  const instruction = finished ? "La operación terminó. Consulta el expediente y los pagos." : stopped ? "Este traslado no continúa. Consulta el motivo o pide ayuda." : "Consulta el expediente y las indicaciones de soporte.";
  const delivered = pasaporte.estado === "entrega_confirmada";
  return <TripStage minimal pasaporte={pasaporte} backHref={volver} destination readOnly={!closing}
    stateLabel={closing ? delivered ? "Entrega confirmada" : "Registro final completo" : stateLabels.get(pasaporte.estado!) || "Estado por confirmar"}
    title={closing ? delivered ? "Finaliza el servicio" : "Confirma la entrega" : presentation.title}
    instruction={closing ? "Revisa el registro, la recepción y los requisitos de cierre." : instruction}
    extraTools={!closing && <p>{presentation.instruction}</p>}
    primaryLabel={closing ? delivered ? "Finalizar servicio" : "Revisar y finalizar" : "Volver a Traslados"}
    primaryHref={closing ? `/viajes/${pasaporte.traslado_id}?cierre=1&volver=${encodeURIComponent(volver)}` : volver} />;
}
