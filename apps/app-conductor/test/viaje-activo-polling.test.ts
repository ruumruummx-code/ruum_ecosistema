// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useActiveTripPolling } from "../src/app/useActiveTripPolling";

const { obtenerConductor, leerCache } = vi.hoisted(() => ({
  obtenerConductor: vi.fn(), leerCache: vi.fn()
}));
vi.mock("@ruum/api/services", () => ({ obtenerConductorActual: obtenerConductor }));
vi.mock("../src/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: () => true
}));
vi.mock("../src/lib/offline-active-trip-cache", () => ({ leerCacheViajeActivo: leerCache }));
vi.mock("../src/lib/capacitor", () => ({ esNativo: () => false }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

test("un fallo transitorio conserva el viaje en caché y lo marca como desactualizado", async () => {
  obtenerConductor.mockRejectedValue(new Error("red interrumpida"));
  leerCache.mockResolvedValue({
    trasladoId: "viaje", estado: "traslado_en_curso",
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
