import { logStructuredInfo, logStructuredWarn, logStructuredError } from "@/lib/logger";

const SCOPE_TELEMETRIA = "telemetria/carga_masiva";

export interface MetricaInicioCarga {
  nombreArchivo: string;
  tamanoBytes: number;
  totalFilas: number;
  usuarioId?: string;
}

export interface MetricaValidacion {
  totalFilas: number;
  filasValidas: number;
  filasConError: number;
  duracionMs: number;
  usuarioId?: string;
}

export interface MetricaCotizacion {
  clave: string;
  totalFilas: number;
  cotizadas: number;
  erroresRuta: number;
  duracionMs: number;
  montoCentavos: number;
  parcial: boolean;
  usuarioId?: string;
}

export interface MetricaPago {
  cargaId: string;
  exito: boolean;
  fuente: "webhook" | "fallback_stripe";
  montoCentavos?: number;
  usuarioId?: string;
  error?: string;
}

/**
 * Registra el inicio de procesamiento de un archivo de carga masiva.
 */
export function registrarMetricaInicioCarga(datos: MetricaInicioCarga) {
  return logStructuredInfo(SCOPE_TELEMETRIA, "carga_masiva_iniciada", {
    archivo: datos.nombreArchivo,
    tamanoBytes: datos.tamanoBytes,
    totalFilas: datos.totalFilas,
    usuarioId: datos.usuarioId,
  });
}

/**
 * Registra los resultados del pipeline de validación de filas.
 */
export function registrarMetricaValidacion(datos: MetricaValidacion) {
  return logStructuredInfo(SCOPE_TELEMETRIA, "carga_masiva_validada", {
    totalFilas: datos.totalFilas,
    filasValidas: datos.filasValidas,
    filasConError: datos.filasConError,
    duracionMs: Math.round(datos.duracionMs),
    tasaExitoPct: datos.totalFilas > 0 ? Math.round((datos.filasValidas / datos.totalFilas) * 100) : 0,
    usuarioId: datos.usuarioId,
  });
}

/**
 * Registra métricas de cotización (duración Mapbox + matriz de tarifas, traslados y monto).
 */
export function registrarMetricaCotizacion(datos: MetricaCotizacion) {
  return logStructuredInfo(SCOPE_TELEMETRIA, "carga_masiva_cotizada", {
    clave: datos.clave,
    totalFilas: datos.totalFilas,
    cotizadas: datos.cotizadas,
    erroresRuta: datos.erroresRuta,
    duracionMs: Math.round(datos.duracionMs),
    montoMXN: datos.montoCentavos / 100,
    parcial: datos.parcial,
    usuarioId: datos.usuarioId,
  });
}

/**
 * Registra el resultado del pago y la conciliación (vía webhook o fallback polling).
 */
export function registrarMetricaPago(datos: MetricaPago) {
  if (datos.exito) {
    return logStructuredInfo(SCOPE_TELEMETRIA, "carga_masiva_pago_exitoso", {
      cargaId: datos.cargaId,
      fuente: datos.fuente,
      montoMXN: datos.montoCentavos ? datos.montoCentavos / 100 : undefined,
      usuarioId: datos.usuarioId,
    });
  }

  return logStructuredWarn(SCOPE_TELEMETRIA, "carga_masiva_pago_fallido", datos.error, {
    cargaId: datos.cargaId,
    fuente: datos.fuente,
    usuarioId: datos.usuarioId,
  });
}
