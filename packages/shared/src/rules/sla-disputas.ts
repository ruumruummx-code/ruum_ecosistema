import type { ResultadoSLA } from "../types/sla";
import { evaluarSLA } from "../utils/evaluar-sla";

// PRD §4.14 — plazos del mecanismo de resolución de disputas
export const HORAS_PLAZO_APERTURA_DISPUTA = 72; // post-cierre del traslado
export const MARGEN_GRACIA_DISPUTA_HORAS = 0.25; // 15 minutos de gracia técnica (RUUM-USR-F10-001)
export const HORAS_PLAZO_REVISION_ADMIN = 48; // Admin revisa evidencia/bitácora/comunicación
export const DIAS_HABILES_SLA_RESOLUCION_ESTANDAR = 5;
export const DIAS_HABILES_SLA_RESOLUCION_ESCALADA = 10;
export const HORAS_PLAZO_ESCALAMIENTO = 48; // tras resolución, para escalar a Admin senior

export function puedeAbrirseDisputa(horasTranscurridasDesdeCierre: number, incluirMargenGracia = true): boolean {
  const limite = incluirMargenGracia
    ? HORAS_PLAZO_APERTURA_DISPUTA + MARGEN_GRACIA_DISPUTA_HORAS
    : HORAS_PLAZO_APERTURA_DISPUTA;
  return horasTranscurridasDesdeCierre <= limite;
}

export function slaRevisionAdmin(horasTranscurridasDesdeApertura: number): ResultadoSLA {
  return evaluarSLA(horasTranscurridasDesdeApertura, HORAS_PLAZO_REVISION_ADMIN);
}

export function slaResolucionDisputa(diasHabilesTranscurridos: number, escalada: boolean): ResultadoSLA {
  const limite = escalada ? DIAS_HABILES_SLA_RESOLUCION_ESCALADA : DIAS_HABILES_SLA_RESOLUCION_ESTANDAR;
  return evaluarSLA(diasHabilesTranscurridos, limite);
}

export function puedeEscalarse(horasTranscurridasDesdeResolucion: number): boolean {
  return horasTranscurridasDesdeResolucion <= HORAS_PLAZO_ESCALAMIENTO;
}
