import { describe, expect, it } from "vitest";
import {
  obtenerDiaCalendario,
  obtenerLimitesSemanaCalendario,
  perteneceASemanaCalendario,
  perteneceAHoy,
  perteneceAMes,
  obtenerPartesFechaLocal,
  ZONA_HORARIA_CANONICA,
} from "./zona-horaria-traslados";

describe("zona-horaria-traslados (RUUM-USR-F8-001 CB-3)", () => {
  it("utiliza America/Mexico_City como zona horaria canónica", () => {
    expect(ZONA_HORARIA_CANONICA).toBe("America/Mexico_City");
  });

  it("convierte correctamente fechas UTC a fecha local de Ciudad de México (UTC-6)", () => {
    // 2026-10-28T01:00:00Z en UTC es 2026-10-27 a las 19:00 en CDMX
    const fecha = new Date("2026-10-28T01:00:00Z");
    const partes = obtenerPartesFechaLocal(fecha);
    expect(partes.fechaIsoCorta).toBe("2026-10-27");
    expect(partes.dia).toBe("27");
    expect(partes.mes).toBe("10");
    expect(partes.anio).toBe("2026");
  });

  it("calcula límites estrictos de semana de lunes a domingo", () => {
    // Miércoles 2026-10-28 en CDMX (semana: lunes 2026-10-26 a domingo 2026-11-01)
    const fechaRef = new Date("2026-10-28T18:00:00Z");
    const limites = obtenerLimitesSemanaCalendario(fechaRef);
    expect(limites.lunesIso).toBe("2026-10-26");
    expect(limites.domingoIso).toBe("2026-11-01");
  });

  it("filtra pertenencia a semana calendario sin contaminación UTC ni off-by-one", () => {
    const fechaRef = new Date("2026-10-28T18:00:00Z"); // Miércoles

    // Lunes de la misma semana (2026-10-26 12:00 CDMX = 18:00 UTC)
    expect(perteneceASemanaCalendario("2026-10-26T18:00:00Z", fechaRef)).toBe(true);
    // Domingo de la misma semana (2026-11-01 23:00 CDMX = 2026-11-02 05:00 UTC)
    expect(perteneceASemanaCalendario("2026-11-02T05:00:00Z", fechaRef)).toBe(true);

    // Domingo anterior (fuera de la semana)
    expect(perteneceASemanaCalendario("2026-10-25T18:00:00Z", fechaRef)).toBe(false);
    // Lunes siguiente (fuera de la semana)
    expect(perteneceASemanaCalendario("2026-11-02T18:00:00Z", fechaRef)).toBe(false);

    // Fechas inválidas o nulas
    expect(perteneceASemanaCalendario(null, fechaRef)).toBe(false);
    expect(perteneceASemanaCalendario("invalida", fechaRef)).toBe(false);
  });

  it("evalúa correctamente pertenencia a hoy y a mes", () => {
    const hoyRef = new Date("2026-10-27T18:00:00Z"); // 12:00 CDMX el 27 de octubre

    expect(perteneceAHoy("2026-10-27T15:00:00Z", hoyRef)).toBe(true);
    expect(perteneceAHoy("2026-10-28T01:00:00Z", hoyRef)).toBe(true); // 19:00 del 27 en CDMX
    expect(perteneceAHoy("2026-10-28T08:00:00Z", hoyRef)).toBe(false); // 02:00 del 28 en CDMX

    expect(perteneceAMes("2026-10-01T12:00:00Z", hoyRef)).toBe(true);
    expect(perteneceAMes("2026-10-31T20:00:00Z", hoyRef)).toBe(true);
    expect(perteneceAMes("2026-11-01T12:00:00Z", hoyRef)).toBe(false);
  });

  it("mantiene estabilidad horaria permanente en America/Mexico_City sin DST (Decreto Ley 2022)", () => {
    // México abolió el horario de verano en 2022. UTC-6 permanece fijo todo el año.
    // Fechas históricas donde antes había DST:
    // 1er domingo de abril (antiguo cambio de horario):
    const fechaAbril = new Date("2026-04-05T08:00:00Z"); // 02:00 CST
    const partesAbril = obtenerPartesFechaLocal(fechaAbril);
    expect(partesAbril.fechaIsoCorta).toBe("2026-04-05");

    // Último domingo de octubre (antiguo cambio de horario de invierno):
    const fechaOctubre = new Date("2026-10-25T08:00:00Z"); // 02:00 CST
    const partesOctubre = obtenerPartesFechaLocal(fechaOctubre);
    expect(partesOctubre.fechaIsoCorta).toBe("2026-10-25");

    // Medianoche exacta
    const fechaMedianoche = new Date("2026-07-15T06:00:00Z"); // 00:00 CST del 15 de julio
    const partesMedianoche = obtenerPartesFechaLocal(fechaMedianoche);
    expect(partesMedianoche.fechaIsoCorta).toBe("2026-07-15");
  });
});
