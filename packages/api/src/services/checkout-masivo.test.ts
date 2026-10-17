import { describe, expect, it } from "vitest";
import { crearClienteFake } from "./__tests__/supabase-fake";
import { previsualizarTarifasMasivasUsuario, type EntradaCotizacionMasiva } from "./checkout-masivo";

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
});
