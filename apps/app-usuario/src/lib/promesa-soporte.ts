/** RUUM-UX-009: contenido aprobado por HManuel el 6/11/2026. */
export const PROMESA_SOPORTE = {
  acceso: "Soporte · recepción de reportes 24/7",
  recepcion: "Formulario: recepción de reportes las 24 horas, todos los días.",
  atencion: "Atención: lunes a viernes de 8:00 a 20:00, hora de Ciudad de México.",
  respuesta: "Primera respuesta estimada a reportes: menos de 30 minutos en horario de atención y menos de 2 horas fuera de horario.",
  emergencia: "Emergencias: correo a soporte las 24 horas, todos los días. Este canal no implica respuesta inmediata.",
  otrosCanales: "Los tiempos indicados corresponden a reportes. Consulta la disponibilidad de llamada y WhatsApp con soporte.",
} as const;
export const RESUMEN_SOPORTE = [PROMESA_SOPORTE.recepcion, PROMESA_SOPORTE.atencion, PROMESA_SOPORTE.respuesta, PROMESA_SOPORTE.emergencia].join(" ");
