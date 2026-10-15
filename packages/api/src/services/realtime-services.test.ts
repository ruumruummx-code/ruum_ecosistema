import { describe, it, expect, vi } from "vitest";
import { suscribirseAMensajes } from "./chat";
import { suscribirUbicacionTraslado, suscribirEstadoTraslado } from "./ubicaciones";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

describe("Realtime services cleanup y resiliencia (GAP 4)", () => {
  function crearMockClienteYCanal() {
    let callbackSub: ((status: string, err?: Error) => void) | undefined;
    let postgresChangesCallback: ((payload: any) => void) | undefined;

    const canal = {
      on: vi.fn((_type: string, _opts: any, cb: any) => {
        postgresChangesCallback = cb;
        return canal;
      }),
      subscribe: vi.fn((cb) => {
        callbackSub = cb;
        return canal;
      })
    } as unknown as RealtimeChannel;

    const cliente = {
      channel: vi.fn().mockReturnValue(canal),
      removeChannel: vi.fn().mockResolvedValue("ok")
    } as unknown as SupabaseClient<any>;

    return {
      cliente,
      canal,
      emitirStatus: (status: string, err?: Error) => callbackSub?.(status, err),
      emitirPayload: (payload: any) => postgresChangesCallback?.(payload)
    };
  }

  it("suscribirseAMensajes configura channel con subscribe seguro", () => {
    const { cliente, canal } = crearMockClienteYCanal();
    const alRecibir = vi.fn();
    const sub = suscribirseAMensajes(cliente, "traslado-1", alRecibir);

    expect(cliente.channel).toHaveBeenCalledWith("mensajes_chat:traslado-1");
    expect(canal.subscribe).toHaveBeenCalled();
    expect(sub).toBe(canal);
  });

  it("suscribirseAMensajes reintenta con backoff ante CHANNEL_ERROR (no limpia de inmediato)", async () => {
    vi.useFakeTimers();
    try {
      const { cliente, canal, emitirStatus } = crearMockClienteYCanal();
      const onError = vi.fn();
      suscribirseAMensajes(cliente, "traslado-1", vi.fn(), { onError });

      emitirStatus("CHANNEL_ERROR", new Error("Fallo de red"));
      await Promise.resolve();

      expect(onError).toHaveBeenCalledOnce();
      // FIX A1: con reintento activado el canal NO se remueve de inmediato…
      expect(cliente.removeChannel).not.toHaveBeenCalled();
      // …sino que se re-suscribe tras el backoff (base 1000ms).
      expect(canal.subscribe).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1000);
      expect(canal.subscribe).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("suscribirUbicacionTraslado propaga ubicaciones y gestiona cleanup seguro", () => {
    const { cliente, canal, emitirPayload } = crearMockClienteYCanal();
    const alRecibir = vi.fn();
    suscribirUbicacionTraslado(cliente, "traslado-1", alRecibir);

    expect(cliente.channel).toHaveBeenCalledWith("ubicaciones-traslado-traslado-1");
    emitirPayload({ new: { id: "u-1", lat: 19.4, lng: -99.1 } });
    expect(alRecibir).toHaveBeenCalledWith({ id: "u-1", lat: 19.4, lng: -99.1 });
  });

  it("suscribirEstadoTraslado propaga cambios de estado y reintenta ante TIMED_OUT", async () => {
    vi.useFakeTimers();
    try {
      const { cliente, canal, emitirPayload, emitirStatus } = crearMockClienteYCanal();
      const alRecibir = vi.fn();
      const onError = vi.fn();
      suscribirEstadoTraslado(cliente, "traslado-1", alRecibir, { onError });

      expect(cliente.channel).toHaveBeenCalledWith("estado-traslado-traslado-1");
      emitirPayload({ new: { id: "traslado-1", estado: "en_camino" } });
      expect(alRecibir).toHaveBeenCalledWith({ id: "traslado-1", estado: "en_camino" });

      emitirStatus("TIMED_OUT");
      await Promise.resolve();
      expect(onError).toHaveBeenCalled();
      // FIX A1: re-suscribe tras backoff en vez de remover el canal.
      expect(cliente.removeChannel).not.toHaveBeenCalledWith(canal);
      await vi.advanceTimersByTimeAsync(1000);
      expect(canal.subscribe).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
