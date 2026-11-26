import type { IncidenciaTorre } from "@ruum/api/incidents";

export type Incidencia = IncidenciaTorre;
export type EstadoConexionVista = "datos_en_vivo" | "actualizando" | "sin_conexion" | "demo";
export type FiltroTipo = "todos" | "abiertas" | "vehiculo_no_enciende" | "contacto_no_localizado" | "documentacion_incompleta" | "dano_previo_relevante";
export type FiltroOrigen = "todos" | "traslado" | "usuario" | "vehiculo" | "empresa";
export type FiltroResponsable = "todos" | "operacion" | "torre_control" | "documentacion" | "seguros";
export type GravedadIncidencia = "leve" | "media" | "grave";
export type FiltroGravedad = "todos" | GravedadIncidencia;
export type FiltroEstadoReal = "todos" | "abierta" | "en_atencion" | "escalada" | "resuelta" | "cerrada";
export type FiltroSeveridadReal = "todos" | "low" | "medium" | "high" | "critical";

export const TIPOS: Array<Exclude<FiltroTipo, "todos" | "abiertas">> = [
  "vehiculo_no_enciende",
  "contacto_no_localizado",
  "documentacion_incompleta",
  "dano_previo_relevante"
];

export const FILTROS_TIPO: Array<{ valor: FiltroTipo; etiqueta: string }> = [
  { valor: "abiertas", etiqueta: "Abiertas" },
  { valor: "vehiculo_no_enciende", etiqueta: "Vehículo no enciende" },
  { valor: "contacto_no_localizado", etiqueta: "Contacto no localizado" },
  { valor: "documentacion_incompleta", etiqueta: "Documentación incompleta" },
  { valor: "dano_previo_relevante", etiqueta: "Daño previo relevante" },
  { valor: "todos", etiqueta: "Historial completo" }
];

export const FILTROS_ORIGEN: Array<{ valor: FiltroOrigen; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todos los orígenes" },
  { valor: "traslado", etiqueta: "Traslado" },
  { valor: "usuario", etiqueta: "Usuario" },
  { valor: "vehiculo", etiqueta: "Vehículo" },
  { valor: "empresa", etiqueta: "Empresa" }
];

export const FILTROS_RESPONSABLE: Array<{ valor: FiltroResponsable; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todos los responsables" },
  { valor: "operacion", etiqueta: "Operación" },
  { valor: "torre_control", etiqueta: "Torre de Control" },
  { valor: "documentacion", etiqueta: "Documentación" },
  { valor: "seguros", etiqueta: "Seguros" }
];

export const FILTROS_GRAVEDAD: Array<{ valor: FiltroGravedad; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todas las gravedades" },
  { valor: "grave", etiqueta: "Grave" },
  { valor: "media", etiqueta: "Media" },
  { valor: "leve", etiqueta: "Leve" }
];

export const FILTROS_ESTADO_REAL: Array<{ valor: FiltroEstadoReal; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todos los estados" },
  { valor: "abierta", etiqueta: "Abierta" },
  { valor: "en_atencion", etiqueta: "En atención" },
  { valor: "escalada", etiqueta: "Escalada" },
  { valor: "resuelta", etiqueta: "Resuelta" },
  { valor: "cerrada", etiqueta: "Cerrada" }
];

export const FILTROS_SEVERIDAD_REAL: Array<{ valor: FiltroSeveridadReal; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todas las severidades" },
  { valor: "low", etiqueta: "Baja" },
  { valor: "medium", etiqueta: "Media" },
  { valor: "high", etiqueta: "Alta" },
  { valor: "critical", etiqueta: "Crítica" }
];

export const RESPONSABLES_ASIGNABLES = FILTROS_RESPONSABLE.filter((item) => item.valor !== "todos");

export const INCIDENCIAS_DEMO: Incidencia[] = [
  {
    id: "INC-2026-0048",
    traslado_id: "demo-admin-002",
    tipo: "dano_previo_relevante",
    momento: "entrega",
    reportada_por: "conductor",
    creada_en: "2026-06-29T14:42:00.000Z",
    descripcion: "El kilometraje final no coincide con el registro inicial y falta foto clara del tablero.",
    resuelta: false,
    resuelta_en: null,
    severidad: "high",
    estado: "abierta",
    responsable_admin_id: null,
    asignada_en: null,
    nivel_escalamiento: 0,
    escalada_en: null,
    sla_horas: 24,
    sla_vence_en: null
  },
  {
    id: "INC-2026-0049",
    traslado_id: "demo-admin-001",
    tipo: "contacto_no_localizado",
    momento: "recoleccion",
    reportada_por: "admin",
    creada_en: "2026-06-29T16:15:00.000Z",
    descripcion: "La persona de entrega no responde teléfono ni WhatsApp autorizado.",
    resuelta: false,
    resuelta_en: null,
    severidad: "medium",
    estado: "abierta",
    responsable_admin_id: null,
    asignada_en: null,
    nivel_escalamiento: 0,
    escalada_en: null,
    sla_horas: 72,
    sla_vence_en: null
  },
  {
    id: "INC-2026-0050",
    traslado_id: "demo-admin-003",
    tipo: "documentacion_incompleta",
    momento: "post_cierre",
    reportada_por: "admin",
    creada_en: "2026-06-30T09:10:00.000Z",
    descripcion: "Pago retenido por diferencia entre tarifa final y gasto autorizado.",
    resuelta: false,
    resuelta_en: null,
    severidad: "low",
    estado: "abierta",
    responsable_admin_id: null,
    asignada_en: null,
    nivel_escalamiento: 0,
    escalada_en: null,
    sla_horas: 168,
    sla_vence_en: null
  }
];

export const CLASE_BADGE = {
  estado: {
    abierta: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
    resuelta: "border-ui-success/30 bg-ui-success-soft text-ui-success"
  },
  gravedad: {
    leve: "border-ui-brand/30 bg-ui-brand-soft text-ui-brand-soft-fg",
    media: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
    grave: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger"
  }
} as const;

export function etiquetaTipo(tipo: string) {
  return tipo.replaceAll("_", " ");
}

export function etiquetaResponsable(responsable: FiltroResponsable) {
  return FILTROS_RESPONSABLE.find((item) => item.valor === responsable)?.etiqueta ?? "Sin asignar";
}

export function etiquetaOrigen(origen: FiltroOrigen) {
  return FILTROS_ORIGEN.find((item) => item.valor === origen)?.etiqueta ?? "Origen";
}

export function origenInferido(incidencia: Incidencia): Exclude<FiltroOrigen, "todos"> {
  if (incidencia.tipo === "vehiculo_no_enciende" || incidencia.tipo === "dano_previo_relevante") return "vehiculo";
  if (incidencia.tipo === "documentacion_incompleta") return "usuario";
  if (!incidencia.traslado_id) return "empresa";
  return "traslado";
}

export function responsableSugerido(incidencia: Incidencia): Exclude<FiltroResponsable, "todos"> {
  if (incidencia.tipo === "documentacion_incompleta") return "documentacion";
  if (incidencia.tipo === "dano_previo_relevante") return "seguros";
  if (incidencia.reportada_por === "admin") return "torre_control";
  return "operacion";
}

export function gravedadIncidencia(incidencia: Incidencia): GravedadIncidencia {
  if (incidencia.tipo === "dano_previo_relevante" || incidencia.tipo === "vehiculo_no_enciende") return "grave";
  if (incidencia.tipo === "contacto_no_localizado" || incidencia.tipo === "documentacion_incompleta") return "media";
  return "leve";
}

export function horasTranscurridas(fechaIso: string, ahora: Date) {
  return Math.max(0, (ahora.getTime() - new Date(fechaIso).getTime()) / 3_600_000);
}

export function formatoDuracion(horas: number) {
  if (horas < 1) return "menos de 1 h";
  if (horas < 24) return `${Math.floor(horas)} h`;
  return `${Math.floor(horas / 24)} d ${Math.floor(horas % 24)} h`;
}

export function slaObjetivoHoras(gravedad: GravedadIncidencia) {
  if (gravedad === "grave") return 2;
  if (gravedad === "media") return 8;
  return 24;
}

export function vencimientoSlaMs(incidencia: Incidencia) {
  if (incidencia.sla_vence_en) {
    const vencimiento = new Date(incidencia.sla_vence_en).getTime();
    if (Number.isFinite(vencimiento)) return vencimiento;
  }
  const creada = new Date(incidencia.creada_en).getTime();
  return Number.isFinite(creada) ? creada + slaObjetivoHoras(gravedadIncidencia(incidencia)) * 3_600_000 : Number.POSITIVE_INFINITY;
}

export function slaIncidencia(incidencia: Incidencia, ahora: Date) {
  if (incidencia.resuelta) return { texto: "SLA cerrado", enRiesgo: false, vencido: false };
  const gravedad = gravedadIncidencia(incidencia);
  const objetivo = slaObjetivoHoras(gravedad);
  const horas = horasTranscurridas(incidencia.creada_en, ahora);
  const restante = objetivo - horas;
  return {
    texto: restante > 0 ? `${formatoDuracion(restante)} restantes` : `${formatoDuracion(Math.abs(restante))} vencido`,
    enRiesgo: horas / objetivo >= 0.8,
    vencido: restante <= 0
  };
}

export function fechaCompacta(fecha: Date) {
  return fecha.toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", " ·");
}

export function fechaCompleta(fecha: Date) {
  return fecha.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "medium" });
}
