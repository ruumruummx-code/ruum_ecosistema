/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

vi.mock("./PagoTraslado", () => ({
  PagoTraslado: vi.fn(() => <div data-testid="pago-mock" />),
}));

import { PagoRecuperable, MAX_TIMEOUT_MS } from "./PagoRecuperable";

const AHORA = new Date("2026-06-01T12:00:00.000Z").getTime();

describe("PagoRecuperable — temporizador de expiración", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra el pago mientras la cotización está vigente", async () => {
    render(
      <PagoRecuperable
        trasladoId="t-1"
        monto={500}
        cotizacionExpiraEn={new Date(AHORA + 3600_000).toISOString()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByTestId("pago-mock")).toBeInTheDocument();
  });

  it("oculta el pago cuando ya venció", async () => {
    render(
      <PagoRecuperable
        trasladoId="t-1"
        monto={500}
        cotizacionExpiraEn={new Date(AHORA - 1000).toISOString()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.queryByTestId("pago-mock")).toBeNull();
  });

  it("oculta el pago con fecha inválida", async () => {
    render(<PagoRecuperable trasladoId="t-1" monto={500} cotizacionExpiraEn="no-es-fecha" />);
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.queryByTestId("pago-mock")).toBeNull();
  });

  it("rearma el temporizador cuando la ventana supera 2^31-1 ms en vez de dispararlo", async () => {
    // Sin el rearmado, el setTimeout gigante se desborda y se consume de
    // inmediato: al avanzar MAX_TIMEOUT_MS ya no quedaría aviso y el pago
    // seguiría visible pasada la expiración.
    render(
      <PagoRecuperable
        trasladoId="t-1"
        monto={500}
        cotizacionExpiraEn={new Date(AHORA + MAX_TIMEOUT_MS + 3600_000).toISOString()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByTestId("pago-mock")).toBeInTheDocument();

    // Se consume el primer tramo: sigue vigente porque se rearmó.
    await act(async () => {
      vi.advanceTimersByTime(MAX_TIMEOUT_MS);
    });
    expect(screen.getByTestId("pago-mock")).toBeInTheDocument();

    // Pasada la expiración real: desaparece.
    await act(async () => {
      vi.advanceTimersByTime(3600_000 + 1000);
    });
    expect(screen.queryByTestId("pago-mock")).toBeNull();
  });
});
