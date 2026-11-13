import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
const functionsInvokeMock = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: vi.fn(async () => ({
    auth: {
      getUser: (...args: unknown[]) => getUserMock(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => functionsInvokeMock(...args),
    },
  })),
}));

const rateLimitMock = vi.fn();
vi.mock("@/lib/csp-rate-limit", () => ({
  obtenerIp: vi.fn(() => "201.168.10.45"),
  rateLimitConVentana: (...args: unknown[]) => rateLimitMock(...args),
}));

const verificarCsrfMock = vi.fn();
vi.mock("@/lib/csrf", () => ({
  verificarCsrfORechazar: (...args: unknown[]) => verificarCsrfMock(...args),
}));

import { POST } from "./route";

describe("POST /api/verificacion/didit/iniciar (RUUM-USR-F5-001)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verificarCsrfMock.mockReturnValue(null);
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-uuid-123" } },
      error: null,
    });
    rateLimitMock.mockResolvedValue({ allowed: true, restantes: 3 });
    functionsInvokeMock.mockResolvedValue({
      data: {
        url: "https://verify.didit.me/session/ses-test-123",
        sessionId: "ses-test-123",
      },
      error: null,
    });
  });

  it("rechaza peticiones con CSRF inválido", async () => {
    const { NextResponse } = await import("next/server");
    verificarCsrfMock.mockReturnValueOnce(
      NextResponse.json({ error: "CSRF inválido." }, { status: 403 })
    );

    const req = new NextRequest("http://localhost/api/verificacion/didit/iniciar", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "CSRF inválido." });
  });

  it("rechaza usuarios sin sesión activa con 401", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "sin sesion" },
    });

    const req = new NextRequest("http://localhost/api/verificacion/didit/iniciar", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("aplica rate limit con clave compuesta durable (IP + cuenta + dispositivo)", async () => {
    rateLimitMock
      .mockResolvedValueOnce({ allowed: true, restantes: 14 }) // IP
      .mockResolvedValueOnce({ allowed: false, retryAfterSec: 900, restantes: 0 }) // Cuenta agotada
      .mockResolvedValueOnce({ allowed: true, restantes: 4 }); // Dispositivo

    const req = new NextRequest("http://localhost/api/verificacion/didit/iniciar", {
      method: "POST",
      headers: { "x-device-id": "device-browser-777" },
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("900");
    const json = await res.json();
    expect(json.error).toContain("Has alcanzado el límite de intentos");
    expect(functionsInvokeMock).not.toHaveBeenCalled();
  });

  it("genera sesión Didit exitosamente y devuelve URL y sessionId", async () => {
    const req = new NextRequest("http://localhost/api/verificacion/didit/iniciar", {
      method: "POST",
      headers: { "x-device-id": "device-browser-777" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      url: "https://verify.didit.me/session/ses-test-123",
      sessionId: "ses-test-123",
    });
    expect(functionsInvokeMock).toHaveBeenCalledWith(
      "iniciar-verificacion-didit",
      { body: { tipo: "usuario" } }
    );
  });

  it("devuelve 502 cuando la Edge Function falla", async () => {
    functionsInvokeMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Didit API rate limited" },
    });

    const req = new NextRequest("http://localhost/api/verificacion/didit/iniciar", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Didit API rate limited");
  });
});
