/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { fechaProgramada, pestañaDeViaje, useGestionTraslados, type ViajeLista } from "./useGestionTraslados";

function viaje(id: string, fecha: string | null): ViajeLista {
  return {
    pasaporte: { traslado_id: id, estado: "solicitud_creada", creado_en: "2026-10-27T12:00:00Z" },
    traslado: { id, fecha_hora_programada: fecha },
  } as ViajeLista;
}

afterEach(() => vi.useRealTimers());

describe("fechas y clasificación de traslados", () => {
  it("filtra la semana de lunes a domingo y excluye fechas desconocidas", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T18:00:00Z"));
    const { result } = renderHook(() => useGestionTraslados({
      pestanaInicial: "todos",
      traslados: [viaje("domingo-anterior", "2026-10-25T18:00:00Z"), viaje("lunes", "2026-10-26T18:00:00Z"), viaje("domingo", "2026-11-01T18:00:00Z"), viaje("lunes-siguiente", "2026-11-02T18:00:00Z"), viaje("sin-fecha", null), viaje("invalida", "invalida")],
    }));
    act(() => result.current.setFiltroFecha("semana"));
    expect(result.current.filtrados.map(t => t.pasaporte.traslado_id)).toEqual(["lunes", "domingo"]);
  });

  it("usa el día de Ciudad de México al filtrar y presentar la fecha", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T18:00:00Z"));
    const { result } = renderHook(() => useGestionTraslados({ pestanaInicial: "todos", traslados: [viaje("ayer", "2026-10-27T01:00:00Z"), viaje("hoy", "2026-10-28T01:00:00Z")] }));
    act(() => result.current.setFiltroFecha("hoy"));
    expect(result.current.filtrados.map(t => t.pasaporte.traslado_id)).toEqual(["hoy"]);
    expect(fechaProgramada("2026-10-28T01:00:00Z").diaNumero).toBe("27");
    expect(fechaProgramada("invalida").fecha).toBe("Fecha pendiente");
  });

  it("clasifica el cierre operativo con incidencia como finalizado", () => {
    const item = viaje("cerrado", null);
    item.pasaporte.estado = "cierre_operativo_con_incidencia_abierta";
    expect(pestañaDeViaje(item.pasaporte)).toBe("finalizados");
  });
});
