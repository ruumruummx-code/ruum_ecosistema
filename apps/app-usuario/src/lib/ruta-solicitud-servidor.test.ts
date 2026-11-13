import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SolicitudTrasladoValidada } from "@ruum/shared/validacion";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ ruta: vi.fn() }));
vi.mock("./ruta-cache", () => ({
  obtenerRutaRecalculadaServidor: mocks.ruta,
  RutaNoDisponibleError: class extends Error {},
}));
import { resolverRutaSolicitudServidor } from "./ruta-solicitud-servidor";
import { RutaNoDisponibleError } from "./ruta-cache";
const datos = {
  origenCalle: "Reforma", origenNumero: "100", origenColonia: "Juárez", origenCodigoPostal: "06600", origenCiudad: "CDMX", origenEstado: "CDMX",
  destinoCalle: "Constitución", destinoNumero: "200", destinoColonia: "Centro", destinoCodigoPostal: "64000", destinoCiudad: "Monterrey", destinoEstado: "Nuevo León",
  paradas: [{ calle: "Escala", numero: "1", colonia: "Centro", codigoPostal: "76000", ciudad: "Querétaro", estado: "Querétaro", lat: 0, lng: 0 }],
} as unknown as SolicitudTrasladoValidada;
describe("coordenadas autoritativas del servidor", () => {
  beforeEach(() => { vi.stubEnv("MAPBOX_SECRET_TOKEN", "test-token"); mocks.ruta.mockResolvedValue({ distanciaKm: 900, tiempoEstimadoHoras: 10, fuente: "mapbox" }); });
  afterEach(() => vi.restoreAllMocks());
  it("geocodifica los domicilios completos e ignora coordenadas declaradas de paradas", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    for (const coords of [[-99.13, 19.43], [-100.3, 20.59], [-100.31, 25.68]]) {
      fetchMock.mockResolvedValueOnce(Response.json({ features: [{ geometry: { coordinates: coords } }] }));
    }
    const resultado = await resolverRutaSolicitudServidor(datos);
    expect(resultado.paradasCoords).toEqual([{ lng: -100.3, lat: 20.59 }]);
    expect(mocks.ruta).toHaveBeenCalledWith({ lat: 19.43, lng: -99.13 }, { lat: 25.68, lng: -100.31 }, [{ lat: 20.59, lng: -100.3 }]);
    expect(fetchMock.mock.calls[0][0].toString()).toContain("Reforma");
    expect(fetchMock.mock.calls[0][0].toString()).toContain("06600");
  });
  it("no inventa coordenadas si una dirección no se resuelve", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ features: [] }));
    await expect(resolverRutaSolicitudServidor(datos)).rejects.toBeInstanceOf(RutaNoDisponibleError);
  });
});
