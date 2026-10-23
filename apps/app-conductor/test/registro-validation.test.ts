import { describe, expect, it } from "vitest";
import {
  calcularCursorTelefono,
  esCurpValida,
  formatoCurpMask,
  formatoFechaIsoParcial,
  formatoLicenciaMask,
  formatoTelefonoNacional,
  formatoTelefonoMask,
  limpiarTexto,
  objetoJson,
  soloAlfanumericoMayusculas,
  soloDigitos,
  telefonoE164Mx,
} from "../src/app/registro/registration-validation";

describe("validación y normalización del registro de conductor", () => {
  it("normaliza el teléfono para mostrarlo y enviarlo a autenticación", () => {
    expect(formatoTelefonoMask("5512345678")).toBe("(55) 1234-5678");
    expect(telefonoE164Mx("55 1234-5678")).toBe("+525512345678");
    expect(telefonoE164Mx("")).toBe("");
  });

  it("limpia y limita el número de licencia mostrado", () => {
    expect(formatoLicenciaMask("ab-1234567890123")).toBe("AB12 3456 7890");
  });

  it("acepta CURP de 18 caracteres alfanuméricos y rechaza valores incompletos", () => {
    expect(esCurpValida("GOMC900101HDFRRL09")).toBe(true);
    expect(esCurpValida("GOMC900101")).toBe(false);
    expect(esCurpValida("GOMC900101HDFRRL0!")).toBe(false);
  });

  it("normaliza valores de texto, dígitos y CURP con límites", () => {
    expect(objetoJson({ nombre: "Ana" })).toEqual({ nombre: "Ana" });
    expect(objetoJson(["no", "objeto"])).toEqual({});
    expect(objetoJson(null)).toEqual({});
    expect(soloDigitos("+52 (55) 1234-5678", 4)).toBe("5255");
    expect(soloAlfanumericoMayusculas("ab-cd 123456789", 6)).toBe("ABCD12");
    expect(formatoCurpMask("gomc-900101hdfrrl09-extra")).toBe("GOMC900101HDFRRL09");
  });

  it("formatea teléfono nacional en sus tramos parciales y completos", () => {
    expect(formatoTelefonoNacional("")).toBe("");
    expect(formatoTelefonoNacional("5")).toBe("(5");
    expect(formatoTelefonoNacional("55123")).toBe("(55) 123");
    expect(formatoTelefonoNacional("5512345678")).toBe("(55) 1234-5678");
  });

  it("mantiene la posición del cursor al borrar o insertar dígitos", () => {
    expect(calcularCursorTelefono("5512", "551", 4)).toBe(3);
    expect(calcularCursorTelefono("551", "5512", 3)).toBe(4);
  });

  it("enmascara licencia y fecha ISO parcial y limpia espacios", () => {
    expect(formatoLicenciaMask("AB12")).toBe("AB12");
    expect(formatoLicenciaMask("AB123456")).toBe("AB12 3456");
    expect(formatoFechaIsoParcial("20261")).toBe("2026-1");
    expect(formatoFechaIsoParcial("2026102")).toBe("2026-10-2");
    expect(formatoFechaIsoParcial("20261024resto")).toBe("2026-10-24");
    expect(limpiarTexto("  Ana   María  López ")).toBe("Ana María López");
  });
});
