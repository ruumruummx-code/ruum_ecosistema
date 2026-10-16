/** @vitest-environment jsdom */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  calcularRutaMapbox,
  calcularRutaMapboxConParadas,
  geocodificarDireccion,
} from "@/lib/mapbox";
import { useGeocodificacion } from "./useGeocodificacion";

vi.mock("@/lib/mapbox", () => ({
  calcularRutaMapbox: vi.fn(async () => ({
    distanciaKm: 4.8,
    tiempoEstimadoHoras: 14 / 60,
  })),
  calcularRutaMapboxConParadas: vi.fn(async () => ({
    distanciaKm: 6,
    tiempoEstimadoHoras: 0.5,
  })),
  geocodificarDireccion: vi.fn(async () => ({ lat: 19.5, lng: -99.2 })),
}));
describe("ruta confirmada en mapa", () => {
  it("usa ambos pines confirmados sin sustituirlos por geocodificación de texto", async () => {
    vi.clearAllMocks();
    const { result } = renderHook(() => useGeocodificacion());
    const origen = { lat: 19.4, lng: -99.1 };
    const destino = { lat: 19.45, lng: -99.15 };
    const ruta = await result.current.geocodificarRuta(
      "Origen",
      "Destino",
      origen,
      undefined,
      destino,
    );
    expect(calcularRutaMapbox).toHaveBeenCalledWith(origen, destino, undefined);
    expect(geocodificarDireccion).not.toHaveBeenCalled();
    expect(ruta).toMatchObject({
      destinoLat: 19.45,
      destinoLng: -99.15,
      distanciaKm: 4.8,
      incompletas: false,
    });
    await result.current.geocodificarRutaConParadas(
      "Origen",
      "Destino",
      ["Escala"],
      origen,
      undefined,
      destino,
    );
    expect(calcularRutaMapboxConParadas).toHaveBeenCalledWith(
      origen,
      destino,
      [{ lat: 19.5, lng: -99.2 }],
      undefined,
    );
    expect(geocodificarDireccion).toHaveBeenCalledTimes(1);
  });
});
