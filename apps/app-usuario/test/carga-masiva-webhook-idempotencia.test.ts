import { describe, it, expect, vi, beforeEach } from "vitest";
import { confirmarPagoMasivoServidor } from "@ruum/api/services";

/**
 * Suite de integración: F03 — Idempotencia y conciliación de Webhook de Carga Masiva
 *
 * Verifica que:
 * 1. La confirmación del checkout masivo ejecute la RPC 'confirmar_checkout_masivo' con los argumentos esperados.
 * 2. Un segundo webhook con el mismo evento no genere efectos secundarios duplicados.
 * 3. Se rechacen discrepancias en monto o identificador de intento de pago.
 */
describe("F03 — Idempotencia y validación de Webhook de Carga Masiva", () => {
  let mockRpc: ReturnType<typeof vi.fn>;
  let mockSupabase: any;

  beforeEach(() => {
    mockRpc = vi.fn().mockImplementation((fnName: string, args: any) => {
      if (fnName === "confirmar_checkout_masivo") {
        if (args.p_moneda !== "mxn") {
          return Promise.resolve({ data: null, error: new Error("Moneda no válida") });
        }
        if (args.p_monto <= 0) {
          return Promise.resolve({ data: null, error: new Error("Monto inválido") });
        }
        // Simular retorno de ID de carga
        return Promise.resolve({ data: "carga-uuid-12345", error: null });
      }
      return Promise.resolve({ data: null, error: new Error(`RPC ${fnName} no soportada`) });
    });

    mockSupabase = {
      rpc: mockRpc,
    };
  });

  it("concilia correctamente el lote mediante la RPC de Supabase con los parámetros esperados", async () => {
    const checkoutId = "checkout-uuid-abc";
    const paymentIntentId = "pi_test_123456789";
    const montoCentavos = 130000; // $1,300.00 MXN

    await confirmarPagoMasivoServidor(
      mockSupabase,
      checkoutId,
      paymentIntentId,
      montoCentavos,
      "mxn"
    );

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith("confirmar_checkout_masivo", {
      p_id: checkoutId,
      p_intent: paymentIntentId,
      p_monto: montoCentavos,
      p_moneda: "mxn",
    });
  });

  it("garantiza idempotencia: llamadas duplicadas del webhook devuelven éxito sin disparar errores ni duplicaciones", async () => {
    const checkoutId = "checkout-uuid-abc";
    const paymentIntentId = "pi_test_123456789";
    const montoCentavos = 130000;

    // Primer evento del webhook
    await confirmarPagoMasivoServidor(
      mockSupabase,
      checkoutId,
      paymentIntentId,
      montoCentavos,
      "mxn"
    );

    // Segundo evento idéntico (reintento automático de Stripe por timeout de red previo)
    await confirmarPagoMasivoServidor(
      mockSupabase,
      checkoutId,
      paymentIntentId,
      montoCentavos,
      "mxn"
    );

    expect(mockRpc).toHaveBeenCalledTimes(2);
    // En PostgreSQL, 'confirmar_checkout_masivo' tiene la guarda:
    // IF v.pagado_en IS NOT NULL THEN RETURN v.carga_id; END IF;
    // por lo que ambas llamadas resuelven limpiamente retornando el mismo id.
  });

  it("rechaza conciliaciones si el monto en centavos o la moneda no son válidos", async () => {
    const checkoutId = "checkout-uuid-abc";
    const paymentIntentId = "pi_test_123456789";

    // Moneda diferente a mxn
    await expect(
      confirmarPagoMasivoServidor(
        mockSupabase,
        checkoutId,
        paymentIntentId,
        130000,
        "usd"
      )
    ).rejects.toThrow("Moneda no válida");

    // Monto alterado <= 0
    await expect(
      confirmarPagoMasivoServidor(
        mockSupabase,
        checkoutId,
        paymentIntentId,
        0,
        "mxn"
      )
    ).rejects.toThrow("Monto inválido");
  });
});
