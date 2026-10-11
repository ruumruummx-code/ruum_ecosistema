import { describe, expect, it } from "vitest";

// Sin NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN en el entorno de test, ambos módulos
// deben degradarse a nulos/recta en vez de lanzar (contrato offline).
import { tieneMapboxMasivosConfigurado, geocodificarDireccionMasiva, calcularRutaMasiva } from "./mapbox-masivos";
import { tieneMapboxConfigurado, obtenerRutaMapbox } from "./mapbox-rutas";

describe("mapbox — contrato degradado sin token", () => {
  it("reportan no configurado", () => {
    expect(tieneMapboxMasivosConfigurado()).toBe(false);
    expect(tieneMapboxConfigurado()).toBe(false);
  });

  it("geocodificación y rutas devuelven null sin red", async () => {
    await expect(geocodificarDireccionMasiva("Av Reforma 222")).resolves.toBeNull();
    await expect(geocodificarDireccionMasiva("   ")).resolves.toBeNull();
    await expect(calcularRutaMasiva(null, { lat: 19, lng: -99 })).resolves.toBeNull();
    await expect(calcularRutaMasiva({ lat: 19, lng: -99 }, null)).resolves.toBeNull();
  });

  it("obtenerRutaMapbox devuelve línea recta degradada", async () => {
    const r = await obtenerRutaMapbox([-99, 19], [-100, 20]);
    expect(r.degradada).toBe(true);
    expect(r.distanciaKm).toBeNull();
    expect(r.geometry).toEqual({ type: "LineString", coordinates: [[-99, 19], [-100, 20]] });
  });
});
