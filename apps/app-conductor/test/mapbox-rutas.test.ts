import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const originalEnv = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

describe("mapbox-rutas.ts", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalEnv;
    vi.restoreAllMocks();
  });

  describe("tieneMapboxConfigurado", () => {
    it("retorna true cuando hay token configurado", async () => {
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "pk.test123";
      const { tieneMapboxConfigurado } = await import("../src/lib/mapbox-rutas");
      expect(tieneMapboxConfigurado()).toBe(true);
    });

    it("retorna false cuando no hay token", async () => {
      delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const { tieneMapboxConfigurado } = await import("../src/lib/mapbox-rutas");
      expect(tieneMapboxConfigurado()).toBe(false);
    });

    it("retorna false cuando el token es string vacío", async () => {
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "";
      const { tieneMapboxConfigurado } = await import("../src/lib/mapbox-rutas");
      expect(tieneMapboxConfigurado()).toBe(false);
    });
  });

  describe("construirUrlMapaRutaOrigen", () => {
    it("retorna null cuando no hay token", async () => {
      delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const { construirUrlMapaRutaOrigen } = await import("../src/lib/mapbox-rutas");
      const resultado = await construirUrlMapaRutaOrigen(
        { lat: 19.4326, lng: -99.1332 },
        null
      );
      expect(resultado).toBeNull();
    });

    it("genera URL válida con token y solo destino", async () => {
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "pk.test123";
      const { construirUrlMapaRutaOrigen } = await import("../src/lib/mapbox-rutas");
      const url = await construirUrlMapaRutaOrigen(
        { lat: 19.4326, lng: -99.1332 },
        null,
        { ancho: 600, alto: 260 }
      );
      expect(url).not.toBeNull();
      expect(url).toContain("api.mapbox.com");
      expect(url).toContain("access_token=");
      expect(url).toContain("pin-s-b");
    });

    it("incluye pin de origen cuando se proporciona origenConductor", async () => {
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "pk.test123";
      const { construirUrlMapaRutaOrigen } = await import("../src/lib/mapbox-rutas");
      const url = await construirUrlMapaRutaOrigen(
        { lat: 19.44, lng: -99.12 },
        { lat: 19.4326, lng: -99.1332 },
        { ancho: 800, alto: 400 }
      );
      expect(url).not.toBeNull();
      expect(url).toContain("pin-s-a");
      expect(url).toContain("pin-s-b");
      expect(url).toContain("800x400");
    });
  });

  describe("construirUrlMapaRutaConduccion", () => {
    it("retorna null cuando no hay token", async () => {
      delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const { construirUrlMapaRutaConduccion } = await import("../src/lib/mapbox-rutas");
      const resultado = await construirUrlMapaRutaConduccion(
        { lat: 19.4326, lng: -99.1332 },
        { lat: 19.5, lng: -99.2 },
        null
      );
      expect(resultado).toBeNull();
    });

    it("genera URL válida con token, destino y ubicación actual", async () => {
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "pk.test123";
      const { construirUrlMapaRutaConduccion } = await import("../src/lib/mapbox-rutas");
      const url = await construirUrlMapaRutaConduccion(
        { lat: 19.4326, lng: -99.1332 },
        { lat: 19.5, lng: -99.2 },
        { lat: 19.45, lng: -99.15 },
        { ancho: 700, alto: 300 }
      );
      expect(url).not.toBeNull();
      expect(url).toContain("api.mapbox.com");
      expect(url).toContain("access_token=");
      expect(url).toContain("pin-s-car");
      expect(url).toContain("700x300");
    });
  });
});
