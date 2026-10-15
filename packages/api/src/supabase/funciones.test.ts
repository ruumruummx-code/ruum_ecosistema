import { describe, expect, it, vi } from "vitest";
import { rpcTipado } from "./funciones";

describe("rpcTipado (FIX C1 Fase 4)", () => {
  it("pasa nombre y args al cliente y devuelve data tipada", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "cotizacion_aceptada", error: null });
    const { data, error } = await rpcTipado({ rpc } as never, "usuario_acepta_cotizacion", {
      p_traslado_id: "00000000-0000-0000-0000-000000000001"
    });

    expect(rpc).toHaveBeenCalledWith("usuario_acepta_cotizacion", {
      p_traslado_id: "00000000-0000-0000-0000-000000000001"
    });
    expect(error).toBeNull();
    expect(data).toBe("cotizacion_aceptada");
  });

  it("propaga el error de Postgres sin transformarlo", async () => {
    const fallo = new Error("Transición inválida");
    const rpc = vi.fn().mockResolvedValue({ data: null, error: fallo });
    const { data, error } = await rpcTipado({ rpc } as never, "usuario_cancela_traslado", {
      p_traslado_id: "00000000-0000-0000-0000-000000000001",
      p_motivo: "prueba"
    });

    expect(data).toBeNull();
    expect(error).toBe(fallo);
  });
});
