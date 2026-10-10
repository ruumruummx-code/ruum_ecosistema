import { describe, expect, it, vi, beforeEach } from "vitest";

/* Implementación real: `esNativo` viene de `../capacitor` (hoja sobre
   `@capacitor/core`) y la posición nativa de `@capacitor/geolocation`. Ambos se
   mockean con el especificador que consume este fichero, así que llegan a la
   implementación. Estos casos vivían en
   `apps/app-usuario/src/lib/ubicacion.test.ts`, donde los mocks apuntaban a la
   fachada de la app y nunca alcanzaban este módulo. */
const mockEsNativo = vi.fn();

vi.mock("../capacitor", () => ({
  esNativo: () => mockEsNativo(),
  plataformaActual: () => "web",
}));

const mockRequestPermissions = vi.fn();
const mockGetCurrentPosition = vi.fn();

vi.mock("@capacitor/geolocation", () => ({
  Geolocation: {
    requestPermissions: (...a: unknown[]) => mockRequestPermissions(...a),
    getCurrentPosition: (...a: unknown[]) => mockGetCurrentPosition(...a),
  },
}));

import { obtenerUbicacionActual } from "./index";

describe("obtenerUbicacionActual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("con soloNativo en web devuelve null sin pedir permiso", async () => {
    mockEsNativo.mockReturnValue(false);
    expect(await obtenerUbicacionActual({ soloNativo: true })).toBeNull();
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it("solicita permiso y retorna coordenadas si granted", async () => {
    mockEsNativo.mockReturnValue(true);
    mockRequestPermissions.mockResolvedValue({ location: "granted" });
    mockGetCurrentPosition.mockResolvedValue({
      coords: { latitude: 19.4326, longitude: -99.1332, accuracy: 8, speed: null },
    });
    const res = await obtenerUbicacionActual({ soloNativo: true });
    expect(res).toMatchObject({ lat: 19.4326, lng: -99.1332 });
  });

  it("retorna null si permiso denied", async () => {
    mockEsNativo.mockReturnValue(true);
    mockRequestPermissions.mockResolvedValue({ location: "denied" });
    expect(await obtenerUbicacionActual({ soloNativo: true })).toBeNull();
    expect(mockGetCurrentPosition).not.toHaveBeenCalled();
  });

  it("retorna null si getCurrentPosition lanza", async () => {
    mockEsNativo.mockReturnValue(true);
    mockRequestPermissions.mockResolvedValue({ location: "granted" });
    mockGetCurrentPosition.mockRejectedValue(new Error("gps off"));
    expect(await obtenerUbicacionActual({ soloNativo: true })).toBeNull();
  });

  it("sin soloNativo en web usa navigator.geolocation", async () => {
    mockEsNativo.mockReturnValue(false);
    const getCurrentPosition = vi.fn((ok: (p: unknown) => void) =>
      ok({ coords: { latitude: 19.4326, longitude: -99.1332, accuracy: 8 } })
    );
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    try {
      const res = await obtenerUbicacionActual();
      expect(res).toMatchObject({ lat: 19.4326, lng: -99.1332 });
      expect(mockRequestPermissions).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
