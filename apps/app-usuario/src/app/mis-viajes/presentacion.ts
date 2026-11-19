import type { BadgeProps } from "@ruum/ui/base";
import { estadoVisibleTraslado } from "../../lib/traslado-presentacion";
import { pestañaDeViaje, type PestañaFiltro, type ViajeLista } from "./useGestionTraslados";

/** Etiquetas únicas de categoría para móvil y escritorio (glosario: "En curso"). */
export const ETIQUETAS_PESTANA: Record<PestañaFiltro, string> = {
  todos: "Todos",
  activos: "En curso",
  programados: "Programados",
  finalizados: "Completados",
  cancelados: "Cancelados",
  en_revision: "En revisión",
};

export const ORDEN_PESTANAS: PestañaFiltro[] = ["todos", "activos", "programados", "finalizados", "cancelados", "en_revision"];

const TONO_ESTADO: Record<ReturnType<typeof estadoVisibleTraslado>["tono"], NonNullable<BadgeProps["tone"]>> = {
  active: "info",
  scheduled: "neutral",
  completed: "success",
  cancelled: "danger",
  review: "warning",
};

export function presentarViaje(viaje: ViajeLista) {
  const p = viaje.pasaporte;
  const esHuerfano = !p.traslado_id || !viaje.traslado;
  const categoria = pestañaDeViaje(p);
  const estado = estadoVisibleTraslado(p, esHuerfano);
  const enRevision = esHuerfano || categoria === "en_revision";
  const esPagoPendiente = p.estado === "cotizacion_aceptada" || p.estado === "pago_pendiente";

  const url = enRevision
    ? `/soporte?asunto=traslado_en_revision&folio=${p.traslado_id ?? p.creado_en ?? ""}`
    : p.traslado_id
      ? `/viajes/${p.traslado_id}`
      : "/mis-viajes";

  const accion = enRevision
    ? "Atención técnica"
    : estado.tono === "active"
      ? "Pasaporte"
      : esPagoPendiente
        ? "Completar pago"
        : "Ver ficha completa";

  return {
    estado,
    tono: TONO_ESTADO[estado.tono],
    categoria,
    cancelado: categoria === "cancelados" || estado.tono === "cancelled",
    url,
    accion,
    accionDestacada: esPagoPendiente && !enRevision,
    origen: viaje.traslado?.origen_ciudad || p.origen_ciudad || "Origen pendiente",
    destino: viaje.traslado?.destino_ciudad || p.destino_ciudad || "Destino pendiente",
  };
}

export function primerNombre(nombre: string | null | undefined): string | null {
  const valor = nombre?.trim().split(/\s+/)[0];
  if (!valor) return null;
  return `${valor.charAt(0).toUpperCase()}${valor.slice(1).toLowerCase()}`;
}
