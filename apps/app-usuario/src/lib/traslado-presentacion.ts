import type { Database } from "@ruum/shared/types";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { clasificarEstadoTraslado } from "./estados-traslado-policy";
import { TERMINOLOGIA_USUARIO } from "./glosario";

type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];

const estadosEnRevision = new Set([
  "documentacion_en_revision", "incidencia_reportada", "disputa_abierta",
  "reclamo_abierto", "dano_no_reportado_en_revision", "cierre_operativo_con_incidencia_abierta",
]);

type EstadoVisible = {
  etiqueta: "Pendiente" | "En camino" | "En revisión" | "Resuelto" | "Completado" | "Cancelado";
  detalle: string;
  tono: "active" | "scheduled" | "completed" | "cancelled" | "review";
};

export function estadoVisibleTraslado(p: Pasaporte, requiereRevision = false): EstadoVisible {
  if (requiereRevision || !p.estado) {
    return { etiqueta: "En revisión", detalle: "En verificación técnica", tono: "review" };
  }

  const estado = p.estado;
  const detalle = TERMINOLOGIA_USUARIO[estado] ?? ETIQUETA_ESTADO_TRASLADO[estado];
  if (estadosEnRevision.has(estado)) return { etiqueta: "En revisión", detalle, tono: "review" };
  if (estado === "disputa_resuelta" || estado === "reclamo_resuelto") {
    return { etiqueta: "Resuelto", detalle, tono: "completed" };
  }
  if (estado === "servicio_cancelado" || estado === "traslado_fallido") {
    return { etiqueta: "Cancelado", detalle, tono: "cancelled" };
  }
  if (estado === "entrega_confirmada" || estado === "pago_completado") {
    return { etiqueta: "Completado", detalle, tono: "completed" };
  }
  if (estado === "conductor_en_camino_al_origen" || estado === "traslado_en_curso") {
    return { etiqueta: "En camino", detalle, tono: "active" };
  }

  const categoria = clasificarEstadoTraslado(estado, p.estado_operativo, p.cerrado_en, p.traslado_id);
  if (categoria === "finalizados") return { etiqueta: "Completado", detalle, tono: "completed" };
  if (categoria === "en_revision") return { etiqueta: "En revisión", detalle: detalle ?? "En verificación técnica", tono: "review" };
  return { etiqueta: "Pendiente", detalle, tono: "scheduled" };
}

export function placaVisible(placa: string | null | undefined) {
  const valor = placa?.trim();
  return !valor || /^no\s+disponible$/i.test(valor) ? "Sin placa" : valor;
}

export function lineasVehiculo(p: Pasaporte) {
  const marca = p.vehiculo_marca?.trim();
  const modelo = [p.vehiculo_modelo?.trim(), p.vehiculo_anio].filter(Boolean).join(" ");
  return { marca: marca || (modelo ? "" : "Vehículo"), modelo };
}
