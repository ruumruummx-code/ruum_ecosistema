// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VALORES_INICIALES } from "../constants";
import { useBorradorTraslado } from "./useBorradorTraslado";

const mocks = vi.hoisted(() => ({ leer: vi.fn(), guardar: vi.fn(), limpiar: vi.fn() }));
vi.mock("@/lib/borrador-traslado", () => ({
  leerBorradorTrasladoLocal: mocks.leer,
  guardarBorradorTrasladoLocal: mocks.guardar,
  limpiarBorradorTrasladoLocal: mocks.limpiar,
  ofuscarNumero: (n: number) => n,
}));

function params(): Parameters<typeof useBorradorTraslado>[0] {
  return {
    datos: { ...VALORES_INICIALES, marca: "Chrysler", modelo: "Cirrus" },
    paso: 3, claveIdempotencia: "clave-primera-solicitud", enviando: false,
    resultado: null, solicitudCreada: false, borradorDisponible: null,
    consultarCodigoPostal: vi.fn(async () => {}),
    setDatos: vi.fn(), setPaso: vi.fn(), setTarifaPreviaAceptada: vi.fn(),
    setTarifaPreviaSnapshot: vi.fn(), setErrorPaso: vi.fn(), setClaveIdempotencia: vi.fn(),
    setBorradorDisponible: vi.fn(), setEstadoGuardado: vi.fn(), setTiempoUltimoGuardado: vi.fn(),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.leer.mockReturnValue(null);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("borrador de solicitudes consecutivas", () => {
  it("cancela el guardado pendiente y no recrea el borrador tras crear el traslado", async () => {
    const p = params();
    const { rerender } = renderHook((props) => useBorradorTraslado(props), { initialProps: p });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    rerender({ ...p, paso: 4, solicitudCreada: true });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(mocks.limpiar).toHaveBeenCalled();
    expect(mocks.guardar).not.toHaveBeenCalled();
  });

  it("descarta un borrador antiguo en pago y genera una clave nueva para el segundo traslado", async () => {
    mocks.leer.mockReturnValue({ paso: 4, claveIdempotencia: "clave-ya-consumida" });
    const p = params();
    renderHook(() => useBorradorTraslado(p));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(mocks.limpiar).toHaveBeenCalled();
    expect(p.setBorradorDisponible).toHaveBeenCalledWith(null);
    expect(p.setClaveIdempotencia).toHaveBeenCalledWith(expect.any(String));
    expect(p.setClaveIdempotencia).not.toHaveBeenCalledWith("clave-ya-consumida");
  });

  it("conserva la misma clave al recuperar un borrador que aún no llegó a creación", async () => {
    const borrador = { paso: 3, claveIdempotencia: "clave-para-reintentar" };
    mocks.leer.mockReturnValue(borrador);
    const p = params();
    renderHook(() => useBorradorTraslado(p));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(p.setClaveIdempotencia).toHaveBeenCalledWith(borrador.claveIdempotencia);
    expect(p.setBorradorDisponible).toHaveBeenCalledWith(borrador);
    expect(mocks.limpiar).not.toHaveBeenCalled();
  });
});
