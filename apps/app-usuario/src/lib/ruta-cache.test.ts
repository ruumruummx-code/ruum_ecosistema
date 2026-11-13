import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), directions: vi.fn() }));
vi.mock("@/lib/csp-rate-limit", () => ({ getRedis: () => ({ get: mocks.get, set: mocks.set }) }));
vi.mock("@/lib/logger", () => ({ logStructuredWarn: vi.fn() }));
vi.mock("@ruum/shared/utils", () => ({ obtenerRutaDirectionsMapboxConParadas: mocks.directions }));
import { obtenerRutaRecalculadaServidor, RutaNoDisponibleError } from "./ruta-cache";
const origen = { lat: 19.4, lng: -99.1 };
const destino = { lat: 20, lng: -100 };
describe("ruta facturable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "test-token");
    mocks.get.mockResolvedValue(null);
    mocks.set.mockResolvedValue("OK");
  });
  it("incluye todas las paradas ordenadas en Directions", async () => {
    mocks.directions.mockResolvedValue({ distanciaKm: 120, tiempoHoras: 3 });
    const paradas = [{ lat: 21, lng: -99 }, { lat: 22, lng: -100 }];
    expect(await obtenerRutaRecalculadaServidor(origen, destino, paradas)).toMatchObject({ distanciaKm: 120, fuente: "mapbox" });
    expect(mocks.directions).toHaveBeenCalledWith([-99.1, 19.4], [-100, 20], [[-99, 21], [-100, 22]], "test-token", expect.anything());
  });
  it("falla sin estimar en línea recta si Directions falla", async () => {
    mocks.directions.mockRejectedValue(new Error("mapas caído"));
    await expect(obtenerRutaRecalculadaServidor(origen, destino, [{ lat: 22, lng: -99 }])).rejects.toBeInstanceOf(RutaNoDisponibleError);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rechaza caché con tiempo inválido y consulta Directions", async () => {
    mocks.get.mockResolvedValue({ distanciaKm: 1, tiempoEstimadoHoras: NaN });
    mocks.directions.mockResolvedValue({ distanciaKm: 120, tiempoHoras: 3 });
    expect((await obtenerRutaRecalculadaServidor(origen, destino)).distanciaKm).toBe(120);
  });
  it.each([null, { distanciaKm: 0, tiempoHoras: 1 }, { distanciaKm: 10, tiempoHoras: Infinity }])("rechaza resultados no facturables: %j", async (ruta) => {
    mocks.directions.mockResolvedValue(ruta);
    await expect(obtenerRutaRecalculadaServidor(origen, destino)).rejects.toBeInstanceOf(RutaNoDisponibleError);
  });
  it("bloquea sin token de mapas", async () => {
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "");
    await expect(obtenerRutaRecalculadaServidor(origen, destino)).rejects.toBeInstanceOf(RutaNoDisponibleError);
  });
});
