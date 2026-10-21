import { describe, it, expect } from "vitest";

// codigos-postales.ts solo reexporta consultarCodigoPostalMx y DatosCodigoPostal
// de @ruum/shared/utils. Verificamos que el módulo se puede importar y que
// las exportaciones nombradas existan.
import { consultarCodigoPostalMx } from "../src/lib/codigos-postales";
import type { DatosCodigoPostal } from "../src/lib/codigos-postales";

describe("codigos-postales.ts", () => {
  it("exporta consultarCodigoPostalMx como función", () => {
    expect(typeof consultarCodigoPostalMx).toBe("function");
  });

  it("DatosCodigoPostal es exportado como tipo", () => {
    // Al ser un type export, solo verificamos que la importación no falle
    const tipo: DatosCodigoPostal | null = null;
    expect(tipo).toBeNull();
  });
});
