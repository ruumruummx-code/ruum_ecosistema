"use client";
import type { OportunidadAsignacion } from "@ruum/api/services";
import type { PasaporteRow } from "../trips-utils";
import { TripStage } from "./TripStage";

export function OpportunityDetailsView({ oportunidad, pasaporte, volver, procesando, error, avisoExito, ofertaTomada, solicitudEnviada, onAccept, onReject }: {
  oportunidad: OportunidadAsignacion | null; pasaporte: PasaporteRow; volver: string;
  procesando: boolean; error: string | null; avisoExito: string | null;
  ofertaTomada: boolean; solicitudEnviada: boolean; onAccept: () => void; onReject: () => void;
}) {
  const directed = oportunidad?.modo === "dirigida";
  const disabled = procesando || ofertaTomada || solicitudEnviada || !oportunidad || !oportunidad.elegible;
  const reason = oportunidad && !oportunidad.elegible
    ? `No disponible: ${(oportunidad.motivos ?? []).map(m => m.replaceAll("_", " ")).join(", ")}. Consulta a soporte.` : null;
  return <TripStage pasaporte={pasaporte} backHref={volver} offer
    title="Revisa la oferta" stateLabel={ofertaTomada ? "Oferta asignada" : solicitudEnviada ? "Solicitud registrada" : directed ? "Oferta dirigida" : "Oferta disponible"}
    instruction={ofertaTomada ? "Este traslado ya fue asignado a otro conductor." : reason || (directed ? "Revisa la ruta antes de aceptar." : "Solicita el traslado y espera la asignación.")}
    primaryLabel={solicitudEnviada ? "Solicitud registrada" : ofertaTomada ? "Oferta no disponible" : !oportunidad ? "Consultando disponibilidad…" : directed ? "Aceptar oferta dirigida" : "Solicitar traslado"}
    onPrimary={onAccept} busy={procesando} disabled={disabled} error={error} notice={avisoExito}
    extraTools={<>
      <p>{directed ? "La aceptación confirma la asignación dirigida." : "La solicitud participa en la competencia; el servidor resuelve la asignación."}</p>
      {oportunidad?.expira_en && <p>Vigente hasta {new Date(oportunidad.expira_en).toLocaleString("es-MX")}</p>}
      <p>El chat se habilita cuando el traslado se asigna a tu cuenta.</p>
      <button type="button" onClick={onReject} disabled={disabled}>Rechazar oferta</button>
    </>} />;
}
