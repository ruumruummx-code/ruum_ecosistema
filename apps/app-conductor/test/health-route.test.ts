import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingleMock = vi.fn();
const limitMock = vi.fn(() => ({
  maybeSingle: maybeSingleMock,
}));
const selectMock = vi.fn(() => ({
  limit: limitMock,
}));
const fromMock = vi.fn(() => ({
  select: selectMock,
}));

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: vi.fn(async () => ({
    from: fromMock,
  })),
}));

describe("GET /api/health (Tarea 6: Refactor Seguro del Endpoint de Salud)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("retorna HTTP 200 y status ok cuando Supabase responde correctamente en tiempo", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: { id: "123" }, error: null });

    const { GET } = await import("../src/app/api/health/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.checks.supabase.status).toBe("ok");
    expect(data.checks.supabase.error).toBeNull();
    expect(typeof data.latencyMs).toBe("number");
  });

  it("retorna HTTP 503 y mensaje genérico cuando la consulta a Supabase retorna error", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Internal Postgres crash or secret connection details" },
    });

    const { GET } = await import("../src/app/api/health/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("down");
    expect(data.checks.supabase.status).toBe("down");
    expect(data.checks.supabase.error).toBe("Servicio no disponible");
    // Verifica que no se filtre información interna
    const rawJson = JSON.stringify(data);
    expect(rawJson).not.toContain("Postgres crash");
    expect(rawJson).not.toContain("secret");
  });

  it("retorna HTTP 503 sin filtrar excepciones de red como 'TypeError: fetch failed'", async () => {
    maybeSingleMock.mockRejectedValueOnce(new TypeError("fetch failed: connect ECONNREFUSED 127.0.0.1:5432"));

    const { GET } = await import("../src/app/api/health/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("down");
    expect(data.checks.supabase.status).toBe("down");
    expect(data.checks.supabase.error).toBe("Servicio no disponible");

    // Prohibido filtrar excepciones de red hacia el cliente
    const rawJson = JSON.stringify(data);
    expect(rawJson).not.toContain("fetch failed");
    expect(rawJson).not.toContain("TypeError");
    expect(rawJson).not.toContain("ECONNREFUSED");
  });

  it("retorna HTTP 503 cuando la consulta excede el timeout de 3 segundos", async () => {
    vi.useFakeTimers();

    // Consulta que no responde inmediatamente
    maybeSingleMock.mockImplementationOnce(() => new Promise(() => {}));

    const { GET } = await import("../src/app/api/health/route");
    const responsePromise = GET();

    // Avanzar reloj 3000ms para disparar el timeout síncrono estricto
    await vi.advanceTimersByTimeAsync(3000);

    const response = await responsePromise;
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("down");
    expect(data.checks.supabase.status).toBe("down");
    expect(data.checks.supabase.error).toBe("Servicio no disponible");

    vi.useRealTimers();
  });

  it("retorna HTTP 503 si faltan las credenciales de Supabase en el entorno", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { GET } = await import("../src/app/api/health/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("down");
    expect(data.checks.supabase.status).toBe("down");
    expect(data.checks.supabase.error).toBe("Servicio no disponible");
  });
});
