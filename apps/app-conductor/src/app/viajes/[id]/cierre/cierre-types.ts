import type { Database } from "@ruum/shared/types";

export type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];

export interface InspeccionData {
  tipo: "inicial" | "final";
  combustible: string | null;
  kilometraje: number | null;
  llaves_recibidas: string | null;
  tarjeta_circulacion: string | null;
  talon_verificacion: string | null;
  holograma_verificacion: boolean | null;
  placa_delantera: string | null;
  placa_trasera: string | null;
  notas: string | null;
}
