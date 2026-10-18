import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
  obtener: vi.fn(),
  descartar: vi.fn(),
  confirmar: vi.fn(),
  stripe: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "usuario-123" } } }) },
  }),
}));
vi.mock("@/lib/csp-rate-limit", () => ({ rateLimitConVentana: async () => ({ allowed: true }) }));
vi.mock("@/lib/carga-masiva-server", () => ({
  clienteMasivoServicio: () => ({}),
  stripeMasivo: mocks.stripe,
}));
vi.mock("@ruum/api/services", () => ({
  listarCheckoutsMasivosPendientesUsuario: mocks.listar,
  obtenerCheckoutMasivoServidor: mocks.obtener,
  descartarCheckoutMasivoServidor: mocks.descartar,
  confirmarPagoMasivoServidor: mocks.confirmar,
}));

import { GET, DELETE } from "./route";

describe("API /api/viajes/masivos/pendientes", () => {
  const cargaId = "92200000-0000-4000-8000-000000000001";

  beforeEach(() => {
    mocks.listar.mockReset();
    mocks.obtener.mockReset();
    mocks.descartar.mockReset();
    mocks.confirmar.mockReset();
    mocks.stripe.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("lista las cargas pendientes del usuario", async () => {
    mocks.listar.mockResolvedValue([
      {
        id: cargaId,
        creado_en: "2026-10-17T12:00:00Z",
        monto_centavos: 250000,
        cotizaciones: [{ indice: 0 }, { indice: 1 }],
        filas: [{}, {}],
      },
    ]);

    const req = new NextRequest("http://localhost/api/viajes/masivos/pendientes");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pendientes).toHaveLength(1);
    expect(data.pendientes[0].totalMXN).toBe(2500);
    expect(data.pendientes[0].cantidad_traslados).toBe(2);
  });

  it("recupera una carga pendiente específica con client_secret para reanudar", async () => {
    mocks.obtener.mockResolvedValue({
      id: cargaId,
      auth_user_id: "usuario-123",
      monto_centavos: 150000,
      stripe_payment_intent_id: "pi_pendiente",
      cotizaciones: [{ indice: 0, tarifa: 1500 }],
      filas: [{ marca: "Toyota" }],
      creado_en: "2026-10-17T12:00:00Z",
    });
    mocks.stripe.mockResolvedValue({
      id: "pi_pendiente",
      status: "requires_payment_method",
      client_secret: "cs_retome_secret",
    });

    const req = new NextRequest(`http://localhost/api/viajes/masivos/pendientes?id=${cargaId}`);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(cargaId);
    expect(data.clientSecret).toBe("cs_retome_secret");
    expect(data.totalMXN).toBe(1500);
  });

  it("descarta la carga pendiente y cancela el intent de Stripe", async () => {
    mocks.obtener.mockResolvedValue({
      id: cargaId,
      auth_user_id: "usuario-123",
      stripe_payment_intent_id: "pi_pendiente",
    });
    mocks.stripe.mockResolvedValue({ id: "pi_pendiente", status: "canceled" });

    const req = new NextRequest(`http://localhost/api/viajes/masivos/pendientes?id=${cargaId}`, {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mocks.stripe).toHaveBeenCalledWith("payment_intents/pi_pendiente/cancel", expect.any(URLSearchParams));
    expect(mocks.descartar).toHaveBeenCalledWith(expect.anything(), cargaId, "usuario-123");
  });
});
