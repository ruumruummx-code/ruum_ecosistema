import { describe, expect, it } from "vitest";
import { esEmailLoginValido, validarCredencialesLogin } from "../src/app/login/login-validation";

describe("validación de acceso del conductor", () => {
  it("acepta correos válidos y rechaza formato incompleto o espacios", () => {
    expect(esEmailLoginValido("chofer@ruum.mx")).toBe(true);
    expect(esEmailLoginValido("chofer@ruum")).toBe(false);
    expect(esEmailLoginValido(" chofer@ruum.mx")).toBe(false);
  });

  it("requiere correo válido y contraseña antes de autenticar", () => {
    expect(validarCredencialesLogin("correo-invalido", "secreta")).toBe("email");
    expect(validarCredencialesLogin("chofer@ruum.mx", "")).toBe("password");
    expect(validarCredencialesLogin("chofer@ruum.mx", "secreta")).toBeNull();
  });
});
