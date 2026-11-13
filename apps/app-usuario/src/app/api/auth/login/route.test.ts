import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  rateLimit: vi.fn(),
  obtenerIp: vi.fn(() => "203.0.113.10"),
  captcha: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));
vi.mock("@ruum/api/supabase", () => ({
  crearClienteServidor: vi.fn(() => ({ auth: { signInWithPassword: mocks.signIn } })),
}));
vi.mock("@/lib/csp-rate-limit", () => ({
  obtenerIp: mocks.obtenerIp,
  rateLimitConVentana: mocks.rateLimit,
}));
vi.mock("@/lib/csrf", () => ({ verificarCsrfORechazar: vi.fn(() => null) }));
vi.mock("@/lib/login-policy", () => ({
  hashIdentificador: vi.fn((value: string) => `hash:${value}`),
  LOGIN_LIMITES: { ip: 20, email: 8, dispositivo: 15 },
  LOGIN_VENTANA_MS: 900000,
  requiereCaptcha: vi.fn(() => false),
  verificarCaptchaAdaptativo: mocks.captcha,
}));

import { POST } from "./route";

function request(body: unknown) {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-device-id": "device-1" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mocks.rateLimit.mockResolvedValue({ allowed: true, restantes: 10 });
    mocks.obtenerIp.mockReturnValue("203.0.113.10");
    mocks.captcha.mockResolvedValue({ aprobado: true, configurado: true, proveedorCaido: false });
    mocks.signIn.mockResolvedValue({ data: { session: { access_token: "token" } }, error: null });
  });

  it("normaliza correo y autentica sin crear perfil", async () => {
    const response = await POST(request({ email: "  PERSONA@EJEMPLO.COM ", password: "secreta" }));
    expect(response.status).toBe(200);
    expect(mocks.signIn).toHaveBeenCalledWith({ email: "persona@ejemplo.com", password: "secreta" });
  });

  it("devuelve respuesta neutra ante credenciales rechazadas", async () => {
    mocks.signIn.mockResolvedValueOnce({ data: { session: null }, error: new Error("invalid") });
    const response = await POST(request({ email: "persona@ejemplo.com", password: "incorrecta" }));
    expect(response.status).toBe(401);
    expect((await response.json()).error).not.toMatch(/invalid|persona|incorrecta/i);
  });

  it("bloquea por cualquier dimensión del límite", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ allowed: false, restantes: 0, retryAfterSec: 47 });
    const response = await POST(request({ email: "persona@ejemplo.com", password: "secreta" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("47");
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("exige CAPTCHA adaptativo y no hace fallback inseguro", async () => {
    const policy = await import("@/lib/login-policy");
    vi.mocked(policy.requiereCaptcha).mockReturnValue(true);
    mocks.captcha.mockResolvedValueOnce({ aprobado: false, configurado: true, proveedorCaido: false });
    const response = await POST(request({ email: "persona@ejemplo.com", password: "secreta" }));
    expect(response.status).toBe(428);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("comunica degradación de Turnstile sin autenticar", async () => {
    const policy = await import("@/lib/login-policy");
    vi.mocked(policy.requiereCaptcha).mockReturnValue(true);
    mocks.captcha.mockResolvedValueOnce({ aprobado: false, configurado: true, proveedorCaido: true });
    const response = await POST(request({ email: "persona@ejemplo.com", password: "secreta" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect((await response.json()).captchaRequerido).toBe(true);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("permite identidades distintas detrás de la misma IP de CGNAT", async () => {
    const llamadas: string[] = [];
    mocks.rateLimit.mockImplementation(async (identificador: string | null) => {
      if (identificador) llamadas.push(identificador);
      return { allowed: true, restantes: 10 };
    });
    await POST(request({ email: "persona-uno@ejemplo.com", password: "secreta" }));
    await POST(request({ email: "persona-dos@ejemplo.com", password: "secreta" }));
    expect(mocks.signIn).toHaveBeenCalledTimes(2);
    expect(llamadas.filter((value) => value === "203.0.113.10")).toHaveLength(2);
    expect(new Set(llamadas.filter((value) => value.startsWith("hash:persona-"))).size).toBeGreaterThanOrEqual(2);
  });

  it("mantiene la política compuesta: una identidad agotada bloquea aunque la IP rote", async () => {
    mocks.obtenerIp.mockReturnValue("198.51.100.20");
    const resultados = [
      { allowed: true, restantes: 19 }, // IP rotada
      { allowed: false, restantes: 0, retryAfterSec: 90 }, // correo
      { allowed: true, restantes: 14 }, // dispositivo
    ];
    mocks.rateLimit.mockImplementation(async () => resultados.shift() ?? { allowed: true, restantes: 10 });
    const response = await POST(request({ email: "persona@ejemplo.com", password: "secreta" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("90");
    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(mocks.rateLimit).toHaveBeenCalledTimes(3);
  });

  it("falla cerrado con 429 y Retry-After si Redis no está disponible en producción (CA-4 / CB-2)", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ allowed: false, restantes: 0, retryAfterSec: 60 });
    const response = await POST(request({ email: "persona@ejemplo.com", password: "secreta" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("devuelve 503 con Retry-After sin almacenar contraseñas si Auth está caído (CB-1 / CA-2)", async () => {
    mocks.signIn.mockRejectedValueOnce(new Error("Conexión perdida con Supabase Auth"));
    const response = await POST(request({ email: "persona@ejemplo.com", password: "secreta" }));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("30");
    const json = await response.json();
    expect(json.error).toMatch(/servicio de acceso está temporalmente no disponible/i);
  });
});
