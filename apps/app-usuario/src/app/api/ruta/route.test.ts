import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { __clearCspRateLimitForTest } from "@/lib/csp-rate-limit";

function reqRuta(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/ruta", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers }
  });
}

describe("POST /api/ruta — Mapbox server proxy", () => {
  beforeEach(() => {
    __clearCspRateLimitForTest();
    vi.restoreAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "usr_autenticado_test" } },
      error: null,
    });
  });

  it("GET devuelve 405 método no permitido", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("POST");
  });

  it("rechaza peticiones sin sesión activa con 401 (RUUM-SEC-006 / F0.2)", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("No session"),
    });

    const res = await POST(reqRuta({ origen: { lat: 19.42, lng: -99.16 }, destino: { lat: 19.38, lng: -99.16 } }));
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/Inicia sesión/i);
  });

  it("rechaza payload sin coordenadas válidas con 400", async () => {
    const res = await POST(reqRuta({}));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/coordenadas/i);
  });

  it("rechaza coordenadas no numéricas o fuera de rango", async () => {
    const res = await POST(
      reqRuta({
        origen: { lat: 999, lng: -99.13 },
        destino: { lat: 19.42, lng: -99.16 }
      })
    );
    expect(res.status).toBe(400);
  });

  it("aplica rate limit tras 10 peticiones por minuto por usuario autenticado (RUUM-SEC-006 / F0.2)", async () => {
    // Enviamos peticiones que fallen validación para consumir el bucket del rate limiter
    for (let i = 0; i < 10; i++) {
      const res = await POST(reqRuta({}));
      expect(res.status).toBe(400); // Pasó autenticación y rate limiter, falló validación
    }

    const bloqueada = await POST(reqRuta({}));
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.headers.get("Retry-After")).toBeTruthy();
    const json = (await bloqueada.json()) as { error: string };
    expect(json.error).toMatch(/demasiadas solicitudes/i);
  });
});
