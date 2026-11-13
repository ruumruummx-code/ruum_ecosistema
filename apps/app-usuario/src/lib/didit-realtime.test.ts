import { beforeEach, describe, expect, it, vi } from "vitest";

const obtenerUsuarioActualMock = vi.fn();
const obtenerEstadoVerificacionDiditUsuarioMock = vi.fn();

vi.mock("@ruum/api/services", () => ({
  obtenerUsuarioActual: (...args: unknown[]) => obtenerUsuarioActualMock(...args),
  obtenerEstadoVerificacionDiditUsuario: (...args: unknown[]) =>
    obtenerEstadoVerificacionDiditUsuarioMock(...args),
}));

import { esperarResultadoDidit } from "./didit-realtime";

describe("didit-realtime — esperarResultadoDidit (RUUM-USR-F5-001)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    obtenerUsuarioActualMock.mockResolvedValue(null);
    obtenerEstadoVerificacionDiditUsuarioMock.mockResolvedValue(null);
  });

  it("resuelve inmediatamente cuando el canal Realtime recibe UPDATE de aprobado", async () => {
    let callbackRealtime: (payload: unknown) => void = () => {};
    const mockChannel = {
      on: vi.fn((_event, _opts, cb) => {
        callbackRealtime = cb;
        return mockChannel;
      }),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };

    const mockCliente = {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn(),
    };

    const promesa = esperarResultadoDidit({
      cliente: mockCliente,
      sessionId: "ses-123",
    });

    expect(mockCliente.channel).toHaveBeenCalledWith("didit-verif-ses-123");

    // Simular evento Realtime
    callbackRealtime({ new: { estado: "aprobado" } });

    const resultado = await promesa;
    expect(resultado).toBe("verificado");
    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });

  it("aplica fallback espaciado con backoff cuando Realtime no emite evento y resuelve", async () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };
    const mockCliente = {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn(),
    };

    obtenerUsuarioActualMock.mockResolvedValue({ estado_verificacion: "verificado" });

    const promesa = esperarResultadoDidit({
      cliente: mockCliente,
      sessionId: "ses-123",
      tiempoEsperaMaximoMs: 15_000,
    });

    // Avanzar al primer backoff (4s)
    await vi.advanceTimersByTimeAsync(4_000);
    // Vaciar cola de promesas asíncronas
    await Promise.resolve();
    await Promise.resolve();

    const resultado = await promesa;
    expect(resultado).toBe("verificado");
    expect(obtenerUsuarioActualMock).toHaveBeenCalled();
  });

  it("resuelve a estado asincrono al alcanzar timeout maximo sin saturar con queries", async () => {
    const mockCliente = {
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    };

    obtenerUsuarioActualMock.mockResolvedValue({ estado_verificacion: "pendiente" });
    obtenerEstadoVerificacionDiditUsuarioMock.mockResolvedValue({
      session_id: "ses-123",
      estado: "pendiente",
    });

    const promesa = esperarResultadoDidit({
      cliente: mockCliente,
      sessionId: "ses-123",
      tiempoEsperaMaximoMs: 20_000,
    });

    // Avanzar 20 segundos
    await vi.advanceTimersByTimeAsync(20_000);

    const resultado = await promesa;
    expect(resultado).toBe("asincrono");
  });
});
