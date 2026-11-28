import type { Database } from "@ruum/shared/types";

export type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type DocumentoConductorRow = Database["public"]["Tables"]["documentos_conductor"]["Row"];
export type PanelReviewState = {
  conductorId?: string;
  solicitudId?: string;
  nombre: string;
  documentos: DocumentoConductorRow[];
  estado: Database["public"]["Enums"]["estado_expediente_conductor"];
  enviadoEn?: string | null;
};

export function nombreVehiculo(viaje: PasaporteRow) {
  return [viaje.vehiculo_marca, viaje.vehiculo_modelo, viaje.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo";
}

export function folioViaje(viaje: PasaporteRow) {
  return viaje.traslado_id ? viaje.traslado_id.slice(0, 8).toUpperCase() : "Sin folio";
}

