/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { fechaProgramada, pestañaDeViaje, useGestionTraslados, type ViajeLista, type Pasaporte } from "./useGestionTraslados";

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

it("mantiene en finalizados una disputa posterior al cierre operativo", () => {
  expect(pestañaDeViaje({ estado: "disputa_abierta", estado_operativo: "closed", cerrado_en: "2026-10-30T15:00:00Z" } as Pasaporte)).toBe("finalizados");
  expect(pestañaDeViaje({ estado: "disputa_abierta", estado_operativo: "in_transit", cerrado_en: null } as Pasaporte)).toBe("activos");
});

describe("endurecimiento de consistencia y fail-closed (RUUM-USR-F8-001)", () => {
  it("clasifica estado desconocido como 'en_revision' (fail-closed, nunca en 'activos')", () => {
    const desconocido = { estado: "estado_corrupto_inesperado" } as unknown as Pasaporte;
    expect(pestañaDeViaje(desconocido)).toBe("en_revision");
  });

  it("prioriza gastoConfirmadoServidor cuando es provisto (CB-1)", () => {
    const { result } = renderHook(() =>
      useGestionTraslados({
        pestanaInicial: "todos",
        traslados: [viaje("servicio_cerrado", "t-1")],
        gastoConfirmadoServidor: 45000,
      })
    );
    expect(result.current.gastoTotal).toBe(45000);
    expect(result.current.gastoFormateado).toBe("$45k");
  });

  it("calcula conteos incluyendo la categoría 'en_revision'", () => {
    function viajeConEstado(id: string, estado: string): ViajeLista {
      return {
        pasaporte: { traslado_id: id, estado, creado_en: "2026-10-27T12:00:00Z" },
        traslado: { id, fecha_hora_programada: null },
      } as unknown as ViajeLista;
    }

    const { result } = renderHook(() =>
      useGestionTraslados({
        pestanaInicial: "todos",
        traslados: [
          viajeConEstado("t-prog", "solicitud_creada"),
          viajeConEstado("t-act", "traslado_en_curso"),
          viajeConEstado("t-fin", "servicio_cerrado"),
          viajeConEstado("t-canc", "servicio_cancelado"),
          viajeConEstado("t-rev", "estado_inexistente"),
        ],
      })
    );
    expect(result.current.conteos.programados).toBe(1);
    expect(result.current.conteos.activos).toBe(1);
    expect(result.current.conteos.finalizados).toBe(1);
    expect(result.current.conteos.cancelados).toBe(1);
    expect(result.current.conteos.en_revision).toBe(1);
    expect(result.current.conteos.todos).toBe(5);
  });
});
