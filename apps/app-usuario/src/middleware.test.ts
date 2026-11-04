import { describe, expect, it } from "vitest";
import { esRutaProtegidaUsuario } from "./middleware";

describe("RUUM-USR-F1-001 rutas públicas y protegidas", () => {
  it("protege /inicio y mantiene /soporte accesible sin sesión", () => {
    expect(esRutaProtegidaUsuario("/inicio")).toBe(true);
    expect(esRutaProtegidaUsuario("/inicio/cualquier-seccion")).toBe(true);
    expect(esRutaProtegidaUsuario("/soporte")).toBe(false);
    expect(esRutaProtegidaUsuario("/soporte/faq")).toBe(false);
    expect(esRutaProtegidaUsuario("/cuenta")).toBe(true);
  });
});
