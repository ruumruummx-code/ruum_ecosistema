import { describe, expect, it } from "vitest";
import { crearClienteFake } from "./__tests__/supabase-fake";
import {
  previsualizarTarifasMasivasUsuario,
  type EntradaCotizacionMasiva,
  eliminarCheckoutMasivoServidor,
  limpiarCheckoutsMasivosSinIntentServidor,
} from "./checkout-masivo";

const filas: EntradaCotizacionMasiva[] = Array.from({ length: 100 }, (_, indice) => ({ indice, marca: "Nissan", modelo: "Urvan Panel Diesel", condicion: "seminueva", distanciaKm: 50, tiempoEstimadoHoras: 1, fechaHora: "2026-10-18T18:00:00Z" }));
describe("cotización masiva por lote", () => {
  it("cotiza 100 filas con una sola llamada RPC", async () => {
    const cliente = crearClienteFake({ rpcs: { usuario_previsualizar_tarifas_masivas: { data: filas.map(f => ({ indice: f.indice, disponible: true, tarifa: 1234.56, categoria_tarifa: "ligero_b", gama: "media" })) } } });
    const resultado = await previsualizarTarifasMasivasUsuario(cliente as never, filas);
    expect(resultado).toHaveLength(100);
    expect(cliente.rpc).toHaveBeenCalledTimes(1);
    expect(cliente.rpc).toHaveBeenCalledWith("usuario_previsualizar_tarifas_masivas", { p_filas: filas });
  });
  it("rechaza respuestas parciales en lugar de cobrar solo 30 traslados", async () => {
    const cliente = crearClienteFake({ rpcs: { usuario_previsualizar_tarifas_masivas: { data: filas.slice(0,30).map(f => ({ indice: f.indice, disponible: true, tarifa: 100 })) } } });
    await expect(previsualizarTarifasMasivasUsuario(cliente as never, filas)).rejects.toThrow("lote incompleto");
  });

  it("elimina checkout huérfano en transacción de compensación solo si carece de payment intent", async () => {
    const cliente = crearClienteFake();
    await eliminarCheckoutMasivoServidor(cliente as never, "chk-123", "usr-456");
    expect(cliente.llamadas).toContainEqual({
      table: "checkout_traslados_masivos",
      action: "delete",
      args: [],
    });
    expect(cliente.llamadas).toContainEqual({
      table: "checkout_traslados_masivos",
      action: "eq",
      args: ["id", "chk-123"],
    });
    expect(cliente.llamadas).toContainEqual({
      table: "checkout_traslados_masivos",
      action: "is",
      args: ["stripe_payment_intent_id", null],
    });
  });

  it("limpia checkouts huérfanos sin intent llamando al RPC", async () => {
    const cliente = crearClienteFake({ rpcs: { limpiar_checkouts_masivos_sin_intent: { data: 5 } } });
    const eliminados = await limpiarCheckoutsMasivosSinIntentServidor(cliente as never, 15);
    expect(eliminados).toBe(5);
    expect(cliente.rpc).toHaveBeenCalledWith("limpiar_checkouts_masivos_sin_intent", { p_minutos: 15 });
  });
});
