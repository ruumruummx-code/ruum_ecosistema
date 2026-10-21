import type { Database } from "@ruum/shared/types";

export type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

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

export interface GastoData {
  id: string;
  tipo: "combustible" | "caseta" | "maniobra" | "estadia" | "penalizacion" | "otro";
  monto: number;
  descripcion: string | null;
  comprobante_ruta?: string | null;
  registrado_en: string;
}

export function labelGasto(tipo: GastoData["tipo"]): string {
  switch (tipo) {
    case "combustible":
      return "Gasolina";
    case "caseta":
      return "Caseta";
    case "maniobra":
      return "Maniobra";
    case "estadia":
      return "Estadía";
    case "penalizacion":
      return "Penalización";
    default:
      return "Otro";
  }
}
