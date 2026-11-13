import { describe, expect, it, vi, beforeEach } from "vitest";

/* `src/lib/ubicacion` es una fachada: la implementación vive en
   `@ruum/api/ubicacion` (fuente única). Este test verifica el CONTRATO de la
   fachada —que delega siempre con `soloNativo: true`, el comportamiento legacy
   de app-usuario— mockeando `@ruum/api/ubicacion` por el mismo especificador
   que consume la fachada.

   Antes se mockeaba `./capacitor` y `@capacitor/geolocation` desde aquí, que
   resuelven a módulos distintos de los que usa la implementación: los mocks no
   llegaban y los casos que esperaban `null` pasaban por la razón equivocada.
   La lógica de permisos nativos se testea en
   `packages/api/src/ubicacion/index.test.ts`, donde reside. */
const mockObtenerUbicacionCompartida = vi.fn();

vi.mock("@ruum/api/ubicacion", () => ({
  obtenerUbicacionActual: (...args: unknown[]) => mockObtenerUbicacionCompartida(...args),
}));

describe("ubicacion — fachada de app-usuario (R7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delega siempre con soloNativo: true", async () => {
    mockObtenerUbicacionCompartida.mockResolvedValue(null);
    const { obtenerUbicacionActual } = await import("./ubicacion");
    await obtenerUbicacionActual();
    expect(mockObtenerUbicacionCompartida).toHaveBeenCalledWith({ soloNativo: true });
  });

  it("en web devuelve null sin pedir permiso de geolocalización", async () => {
    mockObtenerUbicacionCompartida.mockResolvedValue(null);
    const { obtenerUbicacionActual } = await import("./ubicacion");
    expect(await obtenerUbicacionActual()).toBeNull();
  });

  it("propaga las coordenadas que devuelve la implementación compartida", async () => {
    mockObtenerUbicacionCompartida.mockResolvedValue({
      lat: 19.4326,
      lng: -99.1332,
      precisionM: null,
      velocidadMps: null,
    });
    const { obtenerUbicacionActual } = await import("./ubicacion");
    const res = await obtenerUbicacionActual();
    expect(res).toMatchObject({ lat: 19.4326, lng: -99.1332 });
  });
});
