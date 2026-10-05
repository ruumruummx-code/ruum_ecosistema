// Modelo 11 — Conductores certificados Ruum Ruum (certificación por nivel de servicio).
// No sustituye a NivelCONCER (categoría vehicular). Este nivel regula el
// alcance geográfico habilitado: urbano -> interurbano -> interestatal.
// Acumulativo: Nivel 3 incluye lo de 1 y 2.
export type NivelCertificacionServicio = 1 | 2 | 3;

export interface InfoNivelCertificacion {
  nivel: NivelCertificacionServicio;
  denominacion: string;
  servicios: string[];
  descripcion: string;
}

export const NIVELES_CERTIFICACION_SERVICIO: InfoNivelCertificacion[] = [
  {
    nivel: 1,
    denominacion: "Básico",
    servicios: ["Traslado urbano"],
    descripcion: "Traslados dentro de la misma ciudad / zona urbana.",
  },
  {
    nivel: 2,
    denominacion: "Intermedio",
    servicios: ["Traslado urbano", "Traslado interurbano"],
    descripcion: "Incluye rutas interurbanas (< 100 km y rutas foráneas).",
  },
  {
    nivel: 3,
    denominacion: "Avanzado",
    servicios: ["Traslado urbano", "Traslado interurbano", "Traslado interestatal"],
    descripcion: "Alcance nacional; exige historial ejemplar y evaluación complementaria.",
  },
];

export const ETIQUETA_NIVEL_CERTIFICACION: Record<NivelCertificacionServicio, string> = {
  1: "Nivel 1 · Básico",
  2: "Nivel 2 · Intermedio",
  3: "Nivel 3 · Avanzado",
};

export function serviciosHabilitadosPorNivel(nivel: NivelCertificacionServicio): string[] {
  return NIVELES_CERTIFICACION_SERVICIO.find((n) => n.nivel === nivel)?.servicios ?? [];
}

// 11.2 — Requisitos mínimos (checklist canónico usado por app-conductor y panel-admin).
export const REQUISITOS_MINIMOS_CERTIFICACION = [
  { clave: "identificacion_oficial", etiqueta: "Identificación oficial vigente", bloqueante: true },
  { clave: "licencia_vigente", etiqueta: "Licencia vigente del tipo compatible", bloqueante: true },
  { clave: "comprobante_domicilio", etiqueta: "Comprobante de domicilio", bloqueante: true },
  { clave: "constancia_fiscal", etiqueta: "Constancia de situación fiscal", bloqueante: true },
  { clave: "cuenta_bancaria_propia", etiqueta: "Cuenta bancaria propia (CLABE)", bloqueante: true },
  { clave: "smartphone_compatible", etiqueta: "Teléfono inteligente compatible", bloqueante: true },
  { clave: "consentimiento_biometrico_geo", etiqueta: "Consentimiento expreso biométricos + geolocalización", bloqueante: true },
  { clave: "consentimiento_antecedentes", etiqueta: "Consentimiento antecedentes penales e infracciones", bloqueante: true },
  { clave: "capacitacion_aprobada", etiqueta: "Capacitación aprobada (MCE)", bloqueante: true },
  { clave: "evaluacion_practica_aprobada", etiqueta: "Evaluación práctica de evidencia + manejo aprobadas", bloqueante: true },
] as const;

export type ClaveRequisitoCertificacion =
  (typeof REQUISITOS_MINIMOS_CERTIFICACION)[number]["clave"];

// 11.6 — Carta de derechos (texto visible, no editable por conductor).
export const CARTA_DERECHOS_CONDUCTOR: string[] = [
  "Conocer tu pago antes de aceptar.",
  "Ver tus métricas de desempeño.",
  "Recibir explicación ante restricciones.",
  "Que toda suspensión o revocación sea revisada por una persona antes de ser definitiva.",
  "Conocer las penalizaciones aplicables y disputarlas con evidencia.",
  "Presentar aclaraciones.",
  "Recibir soporte humano.",
  "Activar protocolos de seguridad.",
  "Reportar corrupción sin represalias.",
  "Consultar historial de viajes y pagos.",
];

// 11.7 — Compromisos (contrapartida visible y auditable).
export const COMPROMISOS_CONDUCTOR: string[] = [
  "Capturar la evidencia completa en cada traslado.",
  "Cumplir los protocolos de seguridad.",
  "Mantener vigentes tus documentos.",
  "Tratar con respeto a clientes y equipo.",
  "Reportar incidentes de inmediato.",
  "No participar en prácticas prohibidas de asignación.",
];
