import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { MAX_BYTES_GEOCODE, MAX_PARES_GEOCODE } from "./schema";

const mockGetUser = vi.fn();
const mockFetch = vi.fn();
const mockRutaMapbox = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/csp-rate-limit", () => ({
  obtenerIp: vi.fn(() => "127.0.0.1"),
  rateLimitConVentana: vi.fn(async () => ({ allowed: true })),
}));

vi.mock("@ruum/shared/utils", () => ({
  obtenerRutaDirectionsMapboxConParadas: (...args: unknown[]) => mockRutaMapbox(...args),
}));

describe("POST /api/viajes/masivos/geocode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "sk.mock_mapbox_token");
    mockGetUser.mockResolvedValue({ data: { user: { id: "usuario-123" } } });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ features: [{ center: [-99.16, 19.38] }] }),
    });
    vi.stubGlobal("fetch", mockFetch);
    mockRutaMapbox.mockResolvedValue({ distanciaKm: 15.2, tiempoHoras: 0.4 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function req(body: unknown, headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost/api/viajes/masivos/geocode", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json", ...headers },
    });
  }

  it("rechaza si no hay sesión activa → 401", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("./route");
    const res = await POST(req({ pares: [{ origenCP: "03100", destinoCP: "06600", indice: 0 }] }));
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockRutaMapbox).not.toHaveBeenCalled();
  });

  describe("Validación de tamaño del request (413)", () => {
    it("devuelve 413 cuando la cabecera Content-Length excede el límite permitido sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const res = await POST(
        req({ pares: [{ origenCP: "03100", destinoCP: "06600", indice: 0 }] }, {
          "content-length": String(MAX_BYTES_GEOCODE + 1),
        })
      );
      expect(res.status).toBe(413);
      const json = await res.json() as { error: string };
      expect(json.error).toMatch(/grande|excede/i);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRutaMapbox).not.toHaveBeenCalled();
    });

    it("devuelve 413 cuando el cuerpo del request excede MAX_BYTES_GEOCODE sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const hugePadding = "x".repeat(MAX_BYTES_GEOCODE + 10);
      const res = await POST(req(`{"pares":[],"padding":"${hugePadding}"}`));
      expect(res.status).toBe(413);
      const json = await res.json() as { error: string };
      expect(json.error).toMatch(/grande|excede/i);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRutaMapbox).not.toHaveBeenCalled();
    });
  });

  describe("Validación Zod de payloads inválidos (400)", () => {
    it("devuelve 400 ante un cuerpo no JSON sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const res = await POST(req("esto no es un json valido"));
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRutaMapbox).not.toHaveBeenCalled();
    });

    it("devuelve 400 si falta el campo pares sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const res = await POST(req({}));
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRutaMapbox).not.toHaveBeenCalled();
    });

    it("devuelve 400 si pares es un array vacío sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const res = await POST(req({ pares: [] }));
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRutaMapbox).not.toHaveBeenCalled();
    });

    it("devuelve 400 si pares excede la cantidad máxima (101 pares) sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const paresExcesivos = Array.from({ length: MAX_PARES_GEOCODE + 1 }, (_, i) => ({
        origenCP: "03100",
        destinoCP: "06600",
        indice: i,
      }));
      const res = await POST(req({ pares: paresExcesivos }));
      expect(res.status).toBe(400);
      const json = await res.json() as { error: string; detalles?: string[] };
      expect(json.error).toMatch(/inválido/i);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRutaMapbox).not.toHaveBeenCalled();
    });

    it("devuelve 400 si origenCP no tiene 5 dígitos numéricos sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const casosCP = ["123", "1234", "123456", "abcde", "0310a", ""];
      for (const cp of casosCP) {
        mockFetch.mockClear();
        mockRutaMapbox.mockClear();
        const res = await POST(req({ pares: [{ origenCP: cp, destinoCP: "06600", indice: 0 }] }));
        expect(res.status).toBe(400);
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockRutaMapbox).not.toHaveBeenCalled();
      }
    });

    it("devuelve 400 si destinoCP no tiene 5 dígitos numéricos sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const casosCP = ["123", "123456", "xyz99", ""];
      for (const cp of casosCP) {
        mockFetch.mockClear();
        mockRutaMapbox.mockClear();
        const res = await POST(req({ pares: [{ origenCP: "03100", destinoCP: cp, indice: 0 }] }));
        expect(res.status).toBe(400);
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockRutaMapbox).not.toHaveBeenCalled();
      }
    });

    it("devuelve 400 si el índice es negativo sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const res = await POST(req({ pares: [{ origenCP: "03100", destinoCP: "06600", indice: -1 }] }));
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRutaMapbox).not.toHaveBeenCalled();
    });

    it("devuelve 400 si el índice no es entero sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const res = await POST(req({ pares: [{ origenCP: "03100", destinoCP: "06600", indice: 1.5 }] }));
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRutaMapbox).not.toHaveBeenCalled();
    });

    it("devuelve 400 si el índice no es numérico sin llamar a Mapbox", async () => {
      const { POST } = await import("./route");
      const res = await POST(req({ pares: [{ origenCP: "03100", destinoCP: "06600", indice: "0" as unknown as number }] }));
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRutaMapbox).not.toHaveBeenCalled();
    });
  });

  describe("Payloads válidos", () => {
    it("acepta payload válido y procesa geocodificación con Mapbox → 200", async () => {
      const { POST } = await import("./route");
      const res = await POST(
        req({
          pares: [
            { origenCP: "03100", destinoCP: "06600", indice: 0 },
            { origenCP: "01000", destinoCP: "04360", indice: 1 },
          ],
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json() as { rutas: Array<{ indice: number; distanciaKm: number | null }> };
      expect(json.rutas).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalled();
      expect(mockRutaMapbox).toHaveBeenCalled();
    });
  });

  it("GET no permitido → 405", async () => {
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
