import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  obtener: vi.fn(),
  confirmar: vi.fn(),
  stripe: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-123" } } }) },
  }),
}));
vi.mock("@/lib/csp-rate-limit", () => ({
  rateLimitConVentana: async () => ({ allowed: true }),
}));
vi.mock("@/lib/carga-masiva-server", () => ({
  clienteMasivoServicio: () => ({}),
  stripeMasivo: mocks.stripe,
}));
vi.mock("@ruum/api/services", () => ({
  obtenerCheckoutMasivoServidor: mocks.obtener,
  confirmarPagoMasivoServidor: mocks.confirmar,
}));

import { GET } from "./route";

describe("GET /api/viajes/masivos/estado — Conciliación de pago masivo", () => {
  it("distingue un pago cobrado de una conciliación fallida sin pedir otro pago", async () => {
    mocks.obtener.mockResolvedValue({ id: "92200000-0000-4000-8000-000000000001", monto_centavos: 50000, stripe_payment_intent_id: "pi_cobrado" });
    mocks.stripe.mockResolvedValue({ id: "pi_cobrado", status: "succeeded", amount_received: 50000, currency: "mxn" });
    mocks.confirmar.mockRejectedValueOnce(new Error("vehiculos_transmision_check"));
    const respuesta = await GET(new NextRequest("http://localhost/api/viajes/masivos/estado?id=92200000-0000-4000-8000-000000000001"));
    expect(respuesta.status).toBe(202);
    expect(await respuesta.json()).toMatchObject({ pagado: false, cobrado: true, codigo: "PAGO_COBRADO_PENDIENTE_CONCILIACION" });
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna pagado: true con fuente: 'webhook' de inmediato sin invocar a Stripe si ya tiene pagado_en", async () => {
    mocks.obtener.mockResolvedValue({
      id: "92200000-0000-4000-8000-000000000001",
      auth_user_id: "user-123",
      monto_centavos: 350000,
      pagado_en: "2026-10-26T12:00:00Z",
      stripe_payment_intent_id: "pi_webhook_exito",
    });

    const req = new NextRequest("http://localhost/api/viajes/masivos/estado?id=92200000-0000-4000-8000-000000000001");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagado).toBe(true);
    expect(data.fuente).toBe("webhook");
    expect(mocks.stripe).not.toHaveBeenCalled();
    expect(mocks.confirmar).not.toHaveBeenCalled();
  });

  it("consulta a Stripe como fallback y concilia el pago si el webhook tardó", async () => {
    mocks.obtener.mockResolvedValue({
      id: "92200000-0000-4000-8000-000000000002",
      auth_user_id: "user-123",
      monto_centavos: 250000,
      pagado_en: null,
      stripe_payment_intent_id: "pi_fallback_exito",
    });
    mocks.stripe.mockResolvedValue({
      id: "pi_fallback_exito",
      status: "succeeded",
      amount_received: 250000,
      currency: "mxn",
    });
    mocks.confirmar.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost/api/viajes/masivos/estado?id=92200000-0000-4000-8000-000000000002");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagado).toBe(true);
    expect(data.fuente).toBe("fallback_stripe");
    expect(mocks.stripe).toHaveBeenCalledTimes(1);
    expect(mocks.confirmar).toHaveBeenCalledWith(
      expect.anything(),
      "92200000-0000-4000-8000-000000000002",
      "pi_fallback_exito",
      250000,
      "mxn"
    );
  });

  it("retorna pagado: false si el PaymentIntent en Stripe no ha sido completado", async () => {
    mocks.obtener.mockResolvedValue({
      id: "92200000-0000-4000-8000-000000000003",
      auth_user_id: "user-123",
      monto_centavos: 180000,
      pagado_en: null,
      stripe_payment_intent_id: "pi_pendiente",
    });
    mocks.stripe.mockResolvedValue({
      id: "pi_pendiente",
      status: "requires_payment_method",
    });

    const req = new NextRequest("http://localhost/api/viajes/masivos/estado?id=92200000-0000-4000-8000-000000000003");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagado).toBe(false);
    expect(mocks.confirmar).not.toHaveBeenCalled();
  });
});
