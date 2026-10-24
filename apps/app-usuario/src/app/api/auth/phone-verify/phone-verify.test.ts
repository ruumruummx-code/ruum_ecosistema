import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as postSend } from "./send/route";
import { POST as postVerify } from "./verify/route";
import { validarTokenTelefono } from "@/lib/phone-verification";
import { __clearCspRateLimitForTest } from "@/lib/csp-rate-limit";

const TEST_SECRET = "secreto-para-tests-con-mas-de-32-caracteres-longitud-segura";

beforeEach(() => {
  __clearCspRateLimitForTest();
  process.env.PHONE_VERIFY_SECRET = TEST_SECRET;
});

function reqSend(telefono: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/auth/phone-verify/send", {
    method: "POST",
    body: JSON.stringify({ telefono }),
    headers: { "content-type": "application/json", ...headers },
  });
}

function reqVerify(telefono: unknown, codigo: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/auth/phone-verify/verify", {
    method: "POST",
    body: JSON.stringify({ telefono, codigo }),
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("POST /api/auth/phone-verify/send", () => {
  it("rechaza si el teléfono no tiene 10 dígitos", async () => {
    const res = await postSend(reqSend("55123"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/10 dígitos/i);
  });

  it("envía código exitosamente con 10 dígitos (en modo mock dev)", async () => {
    const res = await postSend(reqSend("5512345678"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; status: string; mock: boolean };
    expect(json.ok).toBe(true);
    expect(json.status).toBe("pending");
  });

  it("aplica rate limit por número de teléfono tras 3 intentos en 15m", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await postSend(reqSend("5511223344"));
      expect(res.status).toBe(200);
    }
    const excedido = await postSend(reqSend("5511223344"));
    expect(excedido.status).toBe(429);
    expect(excedido.headers.get("Retry-After")).toBeTruthy();
  });
});

describe("POST /api/auth/phone-verify/verify", () => {
  it("rechaza si el código no tiene 6 dígitos", async () => {
    const res = await postVerify(reqVerify("5512345678", "123"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/6 dígitos/i);
  });

  it("rechaza código incorrecto", async () => {
    const res = await postVerify(reqVerify("5512345678", "999999"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/incorrecto/i);
  });

  it("emite token firmado válido con código 123456 en mock dev", async () => {
    const res = await postVerify(reqVerify("5512345678", "123456"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; token: string; telefono: string };
    expect(json.ok).toBe(true);
    expect(json.telefono).toBe("5512345678");
    expect(json.token).toBeTruthy();

    // Comprobar que el token es criptográficamente válido
    const validacion = validarTokenTelefono("5512345678", json.token);
    expect(validacion.valido).toBe(true);
  });

  it("aplica rate limit por IP tras 15 intentos fallidos", async () => {
    const headers = { "x-forwarded-for": "198.51.100.42" };
    for (let i = 0; i < 15; i++) {
      const res = await postVerify(reqVerify(`550000000${i % 10}`, "000000", headers));
      expect(res.status).toBe(400);
    }
    const excedido = await postVerify(reqVerify("5599999999", "000000", headers));
    expect(excedido.status).toBe(429);
    const json = (await excedido.json()) as { error: string };
    expect(json.error).toMatch(/red/i);
  });
});

describe("flujo Twilio Verify real (HTTP simulado)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("envía SMS y canjea el OTP por un token de registro usando las rutas oficiales", async () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "ACtest");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "tokentest");
    vi.stubEnv("TWILIO_VERIFY_SERVICE_SID", "VAtest");
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const body = new URLSearchParams(String(init?.body));
      expect(body.get("To")).toBe("+525512345678");
      if (url === "https://verify.twilio.com/v2/Services/VAtest/Verifications") {
        expect(body.get("Channel")).toBe("sms");
        return Response.json({ status: "pending" });
      }
      if (url === "https://verify.twilio.com/v2/Services/VAtest/VerificationCheck") {
        expect(body.get("Code")).toBe("654321");
        return Response.json({ status: "approved" });
      }
      // Una ruta inexistente devuelve el mismo error que motivó esta regresión.
      return Response.json({ code: 20404 }, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const envio = await postSend(reqSend("5512345678"));
    expect(envio.status).toBe(200);
    expect(await envio.json()).toMatchObject({ ok: true, mock: false });

    const verificacion = await postVerify(reqVerify("5512345678", "654321"));
    expect(verificacion.status).toBe(200);
    const resultado = await verificacion.json();
    expect(resultado).toMatchObject({ ok: true, status: "approved" });
    expect(validarTokenTelefono("5512345678", resultado.token).valido).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("modo mock solo fuera de producción", () => {
  const OLD_SID = process.env.TWILIO_ACCOUNT_SID;
  const OLD_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const OLD_SERVICE = process.env.TWILIO_VERIFY_SERVICE_SID;

  beforeEach(() => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.stubEnv("TWILIO_VERIFY_SERVICE_SID", "");
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (OLD_SID !== undefined) process.env.TWILIO_ACCOUNT_SID = OLD_SID;
    if (OLD_TOKEN !== undefined) process.env.TWILIO_AUTH_TOKEN = OLD_TOKEN;
    if (OLD_SERVICE !== undefined) process.env.TWILIO_VERIFY_SERVICE_SID = OLD_SERVICE;
  });

  it("send falla cerrado en producción sin Twilio (sin mock)", async () => {
    const { enviarCodigoTwilioVerify } = await import("@/lib/phone-verification");
    const res = await enviarCodigoTwilioVerify("5512345678");
    expect(res.ok).toBe(false);
  });

  it("verify rechaza 123456 en producción sin Twilio (sin mock)", async () => {
    const { verificarCodigoTwilioVerify } = await import("@/lib/phone-verification");
    const res = await verificarCodigoTwilioVerify("5512345678", "123456");
    expect(res.ok).toBe(false);
    expect(res.status).not.toBe("approved");
  });
});
