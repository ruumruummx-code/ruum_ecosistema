/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSettersFormulario } from "./useSettersFormulario";

/**
 * Cada setter es mecánico —delega en `setFormulario(key, value)` sin lógica
 * propia—, pero eran 41 funciones que nadie ejercitaba. Este test las cubre
 * todas y, de paso, fija el mapeo setter → clave de estado.
 */
describe("useSettersFormulario", () => {
  it("cada setter delega en setFormulario con la clave que corresponde a su nombre", () => {
    const setFormulario = vi.fn();
    const { result } = renderHook(() => useSettersFormulario(setFormulario));

    const setters = Object.entries(result.current).filter(([k]) => k !== "setFormulario");
    expect(setters.length).toBeGreaterThan(30);

    for (const [nombre, setter] of setters) {
      // setEstadoGuardado → "estadoGuardado"
      const claveEsperada = nombre.charAt(3).toLowerCase() + nombre.slice(4);
      const centinela = `valor-${nombre}`;
      setter(centinela as never);
      expect(setFormulario, nombre).toHaveBeenCalledWith(claveEsperada, centinela);
    }
  });

  it("expone setFormulario tal cual", () => {
    const setFormulario = vi.fn();
    const { result } = renderHook(() => useSettersFormulario(setFormulario));
    expect(result.current.setFormulario).toBe(setFormulario);
  });

  it("admite actualizaciones funcionales estilo setState", () => {
    const setFormulario = vi.fn();
    const { result } = renderHook(() => useSettersFormulario(setFormulario));

    const actualizador = (previo: number) => previo + 1;
    result.current.setPaso(actualizador);

    expect(setFormulario).toHaveBeenCalledWith("paso", actualizador);
  });

  it("no cambia de identidad entre renders con el mismo setFormulario", () => {
    const setFormulario = vi.fn();
    const { result, rerender } = renderHook(() => useSettersFormulario(setFormulario));
    const primeros = result.current;

    rerender();

    // Estabilidad referencial: si esto falla, los efectos que dependen de un
    // setter se re-disparan en cada render.
    expect(result.current).toBe(primeros);
  });
});
