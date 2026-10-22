import { describe, expect, it } from "vitest";
import {
  compararEnTiempoConstante,
  COOKIE_ROL_APP,
  firmarRolApp,
  TTL_ROL_APP_SEGUNDOS,
  verificarRolAppFirmado
} from "./cookie-rol";

const SECRETO = "secreto-de-prueba-con-mas-de-32-caracteres-123";
const OTRO_SECRETO = "otro-secreto-de-prueba-con-mas-de-32-caracteres-456";
const AHORA = Date.UTC(2026, 9, 21, 12, 0, 0);

describe("cookie firmada de rol (app-conductor)", () => {
  it("expone nombre de cookie y TTL corto", () => {
    expect(COOKIE_ROL_APP).toBe("ruum_rol_app");
    expect(TTL_ROL_APP_SEGUNDOS).toBe(300);
  });

  it("firma y verifica el rol con la misma firma", async () => {
    const valor = await firmarRolApp("conductor", "auth-1", SECRETO, 300, AHORA);

    await expect(verificarRolAppFirmado(valor, SECRETO, AHORA)).resolves.toEqual({
      rol: "conductor",
      authUserId: "auth-1",
      expiraEn: Math.floor(AHORA / 1000) + 300
    });
  });

  it("rechaza un valor manipulado", async () => {
    const valor = await firmarRolApp("conductor", "auth-1", SECRETO, 300, AHORA);
    const partes = valor.split(".");
    const payloadAlterado = Buffer.from(JSON.stringify({ r: "usuario", u: "auth-1", e: 9999999999 })).toString("base64url");

    await expect(verificarRolAppFirmado(`${payloadAlterado}.${partes[1]}`, SECRETO, AHORA)).resolves.toBeNull();
    await expect(verificarRolAppFirmado(valor.replace(".", "."), OTRO_SECRETO, AHORA)).resolves.toBeNull();
  });

  it("rechaza una firma hecha con otro secreto", async () => {
    const valor = await firmarRolApp("conductor", "auth-1", OTRO_SECRETO, 300, AHORA);

    await expect(verificarRolAppFirmado(valor, SECRETO, AHORA)).resolves.toBeNull();
  });

  it("caduca pasado el TTL", async () => {
    const valor = await firmarRolApp("conductor", "auth-1", SECRETO, 300, AHORA);

    await expect(verificarRolAppFirmado(valor, SECRETO, AHORA + 299_000)).resolves.not.toBeNull();
    await expect(verificarRolAppFirmado(valor, SECRETO, AHORA + 301_000)).resolves.toBeNull();
  });

  it("rechaza valores malformados y secretos débiles", async () => {
    await expect(verificarRolAppFirmado(undefined, SECRETO, AHORA)).resolves.toBeNull();
    await expect(verificarRolAppFirmado("abc", SECRETO, AHORA)).resolves.toBeNull();
    await expect(verificarRolAppFirmado("a.b", "corto", AHORA)).resolves.toBeNull();
    await expect(firmarRolApp("conductor", "auth-1", "corto")).rejects.toThrow();
  });

  it("rechaza roles fuera del catálogo", async () => {
    const payload = Buffer.from(JSON.stringify({ r: "admin", u: "auth-1", e: 9999999999 })).toString("base64url");
    const valor = `${payload}.firma-invalida`;

    await expect(verificarRolAppFirmado(valor, SECRETO, AHORA)).resolves.toBeNull();
  });

  it("la comparación en tiempo constante rechaza longitudes distintas", () => {
    expect(compararEnTiempoConstante("abc", "abc")).toBe(true);
    expect(compararEnTiempoConstante("abc", "abd")).toBe(false);
    expect(compararEnTiempoConstante("abc", "abcd")).toBe(false);
  });
});
