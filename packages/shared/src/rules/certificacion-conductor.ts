// Modelo 11.3–11.5 — Filtro MAIC obligatorio + progresión MCE + ascenso de nivel.
// Un conductor solo es asignable cuando: identidad y licencia validadas y
// vigentes (Didit + documento), capacitación y evaluación práctica aprobadas,
// y estado Activo. Sin esto, esElegibleParaViaje debe bloquear con motivo.
import type { NivelCertificacionServicio } from "../constants/niveles-certificacion";

export type EstatusValidacionIdentidad =
  | "aprobado"
  | "incompleto"
  | "rechazado"
  | "vencido";

export interface EstadoCertificacionConductor {
  identidadEstatus: EstatusValidacionIdentidad;
  identidadValidada: boolean;
  licenciaValidada: boolean;
  licenciaVigente: boolean;
  diasParaVencerLicencia: number | null;
  alertaVencimientoLicencia: boolean; // true cuando faltan <= 15 días (11.3)
  capacitacionAprobada: boolean;
  evaluacionPracticaAprobada: boolean;
  pruebaManejoAprobada: boolean;
  nivel: NivelCertificacionServicio;
  activoParaAsignacion: boolean;
  motivoBloqueo: string | null;
}

export const DIAS_ALERTA_VENCIMIENTO_LICENCIA = 15;

export function diasEntre(fechaIso: string, referencia = new Date()): number {
  const hoy = new Date(referencia);
  hoy.setHours(0, 0, 0, 0);
  const v = new Date(`${fechaIso}T00:00:00`);
  return Math.round((v.getTime() - hoy.getTime()) / 86400000);
}

/** 11.4 MCE — filtro progresivo: solo Activo cuando todo está aprobado. */
export function esActivoParaAsignacionMCE(input: {
  identidadValidada: boolean;
  licenciaValidada: boolean;
  licenciaVigente: boolean;
  capacitacionAprobada: boolean;
  evaluacionPracticaAprobada: boolean;
  pruebaManejoAprobada: boolean;
  estado: string;
}): { activo: boolean; motivo: string | null } {
  if (input.estado !== "activo")
    return { activo: false, motivo: `Conductor en estado: ${input.estado}` };
  if (!input.identidadValidada)
    return { activo: false, motivo: "Identidad sin validar (Didit pendiente o rechazada)" };
  if (!input.licenciaValidada || !input.licenciaVigente)
    return { activo: false, motivo: "Licencia sin validar o vencida" };
  if (!input.capacitacionAprobada)
    return { activo: false, motivo: "Capacitación MCE pendiente" };
  if (!input.evaluacionPracticaAprobada)
    return { activo: false, motivo: "Evaluación práctica de evidencia pendiente" };
  if (!input.pruebaManejoAprobada)
    return { activo: false, motivo: "Prueba práctica de manejo pendiente" };
  return { activo: true, motivo: null };
}

/** 11.5 — Ascenso objetivo y visible: sin incidentes graves, buena evidencia y puntualidad. */
export function puedeAscenderNivel(input: {
  nivelActual: NivelCertificacionServicio;
  trasladosCompletados: number;
  puntualidadPct: number | null;
  calidadEvidenciaPct: number | null;
  incidentesGravesImputables: number;
  evaluacionComplementariaAprobada: boolean;
}): { puede: boolean; faltantes: string[] } {
  const faltantes: string[] = [];
  if (input.incidentesGravesImputables > 0)
    faltantes.push("Sin incidentes graves imputables");
  if (input.nivelActual >= 3) return { puede: false, faltantes: ["Nivel máximo alcanzado"] };
  const minimoTraslados = input.nivelActual === 1 ? 20 : 50;
  if (input.trasladosCompletados < minimoTraslados)
    faltantes.push(`Mínimo ${minimoTraslados} traslados completados`);
  if ((input.puntualidadPct ?? 1) < 0.9) faltantes.push("Puntualidad ≥ 90%");
  if ((input.calidadEvidenciaPct ?? 1) < 0.95) faltantes.push("Calidad de evidencia ≥ 95%");
  if (input.nivelActual === 2 && !input.evaluacionComplementariaAprobada)
    faltantes.push("Evaluación complementaria para Nivel 3");
  return { puede: faltantes.length === 0, faltantes };
}
