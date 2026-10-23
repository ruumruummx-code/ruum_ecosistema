import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const cookieSetMock = vi.fn();
const cookieDeleteMock = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: (...args: unknown[]) => cookieSetMock(...args),
    delete: (...args: unknown[]) => cookieDeleteMock(...args),
  })),
}));

const getUserMock = vi.fn();
const exchangeCodeForSessionMock = vi.fn();
const verifyOtpMock = vi.fn();

vi.mock("@ruum/api/supabase", () => ({
  crearClienteServidor: vi.fn((_url: string, _key: string, opts: { setAll: (c: Array<{ name: string; value: string; options: Record<string, unknown> }>) => void }) => {
    opts.setAll([{ name: "sb-token", value: "val", options: {} }]);
    return {
      auth: {
        getUser: (...args: unknown[]) => getUserMock(...args),
        exchangeCodeForSession: (...args: unknown[]) => exchangeCodeForSessionMock(...args),
        verifyOtp: (...args: unknown[]) => verifyOtpMock(...args),
      },
    };
  }),
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("redirige a error cuando falta configuración de Supabase", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;

    const req = new NextRequest("https://app.ruum.mx/auth/callback?type=recovery&code=123");
    const res = await GET(req);
    expect(res.headers.get("location")).toContain("/recuperar-password?error=enlace_invalido");
  });

  it("intercambia code en flujo recovery y detecta cambio de cuenta previa", async () => {
    getUserMock
      .mockResolvedValueOnce({ data: { user: { id: "u-previo", email: "previo@ruum.mx" } } })
      .mockResolvedValueOnce({ data: { user: { id: "u-nuevo", email: "nuevo@ruum.mx" } } })
      .mockResolvedValueOnce({ data: { user: { id: "u-nuevo", email: "nuevo@ruum.mx" } } });
    exchangeCodeForSessionMock.mockResolvedValueOnce({ error: null });

    const req = new NextRequest("https://app.ruum.mx/auth/callback?code=pkce-code&type=recovery");
    const res = await GET(req);
    expect(res.headers.get("location")).toContain("/nueva-password?cuenta_distinta=1");
    expect(cookieSetMock).toHaveBeenCalled();
  });

  it("clasifica errores de code expirado, otro dispositivo y reutilizado", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    exchangeCodeForSessionMock.mockResolvedValueOnce({ error: { message: "Token has expired", code: "otp_expired" } });
    const res1 = await GET(new NextRequest("https://app.ruum.mx/auth/callback?code=bad&type=recovery"));
    expect(res1.headers.get("location")).toContain("causa=expirado");

    exchangeCodeForSessionMock.mockResolvedValueOnce({ error: { message: "PKCE code_verifier missing" } });
    const res2 = await GET(new NextRequest("https://app.ruum.mx/auth/callback?code=bad&type=signup"));
    expect(res2.headers.get("location")).toContain("causa=otro_dispositivo");

    exchangeCodeForSessionMock.mockResolvedValueOnce({ error: { message: "Token already used" } });
    const res3 = await GET(new NextRequest("https://app.ruum.mx/auth/callback?code=bad&type=magiclink"));
    expect(res3.headers.get("location")).toContain("causa=reutilizado");
  });

  it("procesa token_hash con verifyOtp tanto en éxito como en error y sirve HTML fallback con nonce", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u-1", email: "u@ruum.mx" } } });
    verifyOtpMock.mockResolvedValueOnce({ error: null });

    const resOk = await GET(new NextRequest("https://app.ruum.mx/auth/callback?token_hash=th-1&type=email&next=/mis-viajes"));
    expect(resOk.headers.get("location")).toBe("https://app.ruum.mx/mis-viajes");

    verifyOtpMock.mockResolvedValueOnce({ error: { message: "otp expired" } });
    const resErr = await GET(new NextRequest("https://app.ruum.mx/auth/callback?token_hash=th-2&type=recovery"));
    expect(resErr.headers.get("location")).toContain("/recuperar-password?error=enlace_invalido&causa=expirado");

    const reqHtml = new NextRequest("https://app.ruum.mx/auth/callback", {
      headers: { "x-nonce": "nonce-seguro-123" },
    });
    const resHtml = await GET(reqHtml);
    expect(resHtml.headers.get("content-type")).toContain("text/html");
    const html = await resHtml.text();
    expect(html).toContain('nonce="nonce-seguro-123"');
  });
});
