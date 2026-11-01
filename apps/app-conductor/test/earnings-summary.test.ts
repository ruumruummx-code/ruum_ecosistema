import { describe, expect, it } from "vitest";
import type { TrasladoConductorGanancia } from "@ruum/api/services";
import { summarizeEarnings } from "../src/app/ganancias/earnings-summary";

function trip(date: string, amount: number | null, state = "servicio_cerrado") {
  return { cerrado_en: state === "servicio_cerrado" ? date : null, creado_en: date, estado: state, ganancia_conductor_congelada: amount } as TrasladoConductorGanancia;
}
describe("resumen de ganancias reales", () => {
  const now = new Date("2026-10-17T18:00:00Z");
  it("compara semanas en México sin sumar servicios activos o cancelados", () => {
    const summary = summarizeEarnings([trip("2026-10-12T18:00:00Z", 2450), trip("2026-10-05T18:00:00Z", 2187.5), trip("2026-10-12T18:00:00Z", 100, "servicio_cancelado"), trip("2026-10-12T18:00:00Z", 200, "traslado_en_curso")], now, "semana");
    expect(summary).toEqual({ count: 1, totalCompleted: 2, amount: 2450, incomplete: false, tripDifference: 0, trend: 12 });
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


it("cuenta un cierre con disputa por su fecha de cierre, sin liberar su importe", () => {
  const cerrado = trip("2026-10-29T21:50:00Z", 100);
  const disputa = { ...trip("2026-10-31T20:12:00Z", 200, "disputa_abierta"), estado_operativo: "closed", cerrado_en: "2026-10-31T20:12:00Z", actualizado_en: "2026-11-01T07:38:00Z" } as TrasladoConductorGanancia;
  expect(summarizeEarnings([cerrado, disputa], new Date("2026-10-31T23:00:00Z"), "mes")).toMatchObject({ count: 2, totalCompleted: 2, amount: 100 });
  expect(summarizeEarnings([cerrado, disputa], new Date("2026-11-01T12:00:00Z"), "mes")).toMatchObject({ count: 0, totalCompleted: 2, amount: 0 });
});
it("separa seguimiento abierto durante el traslado de seguimiento posterior al cierre", () => {
  const abierto = { ...trip("2026-10-31T20:00:00Z", 100, "disputa_abierta"), cerrado_en: null, estado_operativo: "in_transit" } as TrasladoConductorGanancia;
  const cerrado = { ...abierto, estado_operativo: "closed", cerrado_en: "2026-10-31T20:00:00Z" } as TrasladoConductorGanancia;
  expect(summarizeEarnings([abierto, cerrado], new Date("2026-10-31T23:00:00Z"), "mes")).toMatchObject({ count: 1, totalCompleted: 1, amount: 0 });
});
