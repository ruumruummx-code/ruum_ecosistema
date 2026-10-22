import { describe, expect, it } from "vitest";
import { CATALOGO_BANCOS_SPEI } from "../src/app/cuenta/datos-bancarios/bank-catalog";

describe("catálogo de bancos SPEI", () => {
  it("detecta los bancos principales por clave SPEI", () => {
    expect(CATALOGO_BANCOS_SPEI["002"]).toBe("Citibanamex");
    expect(CATALOGO_BANCOS_SPEI["012"]).toBe("BBVA México");
    expect(CATALOGO_BANCOS_SPEI["014"]).toBe("Santander");
    expect(CATALOGO_BANCOS_SPEI["072"]).toBe("Banorte");
    expect(CATALOGO_BANCOS_SPEI["646"]).toBe("STP (Sistema de Transferencias y Pagos)");
  });

  it("usa claves de tres dígitos y nombres no vacíos", () => {
    const claves = Object.keys(CATALOGO_BANCOS_SPEI);
    expect(claves.length).toBeGreaterThan(10);
    for (const clave of claves) {
      expect(clave).toMatch(/^\d{3}$/);
      expect(CATALOGO_BANCOS_SPEI[clave].trim().length).toBeGreaterThan(0);
    }
  });

  it("devuelve undefined para una clave desconocida", () => {
    expect(CATALOGO_BANCOS_SPEI["999"]).toBeUndefined();
  });
});
