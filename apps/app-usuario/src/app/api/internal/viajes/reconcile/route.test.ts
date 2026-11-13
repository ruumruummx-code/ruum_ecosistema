vi.mock("server-only", () => ({}));
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockReconciliar = vi.fn();

vi.mock("@/lib/supabase-servicio", () => ({
  crearClienteServicio: vi.fn(() => ({})),
}));

vi.mock("@ruum/api/services", () => ({
  reconciliarSagaTrasladosIndividualesServidor: (...args: unknown[]) => mockReconciliar(...args),
}));

describe("GET /api/internal/viajes/reconcile — Reconciliador y compensador de saga F6", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret-f6";
  });

  function req(authHeader?: string) {
    const headers: Record<string, string> = {};
    if (authHeader) headers["authorization"] = authHeader;
    return new NextRequest("http://localhost/api/internal/viajes/reconcile", {
      method: "GET",
      headers,
    });
  }

  it("rechaza sin autorización o con secreto erróneo → 401", async () => {
    const { GET } = await import("./route");
    const resSinAuth = await GET(req());
    expect(resSinAuth.status).toBe(401);

    const resMalo = await GET(req("Bearer bad-secret"));
    expect(resMalo.status).toBe(401);
    expect(mockReconciliar).not.toHaveBeenCalled();
  });

  it("ejecuta reconciliación con autorización válida → 200 y métricas", async () => {
    mockReconciliar.mockResolvedValueOnce({
      confirmados: 2,
      compensados: 3,
      errores: 0,
    });

    const { GET } = await import("./route");
    const res = await GET(req("Bearer test-secret-f6"));
    expect(res.status).toBe(200);

    const json = await res.json() as { ok: boolean; confirmados: number; compensados: number; errores: number };
    expect(json.ok).toBe(true);
    expect(json.confirmados).toBe(2);
    expect(json.compensados).toBe(3);
    expect(json.errores).toBe(0);
    expect(mockReconciliar).toHaveBeenCalledWith(expect.anything(), 50);
  });

  it("señala los errores por fila para que el scheduler pueda alertar", async () => {
    mockReconciliar.mockResolvedValueOnce({ confirmados: 1, compensados: 0, errores: 1 });
    const { GET } = await import("./route");
    const res = await GET(req("Bearer test-secret-f6"));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ ok: false, confirmados: 1, errores: 1 });
  });

  it("retorna 500 si el reconciliador falla en base de datos", async () => {
    mockReconciliar.mockRejectedValueOnce(new Error("Timeout en bloqueo FOR UPDATE SKIP LOCKED"));

    const { GET } = await import("./route");
    const res = await GET(req("Bearer test-secret-f6"));
    expect(res.status).toBe(500);

    const json = await res.json() as { ok: boolean; error: string };
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Error de reconciliación");
  });
});
