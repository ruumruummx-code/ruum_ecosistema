import { describe, expect, it } from "vitest";
import { CATALOGO_FISCAL_SAT, consultarCatalogosSat, validarSeleccionFiscalSat } from "./sat";

describe("catálogos SAT CFDI 4.0", () => {
  it("conserva las 19 y 24 claves de la publicación oficial y su trazabilidad", () => {
    const catalogo = consultarCatalogosSat({ fecha: "2026-10-16" });
    expect(catalogo.regimenes).toHaveLength(19);
    expect(catalogo.usos).toHaveLength(24);
    expect(catalogo.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(catalogo.usos.map(o => o.clave)).toEqual(expect.arrayContaining(["CP01", "CN01", "S01"]));
    for (const uso of CATALOGO_FISCAL_SAT.usos) {
      expect(uso.regimenes.every(clave => catalogo.regimenes.some(o => o.clave === clave))).toBe(true);
    }
  });
  it("busca por clave, descripción sin acentos y alias RESICO", () => {
    expect(consultarCatalogosSat({ busqueda: "626" }).regimenes.map(o => o.clave)).toEqual(["626"]);
    expect(consultarCatalogosSat({ busqueda: "resico" }).regimenes.map(o => o.clave)).toEqual(["626"]);
    expect(consultarCatalogosSat({ busqueda: "medicos" }).usos.map(o => o.clave)).toEqual(["D01", "D02", "D07"]);
  });
  it("filtra y valida régimen, tipo de persona y vigencia", () => {
    expect(consultarCatalogosSat({ regimen: "605" }).usos.map(o => o.clave)).toContain("CN01");
    expect(consultarCatalogosSat({ regimen: "626" }).usos.map(o => o.clave)).not.toContain("D01");
    expect(validarSeleccionFiscalSat("601", "G03", "ABC010101AB1")).toBeNull();
    expect(validarSeleccionFiscalSat("605", "D01", "ABCD010101AB1")).toBeNull();
    expect(validarSeleccionFiscalSat("601", "D01", "ABC010101AB1")).toBeTruthy();
    expect(validarSeleccionFiscalSat("601", "G03", "ABCD010101AB1")).toBeTruthy();
    expect(validarSeleccionFiscalSat("999", "G03", "ABC010101AB1")).toBeTruthy();
    expect(consultarCatalogosSat({ fecha: "2021-12-31" }).regimenes).toHaveLength(0);
  });
});
