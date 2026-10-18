import type { TrasladoConductorGanancia } from "@ruum/api/services";

export type EarningsPeriod = "semana" | "mes";
function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
function periodRange(now: Date, period: EarningsPeriod, previous: boolean) {
  const date = new Date(`${dayKey(now)}T12:00:00Z`);
  if (period === "semana") date.setUTCDate(date.getUTCDate() - date.getUTCDay() - (previous ? 7 : 0));
  else { date.setUTCDate(1); if (previous) date.setUTCMonth(date.getUTCMonth() - 1); }
  const start = date.toISOString().slice(0, 10);
  if (period === "semana") date.setUTCDate(date.getUTCDate() + 7);
  else date.setUTCMonth(date.getUTCMonth() + 1);
  return { start, end: date.toISOString().slice(0, 10) };
}

/** Only closed services with a recorded driver amount count as earned income. */
export function summarizeEarnings(trips: TrasladoConductorGanancia[], now: Date, period: EarningsPeriod) {
  const summarize = (previous: boolean) => {
    const { start, end } = periodRange(now, period, previous);
    const completed = trips.filter(trip => {
      if (trip.estado !== "servicio_cerrado") return false;
      const date = new Date(trip.cerrado_en ?? trip.actualizado_en ?? trip.creado_en);
      if (!Number.isFinite(date.getTime())) return false;
      const key = dayKey(date);
      return key >= start && key < end;
    });
    return { count: completed.length, amount: completed.reduce((sum, trip) => sum + Number(trip.ganancia_conductor_congelada ?? 0), 0), incomplete: completed.some(trip => trip.ganancia_conductor_congelada == null) };
  };
  const current = summarize(false);
  const previous = summarize(true);
  return { ...current, tripDifference: current.count - previous.count, trend: !current.incomplete && !previous.incomplete && previous.amount > 0 ? Math.round((current.amount - previous.amount) / previous.amount * 100) : null };
}
