/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PagoTraslado } from "./PagoTraslado";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const mockActualizar = vi.fn();
let mockPagoConfirmado = false;
vi.mock("@/state/AppStateProvider", () => ({
  useTrasladoRealtime: () => ({
    pagoConfirmado: mockPagoConfirmado,
    actualizar: mockActualizar,
  }),
}));

let onPagadoCallback: (() => void) | null = null;
vi.mock("../../PagoStripe", () => ({
  PagoStripe: ({ onPagado }: { onPagado: () => void }) => {
    onPagadoCallback = onPagado;
    return <button data-testid="boton-pagar-stripe" onClick={onPagado}>Pagar</button>;
  },
}));

describe("PagoTraslado — Resolución de estado de pago (Flujo 10 / CB-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockPagoConfirmado = false;
    onPagadoCallback = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("CA-1: renderiza estado de pago pendiente y no utiliza un setTimeout ciego de 1.5s", () => {
    render(<PagoTraslado trasladoId="12345678-1234-4234-8234-123456789abc" monto={1500} />);
    expect(screen.getByText("Pago pendiente")).toBeInTheDocument();
    expect(screen.getByTestId("boton-pagar-stripe")).toBeInTheDocument();
  });

  it("CA-2: ante webhook rápido (< 2s), verifica con el servidor y confirma el pago", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pagado: true, estadoTraslado: "servicio_confirmado" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PagoTraslado trasladoId="12345678-1234-4234-8234-123456789abc" monto={1500} />);

    // Simulamos que el usuario completa el pago en Stripe
    act(() => {
      onPagadoCallback?.();
    });

    // Pasa al estado honesto de verificación
    expect(screen.getByText(/Confirmando pago con el banco/)).toBeInTheDocument();

    // Avanza el temporizador del primer intento (1500 ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/viajes/12345678-1234-4234-8234-123456789abc/estado-pago"),
      expect.anything()
    );

    expect(screen.getByText("Pago procesado correctamente")).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("CA-2: ante webhook demorado (5s), reintenta y confirma en el segundo intento", async () => {
    // Intento 1: no pagado aún; Intento 2: pagado
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pagado: false, enProceso: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pagado: true, estadoTraslado: "servicio_confirmado" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<PagoTraslado trasladoId="12345678-1234-4234-8234-123456789abc" monto={1500} />);

    act(() => {
      onPagadoCallback?.();
    });

    // Intento 1 (1.5s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Confirmando pago con el banco/)).toBeInTheDocument();

    // Intento 2 (3s después = 4.6s total)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Pago procesado correctamente")).toBeInTheDocument();
  });

  it("CA-2 / CA-3: ante timeout de webhook (>18s), muestra estado intermedio honesto y NO vuelve a 'Pago pendiente'", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pagado: false, enProceso: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PagoTraslado trasladoId="12345678-1234-4234-8234-123456789abc" monto={1500} />);

    act(() => {
      onPagadoCallback?.();
    });

    // Avanza todos los reintentos (1.5s + 3s + 5s + 8s = 17.5s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(18000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);

    // Debe mostrar la pantalla intermedia honesta declarando F6/F7
    expect(screen.getByText("Pago en proceso de confirmación")).toBeInTheDocument();
    expect(screen.getByText(/reconciliador automático de pagos \(F6\/F7\)/)).toBeInTheDocument();
    expect(screen.getByText(/No es necesario volver a pagar/)).toBeInTheDocument();
    // No debe mostrar "Pago pendiente" ni el formulario de tarjeta
    expect(screen.queryByText("Pago pendiente")).not.toBeInTheDocument();
  });
});
