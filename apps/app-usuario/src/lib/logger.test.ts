import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  construirPayloadLog,
  logStructuredError,
  logStructuredInfo,
  logStructuredWarn,
} from "./logger";

describe("logger estructurado de @ruum/app-usuario", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("construye payload estructurado con metadatos de Error, código y status", () => {
    const err = Object.assign(new Error("Fallo en pasarela"), {
      code: "STRIPE_TIMEOUT",
      status: 504,
    });
    err.name = "GatewayTimeoutError";

    const payload = construirPayloadLog(
      "api/viajes/masivos/estado",
      "conciliacion_pago_fallida",
      "error",
      err,
      { cargaId: "carga-123", usuarioId: "usr-456" },
    );

    expect(payload).toEqual(
      expect.objectContaining({
        scope: "api/viajes/masivos/estado",
        event: "conciliacion_pago_fallida",
        level: "error",
        errorName: "GatewayTimeoutError",
        message: "Fallo en pasarela",
        code: "STRIPE_TIMEOUT",
        status: 504,
        cargaId: "carga-123",
        usuarioId: "usr-456",
        timestamp: expect.any(String),
      }),
    );
  });

  it("sanitiza claves sensibles y redacta JWT/Bearer/secretos en el contexto y en el error", () => {
    const err = new Error(
      "Token inválido Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc",
    );

    const payload = construirPayloadLog(
      "auth/callback",
      "set_recovery_cookie_fallido",
      "warn",
      err,
      {
        password: "ClaveSecretaNoDebeSalir",
        token: "tok-secreto",
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig",
        cvv: "999",
        rutaDestino: "/nueva-password",
      },
    );

    expect(payload).not.toHaveProperty("password");
    expect(payload).not.toHaveProperty("token");
    expect(payload).not.toHaveProperty("jwt");
    expect(payload).not.toHaveProperty("cvv");
    expect(payload.message).toBe("[REDACTED_SECRET]");
    expect(payload.rutaDestino).toBe("/nueva-password");
  });

  it("emite console.info, console.warn y console.error con prefijo canónico [app-usuario:<scope>]", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logStructuredInfo("cotizador", "tarifa_calculada", { distanciaKm: 24.5 });
    logStructuredWarn(
      "api/ruta",
      "sesion_lectura_omitida",
      { name: "CookieError", message: "Sin cookie", code: "NO_COOKIE", status: 401 },
      { ip: "198.51.100.1" },
    );
    logStructuredError(
      "cuenta",
      "cerrar_sesion_fallido",
      "Error de red",
      { reintentos: 1 },
    );

    expect(infoSpy).toHaveBeenCalledWith(
      "[app-usuario:cotizador] tarifa_calculada",
      expect.objectContaining({
        scope: "cotizador",
        event: "tarifa_calculada",
        level: "info",
        distanciaKm: 24.5,
      }),
    );

    expect(warnSpy).toHaveBeenCalledWith(
      "[app-usuario:api/ruta] sesion_lectura_omitida",
      expect.objectContaining({
        scope: "api/ruta",
        event: "sesion_lectura_omitida",
        level: "warn",
        errorName: "CookieError",
        message: "Sin cookie",
        code: "NO_COOKIE",
        status: 401,
        ip: "198.51.100.1",
      }),
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "[app-usuario:cuenta] cerrar_sesion_fallido",
      expect.objectContaining({
        scope: "cuenta",
        event: "cerrar_sesion_fallido",
        level: "error",
        message: "Error de red",
        reintentos: 1,
      }),
    );
  });
});
