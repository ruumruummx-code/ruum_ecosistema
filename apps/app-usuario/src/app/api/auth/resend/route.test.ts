import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __clearCspRateLimitForTest } from "@/lib/csp-rate-limit";

const mockResend = vi.fn();
vi.mock("@ruum/api/supabase", () => ({
  crearClienteServidor: () => ({ auth: { resend: mockResend } }),
}));

import { POST } from "./route";

beforeEach(() => {
  __clearCspRateLimitForTest();
  mockResend.mockReset();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test";
});

function request() {
  return new NextRequest("https://usuario.example.com/api/auth/resend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "ana@example.com" }),
  });
}

describe("reenvío de confirmación — errores del proveedor", () => {
  it("solicita confirmación con callback al origen de la aplicación", async () => {
    mockResend.mockResolvedValue({ error: null });
    expect((await POST(request())).status).toBe(200);
    expect(mockResend).toHaveBeenCalledWith({
      type: "signup", email: "ana@example.com",
      options: { emailRedirectTo: "https://usuario.example.com/auth/callback?next=%2F" },
    });
  });

  it.each([
    { status: 500, code: "unexpected_failure" },
    { status: 422, code: "email_address_not_authorized" },
  ])("no anuncia éxito ante fallo de correo $code", async (error) => {
    mockResend.mockResolvedValue({ error });
    const res = await POST(request());
    expect(res.status).toBe(503);
    expect(await res.json()).not.toHaveProperty("ok");
  });

  it("comunica el límite de envíos de Supabase", async () => {
    mockResend.mockResolvedValue({ error: { status: 429, code: "over_email_send_rate_limit" } });
    expect((await POST(request())).status).toBe(429);
  });

  it("conserva una respuesta neutra cuando la cuenta no existe", async () => {
    mockResend.mockResolvedValue({ error: { status: 404, code: "user_not_found" } });
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
