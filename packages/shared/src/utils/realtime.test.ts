import { describe, it, expect, vi } from "vitest";
import { suscribirCanalSeguro, limpiarCanalesSeguros } from "./realtime";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

describe("realtime utils (GAP 4)", () => {
  function crearMockClienteYCanal() {
    let callbackSub: ((status: string, err?: Error) => void) | undefined;
    const canal = {
      subscribe: vi.fn((cb) => {
        callbackSub = cb;
        return canal;
      })
    } as unknown as RealtimeChannel;

    const cliente = {
      removeChannel: vi.fn().mockResolvedValue("ok")
    } as unknown as SupabaseClient;

    return {
      cliente,
      canal,
      emitirStatus: (status: string, err?: Error) => callbackSub?.(status, err)
    };
  }

  it("suscribe el canal y ejecuta removeChannel en cleanup", async () => {
    const { cliente, canal } = crearMockClienteYCanal();
    const cleanup = suscribirCanalSeguro(cliente, canal);

    expect(canal.subscribe).toHaveBeenCalledOnce();
    expect(cliente.removeChannel).not.toHaveBeenCalled();

    await cleanup();
    expect(cliente.removeChannel).toHaveBeenCalledWith(canal);
  });

  it("el cleanup es idempotente y no ejecuta removeChannel múltiples veces", async () => {
    const { cliente, canal } = crearMockClienteYCanal();
    const cleanup = suscribirCanalSeguro(cliente, canal);

    await cleanup();
    await cleanup();
    expect(cliente.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("desuscribe automáticamente en caso de CHANNEL_ERROR o TIMED_OUT", async () => {
    const { cliente, canal, emitirStatus } = crearMockClienteYCanal();
    const onError = vi.fn();
    suscribirCanalSeguro(cliente, canal, { onError });

    emitirStatus("CHANNEL_ERROR", new Error("Fallo de conexión"));
    await Promise.resolve();

    expect(onError).toHaveBeenCalledOnce();
    expect(cliente.removeChannel).toHaveBeenCalledWith(canal);
  });

  it("notifica cambios de estado con onStatusChange", () => {
    const { cliente, canal, emitirStatus } = crearMockClienteYCanal();
    const onStatusChange = vi.fn();
    suscribirCanalSeguro(cliente, canal, { onStatusChange });

    emitirStatus("SUBSCRIBED");
    expect(onStatusChange).toHaveBeenCalledWith("SUBSCRIBED", undefined);
  });

  it("limpiarCanalesSeguros remueve múltiples canales y tolera excepciones", async () => {
    const { cliente, canal } = crearMockClienteYCanal();
    const canal2 = { id: "canal-2" } as unknown as RealtimeChannel;
    (cliente.removeChannel as any).mockRejectedValueOnce(new Error("Error de socket"));

    await expect(limpiarCanalesSeguros(cliente, [canal, null, canal2])).resolves.not.toThrow();
    expect(cliente.removeChannel).toHaveBeenCalledTimes(2);
  });

  it("FIX A1: con reintentar=true re-suscribe con backoff exponencial en vez de limpiar", async () => {
    vi.useFakeTimers();
    try {
      const { cliente, canal, emitirStatus } = crearMockClienteYCanal();
      const onError = vi.fn();
      suscribirCanalSeguro(cliente, canal, { onError, reintentar: true });

      emitirStatus("CHANNEL_ERROR", new Error("corte"));
      await Promise.resolve();
      expect(onError).toHaveBeenCalledOnce();
      expect(cliente.removeChannel).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1000); // 1er backoff: 1000ms
      expect(canal.subscribe).toHaveBeenCalledTimes(2);

      emitirStatus("CHANNEL_ERROR", new Error("corte 2"));
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(1999);
      expect(canal.subscribe).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1); // 2do backoff: 2000ms
      expect(canal.subscribe).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("FIX A1: SUBSCRIBED resetea el backoff y maxIntentos agota reintentos", async () => {
    vi.useFakeTimers();
    try {
      const { cliente, canal, emitirStatus } = crearMockClienteYCanal();
      suscribirCanalSeguro(cliente, canal, { reintentar: { maxIntentos: 1 } });

      emitirStatus("CHANNEL_ERROR");
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(15000);
      expect(canal.subscribe).toHaveBeenCalledTimes(2);

      // 2do error supera maxIntentos=1 → limpieza final.
      emitirStatus("CHANNEL_ERROR");
      await Promise.resolve();
      expect(cliente.removeChannel).toHaveBeenCalledWith(canal);
    } finally {
      vi.useRealTimers();
    }
  });
});
