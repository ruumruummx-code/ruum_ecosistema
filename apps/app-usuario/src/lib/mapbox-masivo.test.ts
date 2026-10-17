import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { coordenadaPostalMasiva, ErrorServicioCotizacion } from "./mapbox-masivo";
afterEach(() => vi.unstubAllGlobals());
it("distingue un token inválido de un error del vehículo o CP", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
  await expect(coordenadaPostalMasiva("06700", "prueba")).rejects.toBeInstanceOf(ErrorServicioCotizacion);
  await expect(coordenadaPostalMasiva("06700", "prueba")).rejects.toThrow("servicio de mapas no está disponible");
});
it("conserva el cero inicial y reconoce un CP sin resultado", async () => {
  const consulta = vi.fn().mockResolvedValue(Response.json({ features: [] }));
  vi.stubGlobal("fetch", consulta);
  expect(await coordenadaPostalMasiva("06700", "prueba")).toBeNull();
  const url = new URL(consulta.mock.calls[0]![0] as string);
  expect(url.searchParams.get("q")).toBe("06700");
  expect(url.searchParams.get("autocomplete")).toBe("false");
});
