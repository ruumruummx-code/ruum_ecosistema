import type { Database } from "@ruum/shared/types";
import type { AnguloEvidencia, FotoEvidencia, TipoEvidencia } from "@ruum/shared/types";

export type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];
export type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];

export type EvidenceRequirement = {
  angulo: AnguloEvidencia;
  titulo: string;
  instruccion: string;
  guia: string;
  obligatorio: boolean;
  permiteNoAplica: boolean;
};

export interface InspeccionEvidencia {
  combustible: string;
  kilometraje: string;
  llavesRecibidas: string;
  hologramaVerificacion: "" | "si" | "no";
  talonVerificacion: string;
  tarjetaCirculacion: string;
  placaDelantera: string;
  placaTrasera: string;
  notas: string;
}


export const ETIQUETA_ANGULO: Record<AnguloEvidencia, string> = {
  frente: "Frente",
  lado_piloto: "Lado piloto",
  lado_copiloto: "Lado copiloto",
  trasera: "Trasera",
  tablero: "Tablero",
  dano_previo: "Daño previo",
  adicional: "Adicional"
};

export function fotoSrc(foto?: FotoEvidencia) {
  if (!foto) return null;
  if (foto.local_path) return foto.local_path;
  if (foto.url_visual) return foto.url_visual;
  if (foto.url?.startsWith("data:") || foto.url?.startsWith("blob:")) return foto.url;
  return null;
}

// PRD §4.4 - tipo de evidencia según en qué punto del flujo está el viaje.
export function tipoEvidenciaPorEstado(estado: EstadoTraslado): TipoEvidencia | null {
  if (estado === "verificacion_vehiculo_en_proceso" || estado === "evidencia_inicial_en_proceso") return "inicial";
  if (estado === "llegada_a_destino" || estado === "evidencia_final_en_proceso") return "final";
  return null;
}
