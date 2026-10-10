/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { CompartirPasaporte } from "./CompartirPasaporte";

const VENTANA_COPIADO_MS = 2500;

describe("CompartirPasaporte — temporizador de 'copiado'", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    /* jsdom no implementa Clipboard ni Share: se fuerza la rama de
       portapapeles, que es la que programa el temporizador. */
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* La variante "barra" solo tiene un botón, cuyo nombre cambia entre
     "Compartir" y "¡Enlace copiado!": se busca por rol para poder pulsarlo
     en cualquiera de los dos estados. */
  async function copiarEnlace() {
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
  }

  it("vuelve a 'Compartir' cuando pasan los 2,5 s de '¡Enlace copiado!'", async () => {
    render(<CompartirPasaporte folio="RUUM-1234" />);
    await copiarEnlace();
    expect(screen.getByRole("button", { name: /enlace copiado/i })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(VENTANA_COPIADO_MS);
    });
    expect(screen.getByRole("button", { name: /^compartir$/i })).toBeInTheDocument();
  });

  it("un segundo copiado reinicia la ventana en lugar de acumular temporizadores", async () => {
    render(<CompartirPasaporte folio="RUUM-1234" />);
    await copiarEnlace();
    expect(vi.getTimerCount()).toBe(1);

    // A los 2 s se copia otra vez: el temporizador previo se cancela.
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await copiarEnlace();
    expect(vi.getTimerCount()).toBe(1);

    // Los 500 ms que le quedaban a la primera ventana ya no apagan el aviso.
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole("button", { name: /enlace copiado/i })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(VENTANA_COPIADO_MS);
    });
    expect(screen.getByRole("button", { name: /^compartir$/i })).toBeInTheDocument();
  });

  it("desmontar dentro de la ventana suelta el temporizador y no deja setState pendiente", async () => {
    const vista = render(<CompartirPasaporte folio="RUUM-1234" />);
    await copiarEnlace();
    expect(vi.getTimerCount()).toBe(1);

    vista.unmount();
    expect(vi.getTimerCount()).toBe(0);

    // Pasada la ventana completa sobre el componente desmontado: ya no queda
    // temporizador que dispare el set Estado("ocioso") tardío.
    await act(async () => {
      vi.advanceTimersByTime(VENTANA_COPIADO_MS + 1000);
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});
