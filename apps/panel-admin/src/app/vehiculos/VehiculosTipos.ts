import type { Database } from "@ruum/shared/types";

export type Vehiculo = Database["public"]["Tables"]["vehiculos"]["Row"];
export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
export type CategoriaTarifa = Database["public"]["Enums"]["categoria_tarifa_vehiculo"];
export type GamaVehiculo = Database["public"]["Enums"]["gama_vehiculo"];
export type CondicionVehiculo = Database["public"]["Enums"]["condicion_vehiculo"];

export const ETIQUETA_CATEGORIA: Record<CategoriaTarifa, string> = {
  ligero_a: "Ligero A",
  ligero_b: "Ligero B",
  mediano: "Mediano",
  camion: "Camión"
};

export const ETIQUETA_GAMA: Record<GamaVehiculo, string> = {
  entrada: "Entrada",
  media: "Media",
  alta: "Alta",
  premium: "Premium"
};

export const ETIQUETA_CONDICION: Record<CondicionVehiculo, string> = {
  nueva: "Nueva",
  seminueva: "Seminueva",
  rescate_mecanico: "Rescate mecánico"
};

export const ETIQUETA_ANGULO: Record<string, string> = {
  frente: "Frente",
  lado_piloto: "Lado piloto",
  lado_copiloto: "Lado copiloto",
  trasera: "Trasera",
  tablero: "Tablero",
  dano_previo: "Daño previo",
  adicional: "Adicional"
};

export const ETIQUETA_TIPO_EVIDENCIA: Record<string, string> = {
  inicial: "Registro inicial",
  final: "Registro final"
};

export function estadoDocumental(vehiculo: Vehiculo) {
  const completo =
    vehiculo.tiene_placas &&
    vehiculo.tiene_tarjeta_circulacion &&
    vehiculo.tiene_verificacion &&
    vehiculo.puede_circular_rodando;
  if (completo) return { texto: "Listo", clase: "border-ui-success/30 bg-ui-success-soft text-ui-success" };
  return { texto: "Revisión", clase: "border-ui-warning/30 bg-ui-warning-soft text-ui-warning" };
}

export function fechaCorta(fechaIso: string | null | undefined) {
  return fechaIso ? new Date(fechaIso).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "—";
}

export function fechaHora(fechaIso: string | null | undefined) {
  return fechaIso ? new Date(fechaIso).toLocaleString("es-MX") : "—";
}
