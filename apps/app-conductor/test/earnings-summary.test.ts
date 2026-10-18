import { describe, expect, it } from "vitest";
import type { TrasladoConductorGanancia } from "@ruum/api/services";
import { summarizeEarnings } from "../src/app/ganancias/earnings-summary";

function trip(date: string, amount: number | null, state = "servicio_cerrado") {
  return { cerrado_en: date, creado_en: date, estado: state, ganancia_conductor_congelada: amount } as TrasladoConductorGanancia;
}
describe("resumen de ganancias reales", () => {
  const now = new Date("2026-10-17T18:00:00Z");
  it("compara semanas en México sin sumar servicios activos o cancelados", () => {
    const summary = summarizeEarnings([trip("2026-10-12T18:00:00Z", 2450), trip("2026-10-05T18:00:00Z", 2187.5), trip("2026-10-12T18:00:00Z", 100, "servicio_cancelado"), trip("2026-10-12T18:00:00Z", 200, "traslado_en_curso")], now, "semana");
    expect(summary).toEqual({ count: 1, amount: 2450, incomplete: false, tripDifference: 0, trend: 12 });
  });
  it("respeta medianoche de México al cambiar semana y mes", () => {
    const trips = [trip("2026-10-11T05:59:59Z", 10), trip("2026-10-11T06:00:00Z", 20), trip("2026-10-01T05:59:59Z", 40)];
    expect(summarizeEarnings(trips, now, "semana").amount).toBe(20);
    expect(summarizeEarnings(trips, now, "mes").amount).toBe(30);
  });
  it("identifica montos pendientes sin inventar porcentajes ni una comisión", () => {
    const result = summarizeEarnings([trip("2026-10-12T18:00:00Z", null)], now, "semana");
    expect(result).toMatchObject({ amount: 0, count: 1, incomplete: true, trend: null });
    expect(summarizeEarnings([], now, "mes").trend).toBeNull();
  });
});
