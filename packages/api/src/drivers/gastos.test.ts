import { describe, it, expect } from "vitest";
import { listarGastosTraslado, registrarGastoTraslado } from "./gastos";
import { createMockSupabaseClient } from "../test-utils/mock-supabase";

describe("drivers / gastos", () => {
  it("listarGastosTraslado: obtiene gastos filtrados por traslado", async () => {
    const client = createMockSupabaseClient({
      tableData: {
        gastos_traslado: [
          { id: "g-1", traslado_id: "t-1", tipo: "gasolina", monto: 450, registrado_en: "2026-11-20" }
        ]
      }
    });

    const gastos = await listarGastosTraslado(client, "t-1");
    expect(gastos).toHaveLength(1);
    expect(gastos[0].monto).toBe(450);
  });

  it("registrarGastoTraslado: valida y rechaza montos negativos o no válidos", async () => {
    const client = createMockSupabaseClient();
    await expect(
      registrarGastoTraslado(client, {
        trasladoId: "11111111-1111-1111-1111-111111111111",
        tipo: "gasolina",
        monto: -50
      })
    ).rejects.toThrow();

    await expect(
      registrarGastoTraslado(client, {
        trasladoId: "11111111-1111-1111-1111-111111111111",
        tipo: "",
        monto: 100
      })
    ).rejects.toThrow();
  });

  it("registrarGastoTraslado: inserta y devuelve gasto registrado", async () => {
    const client = createMockSupabaseClient({
      tableData: {
        gastos_traslado: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            traslado_id: "11111111-1111-1111-1111-111111111111",
            tipo: "peaje",
            monto: 180,
            registrado_en: "2026-11-20T10:00:00Z"
          }
        ]
      }
    });

    const gasto = await registrarGastoTraslado(client, {
      trasladoId: "11111111-1111-1111-1111-111111111111",
      tipo: "peaje",
      monto: 180
    });

    expect(gasto.monto).toBe(180);
    expect(gasto.tipo).toBe("peaje");
  });
});
