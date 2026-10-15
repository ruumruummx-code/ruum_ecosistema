import { beforeEach, describe, expect, it, vi } from "vitest";
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
  });

  it("GET devuelve 405 método no permitido", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("POST");
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

  it("aplica rate limit tras 20 peticiones por minuto por IP/usuario", async () => {
    const headers = { "x-forwarded-for": "198.51.100.99" };
    // Enviamos peticiones que fallen validación para consumir el bucket del rate limiter
    for (let i = 0; i < 20; i++) {
      const res = await POST(reqRuta({}, headers));
      expect(res.status).toBe(400); // Pasó el rate limiter, falló validación
    }

    const bloqueada = await POST(reqRuta({}, headers));
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.headers.get("Retry-After")).toBeTruthy();
    const json = (await bloqueada.json()) as { error: string };
    expect(json.error).toMatch(/demasiadas solicitudes/i);
  });
});
