import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const resetPasswordForEmailMock = vi.fn();

vi.mock("@ruum/api/supabase", () => ({
  crearClienteServidor: vi.fn(() => ({
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmailMock(...args),
    },
  })),
}));

const rateLimitMock = vi.fn();
vi.mock("@/lib/csp-rate-limit", () => ({
  obtenerIp: vi.fn(() => "187.190.1.50"), // IP simulada de red mexicana
  rateLimitConVentana: (...args: unknown[]) => rateLimitMock(...args),
}));

const verificarCsrfMock = vi.fn();
vi.mock("@/lib/csrf", () => ({
  verificarCsrfORechazar: (...args: unknown[]) => verificarCsrfMock(...args),
}));

const captchaMock = vi.fn();
vi.mock("@/lib/recovery-policy", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/recovery-policy")>();
  return {
    ...mod,
    verificarCaptchaRecovery: (...args: unknown[]) => captchaMock(...args),
  };
});

import { POST } from "./route";

describe("POST /api/recovery/request (RUUM-USR-F4-001)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    verificarCsrfMock.mockReturnValue(null); // CSRF válido
    rateLimitMock.mockResolvedValue({ allowed: true, restantes: 10 });
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
    captchaMock.mockResolvedValue({ aprobado: true, configurado: false, proveedorCaido: false });
  });

  it("rechaza peticiones con CSRF inválido", async () => {
    const { NextResponse } = await import("next/server");
    verificarCsrfMock.mockReturnValueOnce(
      NextResponse.json({ error: "CSRF inválido." }, { status: 403 })
    );

    const req = new NextRequest("https://app.ruum.mx/api/recovery/request", {
      method: "POST",
      body: JSON.stringify({ email: "test@ruum.mx" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("rechaza peticiones con correo inválido o vacío", async () => {
    const req = new NextRequest("https://app.ruum.mx/api/recovery/request", {
      method: "POST",
      body: JSON.stringify({ email: "invalido" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Escribe un correo válido");
  });

  it("aplica rate limit con clave compuesta (IP + email + dispositivo)", async () => {
    rateLimitMock.mockResolvedValueOnce({ allowed: false, retryAfterSec: 45, restantes: 0 });

    const req = new NextRequest("https://app.ruum.mx/api/recovery/request", {
      method: "POST",
      headers: { "x-device-id": "dev-unique-123" },
      body: JSON.stringify({ email: "usuario@ruum.mx" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("45");
    const body = await res.json();
    expect(body.error).toContain("Ya enviamos un enlace hace unos momentos");
  });

  it("exige CAPTCHA adaptativo cuando el riesgo indica restantes <= 1", async () => {
    // Simular que a la dimensión de email le queda 0 restantes (riesgo alto)
    rateLimitMock
      .mockResolvedValueOnce({ allowed: true, restantes: 10 }) // IP
      .mockResolvedValueOnce({ allowed: true, restantes: 1 }) // Email (riesgo <= 1)
      .mockResolvedValueOnce({ allowed: true, restantes: 4 }); // Dispositivo

    captchaMock.mockResolvedValueOnce({ aprobado: false, configurado: true, proveedorCaido: false });

    const req = new NextRequest("https://app.ruum.mx/api/recovery/request", {
      method: "POST",
      body: JSON.stringify({ email: "usuario@ruum.mx" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(428); // Precondition Required
    const body = await res.json();
    expect(body.captchaRequerido).toBe(true);
  });

  it("procesa la solicitud exitosamente e invoca GoTrue en el servidor", async () => {
    const req = new NextRequest("https://app.ruum.mx/api/recovery/request", {
      method: "POST",
      body: JSON.stringify({ email: "cliente@ruum.mx" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
      "cliente@ruum.mx",
      expect.objectContaining({
        redirectTo: "https://app.ruum.mx/auth/callback?type=recovery&next=/nueva-password",
      })
    );
  });

  it("devuelve respuesta neutra incluso si GoTrue reporta fallo no rate-limit (evita user enumeration)", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({ error: { message: "User not found" } });

    const req = new NextRequest("https://app.ruum.mx/api/recovery/request", {
      method: "POST",
      body: JSON.stringify({ email: "inexistente@ruum.mx" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
