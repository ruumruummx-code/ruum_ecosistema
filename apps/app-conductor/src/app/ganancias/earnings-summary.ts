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

/** Operational completion survives disputes and claims opened after closure.
 * Financial eligibility remains separate from the completed-transfer counter. */
export function isCompletedTransfer(trip: TrasladoConductorGanancia): boolean {
  if (trip.estado === "servicio_cancelado" || trip.estado === "traslado_fallido") return false;
  return Boolean(trip.cerrado_en) || trip.estado_operativo === "closed" || trip.estado === "servicio_cerrado";
}

export function summarizeEarnings(trips: TrasladoConductorGanancia[], now: Date, period: EarningsPeriod) {
  const allCompleted = trips.filter(isCompletedTransfer);
  const summarize = (previous: boolean) => {
    const { start, end } = periodRange(now, period, previous);
    const completed = allCompleted.filter(trip => {
      const date = new Date(trip.cerrado_en ?? trip.actualizado_en ?? trip.creado_en);
      if (!Number.isFinite(date.getTime())) return false;
      const key = dayKey(date);
      return key >= start && key < end;
    });
    // An open follow-up still counts operationally; it does not release money.
    const earnings = completed.filter(trip => trip.estado === "servicio_cerrado");
    return { count: completed.length, amount: earnings.reduce((sum, trip) => sum + Number(trip.ganancia_conductor_congelada ?? 0), 0), incomplete: earnings.some(trip => trip.ganancia_conductor_congelada == null) };
  };
  const current = summarize(false);
  const previous = summarize(true);
  return { ...current, totalCompleted: allCompleted.length, tripDifference: current.count - previous.count, trend: !current.incomplete && !previous.incomplete && previous.amount > 0 ? Math.round((current.amount - previous.amount) / previous.amount * 100) : null };
}
