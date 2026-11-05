import { logStructuredWarn, logStructuredInfo } from "@/lib/logger";
import { clasificarEstadoTraslado, puedeEjecutarAccionFlujo10 } from "./estados-traslado-policy";
import { calcularCargoCancelacion } from "@ruum/shared/rules";
import type { Database } from "@ruum/shared/types";

export type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

export type AccionFlujo10 =
  | "aceptar_cotizacion"
  | "pagar_traslado"
  | "cancelar_traslado"
  | "calificar_conductor"
  | "abrir_disputa"
  | "reportar_incidencia";

export class TransicionInvalidaFlujo10Error extends Error {
  readonly accion: AccionFlujo10;
  readonly estadoActual: string;
  readonly codigo: "ESTADO_EN_REVISION" | "TRANSICION_NO_PERMITIDA" | "VENTANA_72H_VENCIDA";

  constructor(
    accion: AccionFlujo10,
    estadoActual: string,
    mensaje: string,
    codigo: "ESTADO_EN_REVISION" | "TRANSICION_NO_PERMITIDA" | "VENTANA_72H_VENCIDA" = "TRANSICION_NO_PERMITIDA"
  ) {
    super(`[Flujo 10 - ${accion}] ${mensaje}`);
    this.name = "TransicionInvalidaFlujo10Error";
    this.accion = accion;
    this.estadoActual = estadoActual;
    this.codigo = codigo;
  }
}

/**
 * Matriz canónica de estados válidos para cada acción del usuario en Flujo 10 (CB-2 / T4, T5 / CA-4).
 */
export const ESTADOS_VALIDOS_POR_ACCION: Record<AccionFlujo10, readonly EstadoTraslado[]> = {
  aceptar_cotizacion: [
    "cotizacion_generada",
    "cotizacion_aceptada", // Idempotente
    "servicio_confirmado", // Idempotente
  ],
  pagar_traslado: [
    "cotizacion_aceptada",
    "pago_pendiente",
    "entrega_confirmada",
  ],
  cancelar_traslado: [
    "solicitud_creada",
    "documentacion_pendiente",
    "documentacion_en_revision",
    "documentacion_validada",
    "cotizacion_generada",
    "cotizacion_aceptada",
    "servicio_confirmado",
    "pendiente_de_conductor",
    "conductor_asignado",
    "conductor_en_camino_al_origen",
    "conductor_en_punto_de_recoleccion",
  ],
  calificar_conductor: [
    "servicio_cerrado",
  ],
  abrir_disputa: [
    "servicio_cerrado",
    "reclamo_resuelto",
    "cierre_operativo_con_incidencia_abierta",
  ],
  reportar_incidencia: [
    "conductor_en_camino_al_origen",
    "conductor_en_punto_de_recoleccion",
    "verificacion_vehiculo_en_proceso",
    "evidencia_inicial_en_proceso",
    "evidencia_inicial_completada",
    "vehiculo_recibido",
    "traslado_en_curso",
    "llegada_a_destino",
    "evidencia_final_en_proceso",
    "evidencia_final_completada",
    "entrega_confirmada",
  ],
};

/**
 * Zona horaria canónica para operaciones y plazos de Flujo 10 (CB-3 / T8 / CA-6).
 */
export const ZONA_HORARIA_CANONICA_F10 = "America/Mexico_City";

/**
 * Límite contractual de 72 horas para calificación y disputas, con margen de gracia técnico (CB-3 / T8 / CA-6).
 * Margen de gracia: 15 minutos (0.25 horas / 900,000 ms) para absorber desviaciones de reloj o latencia de red.
 */
export const HORAS_VENTANA_POST_CIERRE = 72;
export const MARGEN_GRACIA_MINUTOS = 15;
export const MARGEN_GRACIA_HORAS = MARGEN_GRACIA_MINUTOS / 60; // 0.25 h

export interface ResultadoValidacionVentana72h {
  permitido: boolean;
  horasDesdeCierre: number;
  dentroDeGracia: boolean;
  motivoRechazo?: string;
}

/**
 * Valida si una acción post-cierre (calificación o disputa) se encuentra dentro de la ventana de 72h con gracia.
 */
export function validarVentana72Horas(
  fechaCierreIso: string | null | undefined,
  ahoraMs = Date.now()
): ResultadoValidacionVentana72h {
  if (!fechaCierreIso) {
    return {
      permitido: false,
      horasDesdeCierre: Number.POSITIVE_INFINITY,
      dentroDeGracia: false,
      motivoRechazo: "El traslado no cuenta con registro de fecha de cierre válida.",
    };
  }

  const tiempoCierre = new Date(fechaCierreIso).getTime();
  if (Number.isNaN(tiempoCierre)) {
    return {
      permitido: false,
      horasDesdeCierre: Number.POSITIVE_INFINITY,
      dentroDeGracia: false,
      motivoRechazo: "La fecha de cierre del traslado es inválida.",
    };
  }

  const horasDesdeCierre = Math.max(0, (ahoraMs - tiempoCierre) / (1000 * 60 * 60));
  const limiteConGracia = HORAS_VENTANA_POST_CIERRE + MARGEN_GRACIA_HORAS;

  if (horasDesdeCierre <= HORAS_VENTANA_POST_CIERRE) {
    return {
      permitido: true,
      horasDesdeCierre,
      dentroDeGracia: false,
    };
  }

  if (horasDesdeCierre <= limiteConGracia) {
    return {
      permitido: true,
      horasDesdeCierre,
      dentroDeGracia: true,
    };
  }

  return {
    permitido: false,
    horasDesdeCierre,
    dentroDeGracia: false,
    motivoRechazo: `El plazo de ${HORAS_VENTANA_POST_CIERRE} horas para ejecutar esta acción ha expirado (${horasDesdeCierre.toFixed(1)} horas transcurridas desde el cierre).`,
  };
}

/**
 * Valida la viabilidad de una acción del usuario contra la máquina de estados de Flujo 10 y F8 (CB-2 / CA-4).
 */
export function validarTransicionFlujo10(
  accion: AccionFlujo10,
  estado: string | null | undefined,
  opciones?: {
    estadoOperativo?: string | null;
    cerradoEn?: string | null;
    fechaCierre?: string | null;
    trasladoId?: string;
  }
): { permitida: boolean; motivoBloqueo?: string } {
  const estLimpio = String(estado ?? "").trim() as EstadoTraslado;

  // 1. Integración transversal F8: Bloqueo categórico en 'en_revision'
  const permisoF8 = puedeEjecutarAccionFlujo10(
    estLimpio,
    opciones?.estadoOperativo,
    opciones?.cerradoEn,
    opciones?.trasladoId
  );
  if (!permisoF8.puedeAccionar) {
    return {
      permitida: false,
      motivoBloqueo: permisoF8.motivoBloqueo,
    };
  }

  // 2. Validación de estado permitido para la acción
  const estadosPermitidos = ESTADOS_VALIDOS_POR_ACCION[accion];
  if (!estadosPermitidos || !estadosPermitidos.includes(estLimpio)) {
    const motivo = `La acción "${accion.replace(/_/g, " ")}" no está permitida en el estado actual: "${estLimpio || "desconocido"}".`;
    logStructuredWarn("flujo10/transiciones", "transicion_invalida_rechazada", undefined, {
      accion,
      estadoActual: estLimpio,
      trasladoId: opciones?.trasladoId,
    });
    return {
      permitida: false,
      motivoBloqueo: motivo,
    };
  }

  // 3. Reglas específicas temporales (72h para calificación y disputas)
  if (accion === "calificar_conductor" || accion === "abrir_disputa") {
    const fechaRef = opciones?.fechaCierre ?? opciones?.cerradoEn;
    const resVentana = validarVentana72Horas(fechaRef);
    if (!resVentana.permitido) {
      return {
        permitida: false,
        motivoBloqueo: resVentana.motivoRechazo,
      };
    }
  }

  return { permitida: true };
}

/**
 * Exige que una transición sea válida; si no lo es, lanza TransicionInvalidaFlujo10Error fail-closed.
 */
export function exigirTransicionFlujo10(
  accion: AccionFlujo10,
  estado: string | null | undefined,
  opciones?: {
    estadoOperativo?: string | null;
    cerradoEn?: string | null;
    fechaCierre?: string | null;
    trasladoId?: string;
  }
): void {
  const val = validarTransicionFlujo10(accion, estado, opciones);
  if (!val.permitida) {
    const estLimpio = String(estado ?? "").trim();
    const cat = clasificarEstadoTraslado(estado, opciones?.estadoOperativo, opciones?.cerradoEn);
    const codigo = cat === "en_revision" ? "ESTADO_EN_REVISION" : "TRANSICION_NO_PERMITIDA";
    throw new TransicionInvalidaFlujo10Error(accion, estLimpio, val.motivoBloqueo ?? "Transición no permitida", codigo);
  }
}

/**
 * Especificación de evidencia requerida para acreditar la excepción por falla mecánica o seguridad (CB-3).
 */
export interface EvidenciaFallaMecanica {
  /** Descripción del desperfecto mecánico o anomalía de seguridad (mínimo 20 caracteres) */
  descripcion: string;
  /** URLs de evidencia fotográfica del desperfecto (al menos 1 fotografía requerida en reporte de usuario) */
  fotosUrls: string[];
  /** Coordenadas GPS del evento para cruce con la ruta del conductor */
  ubicacionGps?: { lat: number; lng: number };
  /** ID de incidencia previa en torre de control si ya fue reportada por el conductor o la plataforma */
  incidenciaPreviaId?: string;
}

/**
 * Valida la suficiencia probatoria para exonerar una cancelación por falla mecánica (CB-3).
 */
export function validarAcreditacionFallaMecanica(
  evidencia?: EvidenciaFallaMecanica
): { valida: boolean; motivo?: string } {
  if (!evidencia) {
    return {
      valida: false,
      motivo: "Se requiere presentar evidencia documental o fotográfica de la falla mecánica.",
    };
  }

  // Si ya existía un folio/incidencia previa generada por torre o conductor, se valida de inmediato
  if (evidencia.incidenciaPreviaId && evidencia.incidenciaPreviaId.trim().length > 0) {
    return { valida: true };
  }

  if (!evidencia.descripcion || evidencia.descripcion.trim().length < 20) {
    return {
      valida: false,
      motivo: "La descripción técnica de la falla debe contener al menos 20 caracteres describiendo el desperfecto.",
    };
  }

  if (!evidencia.fotosUrls || evidencia.fotosUrls.length === 0) {
    return {
      valida: false,
      motivo: "Se requiere adjuntar al menos 1 fotografía que evidencie el desperfecto mecánico o condición de la unidad.",
    };
  }

  return { valida: true };
}

/**
 * Contrato formal de penalización de cancelación (CB-3 / T6, T7 / CA-5).
 */
export interface ExcepcionCancelacion {
  tipo: "retraso_conductor" | "incidencia_mecanica" | "fuerza_mayor_soporte";
  justificacion: string;
  evidenciaMecanica?: EvidenciaFallaMecanica;
}

export interface ResultadoCalculoPenalizacionF10 {
  porcentaje_cargo: number;
  monto_cargo: number;
  mensaje: string;
  esExcepcion: boolean;
  tipoExcepcion?: "retraso_conductor" | "incidencia_mecanica" | "fuerza_mayor_soporte";
  motivoRechazoExcepcion?: string;
}

export function calcularPenalizacionCancelacionF10(
  precioTotal: number,
  horasRestantesParaInicio: number,
  conductorAsignado: boolean,
  conductorYaLlego: boolean,
  excepcion?: ExcepcionCancelacion
): ResultadoCalculoPenalizacionF10 {
  // Si existe excepción validada formalmente, verificar suficiencia probatoria si es mecánica
  if (excepcion) {
    if (excepcion.tipo === "incidencia_mecanica" && excepcion.evidenciaMecanica) {
      const acred = validarAcreditacionFallaMecanica(excepcion.evidenciaMecanica);
      if (!acred.valida) {
        const resNormal = calcularCargoCancelacion(
          precioTotal,
          horasRestantesParaInicio,
          conductorAsignado,
          conductorYaLlego
        );
        return {
          ...resNormal,
          esExcepcion: false,
          motivoRechazoExcepcion: acred.motivo,
        };
      }
    }

    return {
      porcentaje_cargo: 0,
      monto_cargo: 0,
      mensaje: `Cancelación exonerada de cargo por excepción registrada: ${excepcion.justificacion}`,
      esExcepcion: true,
      tipoExcepcion: excepcion.tipo,
    };
  }

  const res = calcularCargoCancelacion(
    precioTotal,
    horasRestantesParaInicio,
    conductorAsignado,
    conductorYaLlego
  );

  return {
    ...res,
    esExcepcion: false,
  };
}

/**
 * Payload estructurado de auditoría de acciones de traslado (CB-3 / T10 / CA-8).
 */
export interface RegistroAuditoriaFlujo10 {
  trasladoId: string;
  usuarioId: string;
  accion: AccionFlujo10;
  estadoAnterior: string;
  estadoNuevo: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function registrarAuditoriaAccionF10(registro: RegistroAuditoriaFlujo10) {
  logStructuredInfo("flujo10/auditoria", "accion_traslado_ejecutada", {
    ...registro,
  });
}
