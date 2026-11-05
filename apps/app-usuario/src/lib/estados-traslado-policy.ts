import { logStructuredWarn } from "@/lib/logger";

/**
 * RUUM-USR-F8-001 (CB-2 / T5, T6, T7): Categorías canónicas de visualización de traslados.
 * 'en_revision' actúa como estado de contención FAIL-CLOSED para estados desconocidos o inconsistentes.
 */
export type CategoriaPestana =
  | "activos"
  | "programados"
  | "finalizados"
  | "cancelados"
  | "en_revision";

/**
 * Tabla de verdad de estados de traslado en el ciclo de vida de Ruum Ruum.
 */
export const ESTADOS_CANCELADOS = [
  "servicio_cancelado",
  "traslado_fallido",
] as const;

export const ESTADOS_FINALIZADOS = [
  "servicio_cerrado",
  "reclamo_resuelto",
  "disputa_resuelta",
  "cierre_operativo_con_incidencia_abierta",
] as const;

export const ESTADOS_PROGRAMADOS = [
  "solicitud_creada",
  "documentacion_pendiente",
  "documentacion_en_revision",
  "documentacion_validada",
  "cotizacion_generada",
  "cotizacion_aceptada",
  "servicio_confirmado",
  "pendiente_de_conductor",
] as const;

export const ESTADOS_ACTIVOS = [
  "conductor_asignado",
  "conductor_en_camino_al_origen",
  "conductor_en_punto_de_recoleccion",
  "verificacion_vehiculo_en_proceso",
  "evidencia_inicial_en_proceso",
  "evidencia_inicial_completada",
  "vehiculo_recibido",
  "traslado_en_curso",
  "incidencia_reportada",
  "llegada_a_destino",
  "evidencia_final_en_proceso",
  "evidencia_final_completada",
  "entrega_confirmada",
  "pago_pendiente",
  "pago_completado",
  "disputa_abierta",
  "reclamo_abierto",
  "dano_no_reportado_en_revision",
] as const;

/**
 * Diccionario de mapeo exhaustivo estado -> categoría.
 */
export const MAPEO_ESTADOS_CANONICOS: Record<string, CategoriaPestana> = {
  // Cancelados
  servicio_cancelado: "cancelados",
  traslado_fallido: "cancelados",

  // Finalizados
  servicio_cerrado: "finalizados",
  reclamo_resuelto: "finalizados",
  disputa_resuelta: "finalizados",
  cierre_operativo_con_incidencia_abierta: "finalizados",

  // Programados
  solicitud_creada: "programados",
  documentacion_pendiente: "programados",
  documentacion_en_revision: "programados",
  documentacion_validada: "programados",
  cotizacion_generada: "programados",
  cotizacion_aceptada: "programados",
  servicio_confirmado: "programados",
  pendiente_de_conductor: "programados",

  // Activos (En curso)
  conductor_asignado: "activos",
  conductor_en_camino_al_origen: "activos",
  conductor_en_punto_de_recoleccion: "activos",
  verificacion_vehiculo_en_proceso: "activos",
  evidencia_inicial_en_proceso: "activos",
  evidencia_inicial_completada: "activos",
  vehiculo_recibido: "activos",
  traslado_en_curso: "activos",
  incidencia_reportada: "activos",
  llegada_a_destino: "activos",
  evidencia_final_en_proceso: "activos",
  evidencia_final_completada: "activos",
  entrega_confirmada: "activos",
  pago_pendiente: "activos",
  pago_completado: "activos",
  disputa_abierta: "activos",
  reclamo_abierto: "activos",
  dano_no_reportado_en_revision: "activos",
};

/**
 * RUUM-USR-F8-001 (CB-2 / T6 / CA-4): Clasifica un estado de traslado sin fail-open.
 * Si el estado no existe en la tabla de verdad, se clasifica como 'en_revision' y se audita.
 */
export function clasificarEstadoTraslado(
  estado: string | null | undefined,
  estadoOperativo?: string | null,
  cerradoEn?: string | null,
  trasladoId?: string | null
): CategoriaPestana {
  // 1. Cierre operativo explícito
  if (cerradoEn || estadoOperativo === "closed") {
    return "finalizados";
  }

  const estLimpio = String(estado ?? "").trim();
  if (!estLimpio) {
    logStructuredWarn("estados-policy", "estado_vacio_fail_closed", undefined, {
      trasladoId: trasladoId ?? "desconocido",
    });
    return "en_revision";
  }

  // 2. Consulta en la tabla canónica
  const categoria = MAPEO_ESTADOS_CANONICOS[estLimpio];
  if (categoria) {
    return categoria;
  }

  // 3. FAIL-CLOSED: Estado no reconocido -> NUNCA cae en 'activos'
  logStructuredWarn("estados-policy", "estado_desconocido_fail_closed", undefined, {
    estado: estLimpio,
    trasladoId: trasladoId ?? "desconocido",
  });
  return "en_revision";
}

export interface ResultadoConsistenciaPasaporte {
  esHuerfano: boolean;
  categoria: CategoriaPestana;
  etiquetaEstado: string;
  requiereAtencionSoporte: boolean;
}

/**
 * RUUM-USR-F8-001 (CB-2 / T7 / CA-5): Contrato de consistencia para pasaportes sin traslado.
 * Si un pasaporte no tiene traslado asociado, no se muestra roto ni se oculta silenciosamente;
 * se marca como inconsistencia técnica, se audita y se etiqueta para revisión de soporte.
 */
export function evaluarConsistenciaPasaporte(
  pasaporteId: string | null | undefined,
  tieneTraslado: boolean,
  estadoPasaporte?: string | null,
  estadoOperativo?: string | null,
  cerradoEn?: string | null
): ResultadoConsistenciaPasaporte {
  if (!tieneTraslado) {
    logStructuredWarn("estados-policy", "pasaporte_huerfano_detectado", undefined, {
      pasaporteId: pasaporteId ?? "sin_id",
      estado: estadoPasaporte,
    });

    return {
      esHuerfano: true,
      categoria: "en_revision",
      etiquetaEstado: "En verificación técnica",
      requiereAtencionSoporte: true,
    };
  }

  const categoria = clasificarEstadoTraslado(estadoPasaporte, estadoOperativo, cerradoEn, pasaporteId);

  return {
    esHuerfano: false,
    categoria,
    etiquetaEstado: obtenerEtiquetaLegibleEstado(estadoPasaporte, categoria),
    requiereAtencionSoporte: categoria === "en_revision",
  };
}

/**
 * Devuelve una etiqueta amigable y legible para el usuario en la UI.
 */
export function obtenerEtiquetaLegibleEstado(
  estado: string | null | undefined,
  categoria: CategoriaPestana
): string {
  if (categoria === "en_revision") {
    return "En revisión técnica";
  }

  const e = String(estado ?? "");
  const ETIQUETAS: Record<string, string> = {
    solicitud_creada: "Solicitado",
    documentacion_pendiente: "Doc. pendiente",
    documentacion_en_revision: "Doc. en revisión",
    documentacion_validada: "Doc. validada",
    cotizacion_generada: "Cotizado",
    cotizacion_aceptada: "Cotización aceptada",
    servicio_confirmado: "Confirmado",
    pendiente_de_conductor: "Buscando conductor",
    conductor_asignado: "Conductor asignado",
    conductor_en_camino_al_origen: "En camino a recolección",
    conductor_en_punto_de_recoleccion: "En punto de origen",
    verificacion_vehiculo_en_proceso: "Inspeccionando vehículo",
    evidencia_inicial_en_proceso: "Fotos iniciales",
    evidencia_inicial_completada: "Inspección completada",
    vehiculo_recibido: "Vehículo recibido",
    traslado_en_curso: "En traslado",
    incidencia_reportada: "Incidencia en curso",
    llegada_a_destino: "En destino",
    evidencia_final_en_proceso: "Inspección de entrega",
    evidencia_final_completada: "Inspección final",
    entrega_confirmada: "Entregado",
    pago_pendiente: "Pago pendiente",
    pago_completado: "Pago completado",
    servicio_cerrado: "Finalizado",
    reclamo_resuelto: "Reclamo concluido",
    disputa_resuelta: "Disputa resuelta",
    cierre_operativo_con_incidencia_abierta: "Cerrado c/ incidencia",
    servicio_cancelado: "Cancelado",
    traslado_fallido: "No completado",
  };

  return ETIQUETAS[e] ?? (e ? e.replace(/_/g, " ") : "Estado pendiente");
}

/**
 * RUUM-USR-F8-001 / F10: Alineación transversal para acciones del traslado (disputas, cancelaciones, incidencias).
 * Ninguna acción operativa puede ejecutarse si el traslado está en 'en_revision'.
 */
export function puedeEjecutarAccionFlujo10(
  estado: string | null | undefined,
  estadoOperativo?: string | null,
  cerradoEn?: string | null,
  trasladoId?: string | null
): { puedeAccionar: boolean; motivoBloqueo?: string } {
  const cat = clasificarEstadoTraslado(estado, estadoOperativo, cerradoEn, trasladoId);
  if (cat === "en_revision") {
    return {
      puedeAccionar: false,
      motivoBloqueo:
        "El traslado se encuentra en verificación técnica. Las acciones operativas están temporalmente suspendidas hasta su resolución por soporte.",
    };
  }
  return { puedeAccionar: true };
}

/**
 * RUUM-USR-F8-001 / F13: Alineación transversal para facturación fiscal.
 * Solo se puede solicitar factura fiscal en traslados finalizados; bloqueado estrictamente en 'en_revision'.
 */
export function puedeFacturarFlujo13(
  estado: string | null | undefined,
  estadoOperativo?: string | null,
  cerradoEn?: string | null,
  trasladoId?: string | null
): { puedeFacturar: boolean; motivoBloqueo?: string } {
  const cat = clasificarEstadoTraslado(estado, estadoOperativo, cerradoEn, trasladoId);
  if (cat === "en_revision") {
    return {
      puedeFacturar: false,
      motivoBloqueo:
        "Facturación fiscal temporalmente no disponible: el servicio se encuentra en verificación técnica.",
    };
  }
  if (cat !== "finalizados") {
    return {
      puedeFacturar: false,
      motivoBloqueo:
        "La factura fiscal solo puede emitirse una vez finalizado y liquidado el traslado.",
    };
  }
  return { puedeFacturar: true };
}
