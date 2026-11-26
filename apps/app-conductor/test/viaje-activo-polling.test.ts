// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useActiveTripPolling } from "../src/app/useActiveTripPolling";
import { App } from "@capacitor/app";

const { obtenerConductor, listarTraslados, leerCache, esNativoMock } = vi.hoisted(() => ({
  obtenerConductor: vi.fn(),
  listarTraslados: vi.fn(),
  leerCache: vi.fn(),
  esNativoMock: vi.fn()
}));

vi.mock("@ruum/api/services", () => ({
  obtenerConductorActual: obtenerConductor,
  listarTrasladosAceptados: listarTraslados
}));

vi.mock("../src/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}),
  tieneSupabaseConfigurado: () => true
}));

vi.mock("../src/lib/offline-active-trip-cache", () => ({
  leerCacheViajeActivo: leerCache
}));

vi.mock("../src/lib/capacitor", () => ({
  esNativo: esNativoMock
}));

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn()
  }
}));

describe("useActiveTripPolling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    esNativoMock.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  test("un fallo transitorio conserva el viaje en caché y lo marca como desactualizado", async () => {
    obtenerConductor.mockRejectedValue(new Error("red interrumpida"));
    leerCache.mockResolvedValue({
      trasladoId: "viaje",
      estado: "traslado_en_curso",
      siguienteAccion: { label: "Conduce al destino" }
    });

    const { result } = renderHook(() => useActiveTripPolling("/panel"));
    await waitFor(() => expect(result.current.viajeActivoSinActualizar).toBe(true));
    await waitFor(() => expect(result.current.viajeActivo?.trasladoId).toBe("viaje"));
    expect(result.current.sinViajeConfirmado).toBe(false);
    expect(obtenerConductor).toHaveBeenCalledWith({}, { propagarErrorAuth: true });
  });

  test("una sesión ausente confirma que no hay viaje activo", async () => {
    obtenerConductor.mockResolvedValue(null);
    const { result } = renderHook(() => useActiveTripPolling("/panel"));
    await waitFor(() => expect(result.current.sinViajeConfirmado).toBe(true));
    expect(result.current.viajeActivo).toBeNull();
    expect(leerCache).not.toHaveBeenCalled();
  });

  test("viaje terminado: cuando los traslados están finalizados confirma que no hay viaje activo", async () => {
    obtenerConductor.mockResolvedValue({ id: "conductor-1" });
    // Traslado terminado / entregado: viajeActivoDesdePasaporte devuelve null para viajes con cerradoEn o estado no activo
    listarTraslados.mockResolvedValue([
      {
        id: "viaje-terminado",
        traslado_id: "viaje-terminado",
        estado: "entregado",
        cerrado_en: "2027-01-10T14:00:00Z"
      }
    ]);

    const { result } = renderHook(() => useActiveTripPolling("/panel"));

    await waitFor(() => expect(result.current.sinViajeConfirmado).toBe(true));
    expect(result.current.viajeActivo).toBeNull();
    expect(result.current.pasaporteActivo).toBeNull();
  });

  test("app en segundo plano y reanudación web: visibilitychange visible dispara recarga", async () => {
    obtenerConductor.mockResolvedValue({ id: "conductor-1" });
    listarTraslados.mockResolvedValue([]);

    renderHook(() => useActiveTripPolling("/panel"));

    await waitFor(() => expect(obtenerConductor).toHaveBeenCalledTimes(1));

    // Simular que el usuario regresa a la app (visibilidad cambia a visible)
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => expect(obtenerConductor).toHaveBeenCalledTimes(2));
  });

  test("app en segundo plano y reanudación nativa: appStateChange isActive dispara recarga", async () => {
    esNativoMock.mockReturnValue(true);
    let callbackAppState: ((state: { isActive: boolean }) => void) | null = null;
    vi.mocked(App.addListener).mockImplementation((_event, cb) => {
      callbackAppState = cb as (state: { isActive: boolean }) => void;
      return Promise.resolve({ remove: vi.fn() });
    });

    obtenerConductor.mockResolvedValue({ id: "conductor-1" });
    listarTraslados.mockResolvedValue([]);

    renderHook(() => useActiveTripPolling("/panel"));

    await waitFor(() => expect(obtenerConductor).toHaveBeenCalledTimes(1));
    expect(App.addListener).toHaveBeenCalledWith("appStateChange", expect.any(Function));

    // Simular evento nativo de reanudación (app sale de segundo plano)
    callbackAppState?.({ isActive: true });

    await waitFor(() => expect(obtenerConductor).toHaveBeenCalledTimes(2));
  });
});
