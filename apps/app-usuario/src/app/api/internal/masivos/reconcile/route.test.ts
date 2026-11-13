vi.mock("server-only", () => ({}));
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  reclamar: vi.fn(),
  registrarPago: vi.fn(),
  confirmarPago: vi.fn(),
  marcarCheckpoint: vi.fn(),
  stripeMasivo: vi.fn(),
  cliente: vi.fn(),
}));

vi.mock("@/lib/carga-masiva-server", () => ({
  clienteMasivoServicio: () => mocks.cliente(),
  stripeMasivo: mocks.stripeMasivo,
}));

vi.mock("@ruum/api/services", () => ({
  reclamarCheckpointsCheckoutMasivoServidor: mocks.reclamar,
  registrarCheckoutPagoConfirmadoServidor: mocks.registrarPago,
  confirmarPagoMasivoServidor: mocks.confirmarPago,
  marcarCheckpointCheckoutMasivoServidor: mocks.marcarCheckpoint,
}));

import { GET } from "./route";

describe("GET /api/internal/masivos/reconcile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("MASIVOS_RECONCILIADOR_SECRET", "secreto_reconciliador_super_seguro_123");
    mocks.cliente.mockReturnValue({});
  });

  it("falla cerrado con 401 si MASIVOS_RECONCILIADOR_SECRET no está configurado", async () => {
    vi.stubEnv("MASIVOS_RECONCILIADOR_SECRET", "");
    const req = new NextRequest("http://localhost/api/internal/masivos/reconcile", {
      headers: { authorization: "Bearer secreto_reconciliador_super_seguro_123" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("No autorizado");
    expect(mocks.reclamar).not.toHaveBeenCalled();
  });

  it("falla cerrado con 401 si el token Authorization no coincide con el secreto", async () => {
    const req = new NextRequest("http://localhost/api/internal/masivos/reconcile", {
      headers: { authorization: "Bearer token_incorrecto" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(mocks.reclamar).not.toHaveBeenCalled();
  });

  it("reconcilia exitosamente un pago confirmado con Stripe y marca completado", async () => {
    mocks.reclamar.mockResolvedValueOnce([
      {
        checkout_id: "chk_001",
        intent_id: "pi_stripe_001",
        intentos: 1,
      },
    ]);
    mocks.stripeMasivo.mockResolvedValueOnce({
      id: "pi_stripe_001",
      status: "succeeded",
      currency: "mxn",
      amount_received: 450000,
    });

    const req = new NextRequest("http://localhost/api/internal/masivos/reconcile", {
      headers: { authorization: "Bearer secreto_reconciliador_super_seguro_123" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ reclamados: 1, confirmados: 1, fallidos: 0 });

    expect(mocks.registrarPago).toHaveBeenCalledWith(
      expect.anything(),
      "chk_001",
      "pi_stripe_001"
    );
    expect(mocks.confirmarPago).toHaveBeenCalledWith(
      expect.anything(),
      "chk_001",
      "pi_stripe_001",
      450000,
      "mxn"
    );
    expect(mocks.marcarCheckpoint).toHaveBeenCalledWith(
      expect.anything(),
      "chk_001",
      "completado"
    );
  });

  it("escala a error_permanente sin reintento infinito tras 5 intentos fallidos", async () => {
    mocks.reclamar.mockResolvedValueOnce([
      {
        checkout_id: "chk_002",
        intent_id: "pi_stripe_002",
        intentos: 5, // Límite de 5 intentos alcanzado
      },
    ]);
    mocks.stripeMasivo.mockRejectedValueOnce(new Error("Conexión intermitente con Stripe"));

    const req = new NextRequest("http://localhost/api/internal/masivos/reconcile", {
      headers: { authorization: "Bearer secreto_reconciliador_super_seguro_123" },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toEqual({ reclamados: 1, confirmados: 0, fallidos: 1 });

    // Debe escalar a error_permanente y disponible_en debe ser undefined (detener reintentos)
    expect(mocks.marcarCheckpoint).toHaveBeenCalledWith(
      expect.anything(),
      "chk_002",
      "error_permanente",
      "Conexión intermitente con Stripe",
      undefined
    );
  });

  it("escala a error_permanente de inmediato ante discrepancia de moneda o importe", async () => {
    mocks.reclamar.mockResolvedValueOnce([
      {
        checkout_id: "chk_003",
        intent_id: "pi_stripe_003",
        intentos: 1,
      },
    ]);
    // Moneda en USD en lugar de mxn
    mocks.stripeMasivo.mockResolvedValueOnce({
      id: "pi_stripe_003",
      status: "succeeded",
      currency: "usd",
      amount_received: 450000,
    });

    const req = new NextRequest("http://localhost/api/internal/masivos/reconcile", {
      headers: { authorization: "Bearer secreto_reconciliador_super_seguro_123" },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);

    // Debe escalar a error_permanente sin reintentar
    expect(mocks.marcarCheckpoint).toHaveBeenCalledWith(
      expect.anything(),
      "chk_003",
      "error_permanente",
      "stripe_amount_or_currency_invalid",
      undefined
    );
  });
});
