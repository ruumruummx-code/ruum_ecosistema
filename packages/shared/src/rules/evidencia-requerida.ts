import type { FotoEvidencia, ResultadoVerificacionRepuve, TipoEvidencia } from "../types/evidencia";
import { ANGULOS_OBLIGATORIOS } from "../types/evidencia";

export interface ResultadoEvidencia {
  completa: boolean;
  angulosFaltantes: string[];
}

/**
 * PRD §4.4 — "El viaje no puede iniciar sin evidencia inicial completa" /
 * "El servicio no puede cerrarse sin evidencia final completa."
 * Evidencia completa = los 5 ángulos obligatorios presentes y sincronizados
 * para el tipo (inicial o final) correspondiente.
 */
export function evidenciaCompleta(fotos: FotoEvidencia[], tipo: TipoEvidencia): ResultadoEvidencia {
  const fotosDelTipo = fotos.filter((f) => f.tipo === tipo && f.sincronizada);
  const angulosPresentes = new Set(fotosDelTipo.map((f) => f.angulo));

  const angulosFaltantes = ANGULOS_OBLIGATORIOS.filter((a) => !angulosPresentes.has(a));

  return { completa: angulosFaltantes.length === 0, angulosFaltantes };
}

/**
 * PRD §4.4 — "Si la evidencia final muestra un daño que no estaba presente en
 * la evidencia inicial y no fue reportado como incidencia durante el
 * traslado, el sistema abre automáticamente una incidencia de daño no
 * reportado." Esta función solo determina SI corresponde abrir la incidencia
 * automática; la comparación foto-por-foto y el juicio sobre el daño en sí
 * son responsabilidad de Admin (Torre de Control), no de esta regla pura.
 */
export function debeAbrirIncidenciaDanoNoReportado(
  danoDetectadoEnFinal: boolean,
  danoPresenteEnInicial: boolean,
  incidenciaYaReportadaDuranteTraslado: boolean
): boolean {
  return danoDetectadoEnFinal && !danoPresenteEnInicial && !incidenciaYaReportadaDuranteTraslado;
}

/**
 * Normaliza VIN o placas eliminando guiones, espacios y símbolos para comparación exacta.
 */
export function normalizarIdentificadorVehicular(valor: string | null | undefined): string {
  return (valor ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export interface EvaluacionVerificacionRepuve {
  coincideVin: boolean;
  coincidePlacas: boolean;
  coincide: boolean;
  puedeAvanzar: boolean;
  motivoBloqueo: string | null;
}

/**
 * Evalúa en cliente (y espejo de la regla SQL) si los datos físicos y el resultado REPUVE
 * permiten avanzar a la captura fotográfica o requieren escalamiento a soporte.
 */
export function evaluarVerificacionRepuveLocal(params: {
  vinEsperado: string | null | undefined;
  placasEsperadas: string | null | undefined;
  vinFisico: string;
  placasFisicas: string;
  resultado: ResultadoVerificacionRepuve;
  tienePlacas?: boolean;
  esOverrideAdmin?: boolean;
}): EvaluacionVerificacionRepuve {
  if (params.esOverrideAdmin && params.resultado === "override_admin") {
    return {
      coincideVin: true,
      coincidePlacas: true,
      coincide: true,
      puedeAvanzar: true,
      motivoBloqueo: null
    };
  }

  const vinEsp = normalizarIdentificadorVehicular(params.vinEsperado);
  const vinFis = normalizarIdentificadorVehicular(params.vinFisico);
  const placasEsp = normalizarIdentificadorVehicular(params.placasEsperadas);
  const placasFis = normalizarIdentificadorVehicular(params.placasFisicas);
  const tienePlacas = params.tienePlacas ?? Boolean(placasEsp);

  const coincideVin = vinEsp.length > 0 && vinEsp === vinFis;
  const coincidePlacas = !tienePlacas ? (placasEsp === "" || placasEsp === placasFis) : (placasEsp.length > 0 && placasEsp === placasFis);
  const coincide = coincideVin && coincidePlacas;

  if (!coincideVin) {
    return {
      coincideVin,
      coincidePlacas,
      coincide,
      puedeAvanzar: false,
      motivoBloqueo: "El VIN físico no coincide con el registrado en el pasaporte digital. Reporta a soporte."
    };
  }

  if (!coincidePlacas) {
    return {
      coincideVin,
      coincidePlacas,
      coincide,
      puedeAvanzar: false,
      motivoBloqueo: "Las placas físicas no coinciden con las registradas en el pasaporte digital. Reporta a soporte."
    };
  }

  if (params.resultado !== "limpio") {
    return {
      coincideVin,
      coincidePlacas,
      coincide,
      puedeAvanzar: false,
      motivoBloqueo: "El resultado de REPUVE no es limpio. Por seguridad no puedes recibir el vehículo sin autorización de soporte."
    };
  }

  return {
    coincideVin,
    coincidePlacas,
    coincide,
    puedeAvanzar: true,
    motivoBloqueo: null
  };
}

