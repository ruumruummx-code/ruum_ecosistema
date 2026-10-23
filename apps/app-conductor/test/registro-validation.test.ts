import { describe, expect, it } from "vitest";
import {
  esCurpValida,
  formatoLicenciaMask,
  formatoTelefonoMask,
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
});
