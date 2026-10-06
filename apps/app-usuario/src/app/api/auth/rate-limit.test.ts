import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as resend } from "./resend/route";
import { POST as verifyOtp } from "./verify-otp/route";
import { __clearCspRateLimitForTest } from "@/lib/csp-rate-limit";

function req(body: unknown, ip = "203.0.113.10"): NextRequest {
  return new NextRequest("http://localhost/api/auth/resend", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });
}

describe("POST /api/auth/* — rate limit y validacion", () => {
  it("rechaza email invalido sin tocar Supabase", async () => {
    __clearCspRateLimitForTest();
    const res = await resend(req({ email: "no-es-correo" }));
    expect(res.status).toBe(400);
  });

  it("rechaza cuerpo no-JSON", async () => {
    __clearCspRateLimitForTest();
    const r = new NextRequest("http://localhost/api/auth/resend", { method: "POST", body: "{roto" });
    const res = await resend(r);
    expect(res.status).toBe(400);
  });

  it("verify-otp exige codigo de 6 digitos", async () => {
    __clearCspRateLimitForTest();
    const res = await verifyOtp(req({ email: "a@b.com", codigo: "123" }));
    expect(res.status).toBe(400);
  });

  it("limita por IP: 11a llamada en la ventana devuelve 429", async () => {
    __clearCspRateLimitForTest();
    // 10 permitidas por IP/hora; la 11 debe rebotar.
    for (let i = 0; i < 10; i += 1) {
      const res = await resend(req({ email: `user${i}@ejemplo.com` }, "198.51.100.5"));
      expect(res.status).not.toBe(429);
    }
    const excedido = await resend(req({ email: "user10@ejemplo.com" }, "198.51.100.5"));
    expect(excedido.status).toBe(429);
    expect(excedido.headers.get("Retry-After")).toBeTruthy();
  });

  it("los contadores no se mezclan entre IPs distintas", async () => {
    __clearCspRateLimitForTest();
    for (let i = 0; i < 10; i += 1) {
      await resend(req({ email: `a${i}@ejemplo.com` }, "198.51.100.6"));
    }
    const otra = await resend(req({ email: "otro@ejemplo.com" }, "198.51.100.7"));
    expect(otra.status).not.toBe(429);
  });

  it("verify-otp limita por correo con un umbral mas estricto", async () => {
    __clearCspRateLimitForTest();
    // 5 intentos por correo/15min: el 6o rebota.
    for (let i = 0; i < 5; i += 1) {
      const res = await verifyOtp(req({ email: "objetivo@ejemplo.com", codigo: "000000" }, "203.0.113.99"));
      expect(res.status).not.toBe(429);
    }
    const sexto = await verifyOtp(req({ email: "objetivo@ejemplo.com", codigo: "000001" }, "203.0.113.99"));
    expect(sexto.status).toBe(429);
  });
});