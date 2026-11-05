/**
 * RUUM-USR-F8-001 (CB-3 / T8 / CA-6): Manejo estricto de zona horaria y semanas calendario.
 * Fuente de verdad canónica: "America/Mexico_City".
 *
 * Evita la contaminación cruzada entre Date.prototype.getUTCDate() y fechas locales,
 * previniendo desplazamientos off-by-one durante transiciones de horario de verano (DST)
 * o en horas nocturnas (18:00–23:59 CST).
 */

export const ZONA_HORARIA_CANONICA = "America/Mexico_City";

export interface PartesFechaLocal {
  anio: string;
  mes: string;
  dia: string;
  fechaIsoCorta: string; // "YYYY-MM-DD"
  mesTexto: string; // "OCT", "NOV", etc.
  diaSemanaTexto: string; // "LUN", "MAR", etc.
  diaSemanaIndice: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
}

/**
 * Extrae las partes locales de una fecha en la zona horaria especificada mediante Intl.DateTimeFormat.
 */
export function obtenerPartesFechaLocal(
  fecha: Date,
  timeZone: string = ZONA_HORARIA_CANONICA
): PartesFechaLocal {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "narrow", // S, M, T, W, T, F, S
  });

  const partes = dtf.formatToParts(fecha);
  const anio = partes.find((p) => p.type === "year")?.value ?? "1970";
  const mes = partes.find((p) => p.type === "month")?.value ?? "01";
  const dia = partes.find((p) => p.type === "day")?.value ?? "01";
  const fechaIsoCorta = `${anio}-${mes}-${dia}`;

  // Para etiquetas legibles en español
  const dtfEs = new Intl.DateTimeFormat("es-MX", {
    timeZone,
    month: "short",
    weekday: "short",
  });
  const partesEs = dtfEs.formatToParts(fecha);
  const mesTexto = (partesEs.find((p) => p.type === "month")?.value ?? "—").toUpperCase().replace(".", "");
  const diaSemanaTexto = (partesEs.find((p) => p.type === "weekday")?.value ?? "—").toUpperCase().replace(".", "");

  // Calcular índice del día de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
  // Usamos Date.UTC con los componentes locales para obtener el día de semana exacto sin desfase
  const fechaUtcLocal = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  const diaSemanaIndice = fechaUtcLocal.getUTCDay();

  return {
    anio,
    mes,
    dia,
    fechaIsoCorta,
    mesTexto,
    diaSemanaTexto,
    diaSemanaIndice,
  };
}

/**
 * Devuelve la cadena "YYYY-MM-DD" local para una fecha dada.
 */
export function obtenerDiaCalendario(
  fecha: Date,
  timeZone: string = ZONA_HORARIA_CANONICA
): string {
  return obtenerPartesFechaLocal(fecha, timeZone).fechaIsoCorta;
}

/**
 * Calcula los límites de la semana calendario (de lunes a domingo) en la zona horaria dada.
 */
export function obtenerLimitesSemanaCalendario(
  fechaReferencia: Date,
  timeZone: string = ZONA_HORARIA_CANONICA
): { lunesIso: string; domingoIso: string } {
  const partes = obtenerPartesFechaLocal(fechaReferencia, timeZone);
  const anio = Number(partes.anio);
  const mes = Number(partes.mes) - 1;
  const dia = Number(partes.dia);

  // En JS, getUTCDay: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado.
  // Días transcurridos desde el lunes de la semana:
  // Domingo (0) -> 6 días desde el lunes anterior
  // Lunes (1) -> 0 días
  // Martes (2) -> 1 día
  const diasDesdeLunes = (partes.diaSemanaIndice + 6) % 7;

  // Lunes
  const fechaLunes = new Date(Date.UTC(anio, mes, dia - diasDesdeLunes));
  const lunesIso = fechaLunes.toISOString().slice(0, 10);

  // Domingo (6 días después del lunes)
  const fechaDomingo = new Date(Date.UTC(anio, mes, dia - diasDesdeLunes + 6));
  const domingoIso = fechaDomingo.toISOString().slice(0, 10);

  return { lunesIso, domingoIso };
}

/**
 * Evalúa si una fecha dada pertenece a la semana calendario activa (lunes a domingo).
 */
export function perteneceASemanaCalendario(
  fechaEvaluada: string | Date | null | undefined,
  fechaReferencia: Date = new Date(),
  timeZone: string = ZONA_HORARIA_CANONICA
): boolean {
  if (!fechaEvaluada) return false;
  const d = typeof fechaEvaluada === "string" ? new Date(fechaEvaluada) : fechaEvaluada;
  if (Number.isNaN(d.getTime())) return false;

  const diaEvaluado = obtenerDiaCalendario(d, timeZone);
  const { lunesIso, domingoIso } = obtenerLimitesSemanaCalendario(fechaReferencia, timeZone);

  return diaEvaluado >= lunesIso && diaEvaluado <= domingoIso;
}

/**
 * Evalúa si una fecha dada pertenece al día actual local.
 */
export function perteneceAHoy(
  fechaEvaluada: string | Date | null | undefined,
  fechaReferencia: Date = new Date(),
  timeZone: string = ZONA_HORARIA_CANONICA
): boolean {
  if (!fechaEvaluada) return false;
  const d = typeof fechaEvaluada === "string" ? new Date(fechaEvaluada) : fechaEvaluada;
  if (Number.isNaN(d.getTime())) return false;

  return obtenerDiaCalendario(d, timeZone) === obtenerDiaCalendario(fechaReferencia, timeZone);
}

/**
 * Evalúa si una fecha dada pertenece al mes actual local (YYYY-MM).
 */
export function perteneceAMes(
  fechaEvaluada: string | Date | null | undefined,
  fechaReferencia: Date = new Date(),
  timeZone: string = ZONA_HORARIA_CANONICA
): boolean {
  if (!fechaEvaluada) return false;
  const d = typeof fechaEvaluada === "string" ? new Date(fechaEvaluada) : fechaEvaluada;
  if (Number.isNaN(d.getTime())) return false;

  const diaEvaluado = obtenerDiaCalendario(d, timeZone);
  const diaHoy = obtenerDiaCalendario(fechaReferencia, timeZone);

  return diaEvaluado.slice(0, 7) === diaHoy.slice(0, 7);
}
