import { describe, it, expect } from "vitest";
import { emitirCotizacionAdmin, aplicarTarifaNormativaAdmin } from "./cotizaciones";
import { createMockSupabaseClient } from "../test-utils/mock-supabase";

describe("billing / cotizaciones", () => {
  it("emitirCotizacionAdmin: rechaza tarifas no positivas", async () => {
    const client = createMockSupabaseClient();
    await expect(emitirCotizacionAdmin(client, "t-1", 0)).rejects.toThrow(
      "La tarifa normativa debe ser mayor a cero."
    );
    await expect(emitirCotizacionAdmin(client, "t-1", -100)).rejects.toThrow(
      "La tarifa normativa debe ser mayor a cero."
    );
  });

  it("emitirCotizacionAdmin: invoca RPC admin_emite_cotizacion", async () => {
    let llamadaRpc = false;
    const client = createMockSupabaseClient({
      rpcData: { admin_emite_cotizacion: null }
    });
    client.rpc = (async (fn: string, args: any) => {
      if (fn === "admin_emite_cotizacion") {
        llamadaRpc = true;
        expect(args.p_traslado_id).toBe("t-100");
        expect(args.p_precio).toBe(2500);
      }
      return { data: null, error: null };
    }) as any;

    await emitirCotizacionAdmin(client, "t-100", 2500);
    expect(llamadaRpc).toBe(true);
  });

  it("aplicarTarifaNormativaAdmin: retorna tarifa confirmada por RPC", async () => {
    const client = createMockSupabaseClient({
      rpcData: { admin_aplica_tarifa_normativa: 1850 }
    });

    const tarifa = await aplicarTarifaNormativaAdmin(client, "t-200");
    expect(tarifa).toBe(1850);
  });

  it("aplicarTarifaNormativaAdmin: falla si la RPC devuelve null", async () => {
    const client = createMockSupabaseClient({
      rpcData: { admin_aplica_tarifa_normativa: null }
    });

    await expect(aplicarTarifaNormativaAdmin(client, "t-200")).rejects.toThrow(
      "No se pudo confirmar la tarifa normativa aplicada."
    );
  });
});
