import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  generarTokenTelefono,
  validarTokenTelefono,
  tieneTwilioVerifyConfigurado,
  enviarCodigoTwilioVerify,
  verificarCodigoTwilioVerify,
} from "./phone-verification";

describe("phone-verification — generación y validación de tokens HMAC", () => {
  it("genera un token con formato valido de 3 segmentos", () => {
    const token = generarTokenTelefono("5512345678");
    const partes = token.split(":");
    expect(partes).toHaveLength(3);
    expect(partes[0]).toBe("5512345678");
    expect(Number(partes[1])).toBeGreaterThan(0);
    expect(partes[2]).toHaveLength(64); // SHA-256 hex digest
  });

  it("valida correctamente un token generado para el mismo telefono", () => {
    const tel = "5512345678";
    const token = generarTokenTelefono(tel);
    const resultado = validarTokenTelefono(tel, token);
    expect(resultado.valido).toBe(true);
    expect(resultado.error).toBeUndefined();
  });

  it("rechaza tokens para un telefono diferente", () => {
    const token = generarTokenTelefono("5512345678");
    const resultado = validarTokenTelefono("5587654321", token);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toMatch(/no corresponde al teléfono/i);
  });

  it("rechaza tokens alterados o con firma invalida", () => {
    const token = generarTokenTelefono("5512345678");
    const alterado = token.slice(0, -4) + "abcd";
    const resultado = validarTokenTelefono("5512345678", alterado);
    expect(resultado.valido).toBe(false);
  });

  it("rechaza tokens expirados", () => {
    const tel = "5512345678";
    const token = generarTokenTelefono(tel);
    // Simular expiración de 16 minutos atrás con maxEdadMs = 1000
    const resultado = validarTokenTelefono(tel, token, -1000);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toMatch(/ha expirado/i);
  });

  it("rechaza valores nulos o cadenas malformadas", () => {
    expect(validarTokenTelefono("5512345678", null).valido).toBe(false);
    expect(validarTokenTelefono("5512345678", "").valido).toBe(false);
    expect(validarTokenTelefono("5512345678", "invalido").valido).toBe(false);
  });
});

describe("phone-verification — integración Twilio Verify y mock dev", () => {
  const envOriginal = { ...process.env };

  beforeEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_VERIFY_SERVICE_SID;
  });

  afterEach(() => {
    process.env = { ...envOriginal };
    vi.restoreAllMocks();
  });

  it("identifica correctamente si Twilio esta configurado o no", () => {
    expect(tieneTwilioVerifyConfigurado()).toBe(false);

    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "token123";
    process.env.TWILIO_VERIFY_SERVICE_SID = "VA123";
    expect(tieneTwilioVerifyConfigurado()).toBe(true);
  });

  it("modo mock: envia codigo y valida exitosamente con 123456", async () => {
    const envio = await enviarCodigoTwilioVerify("5512345678");
    expect(envio.ok).toBe(true);
    expect(envio.mock).toBe(true);
    expect(envio.status).toBe("pending");

    const verificacionValida = await verificarCodigoTwilioVerify("5512345678", "123456");
    expect(verificacionValida.ok).toBe(true);
    expect(verificacionValida.status).toBe("approved");

    const verificacionInvalida = await verificarCodigoTwilioVerify("5512345678", "000000");
    expect(verificacionInvalida.ok).toBe(false);
    expect(verificacionInvalida.status).toBe("failed");
  });

  it("modo Twilio configurado: llama al API de Twilio Verify v2 para envio", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "tokentest";
    process.env.TWILIO_VERIFY_SERVICE_SID = "VAtest";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "pending" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await enviarCodigoTwilioVerify("5512345678");
    expect(resultado.ok).toBe(true);
    expect(resultado.status).toBe("pending");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://verify.twilio.com/v2/Services/VAtest/Verifications",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      })
    );
  });

  it("modo Twilio configurado: llama a VerificationChecks", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "tokentest";
    process.env.TWILIO_VERIFY_SERVICE_SID = "VAtest";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "approved" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await verificarCodigoTwilioVerify("5512345678", "654321");
    expect(resultado.ok).toBe(true);
    expect(resultado.status).toBe("approved");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://verify.twilio.com/v2/Services/VAtest/VerificationChecks",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
