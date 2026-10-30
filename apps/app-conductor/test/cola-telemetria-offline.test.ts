import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import {
  configurarStorageTelemetria,
  contarColaTelemetria,
  encolarPuntoTelemetria,
  InMemoryTelemetryQueueStorage,
  leerColaTelemetria,
  limpiarColaTelemetria,
  sincronizarColaTelemetria
} from "../src/lib/cola-telemetria-offline";

const rpc = vi.fn(async (_name: string, args: { p_puntos: { localId: string }[] }) => ({ data: { aceptados: [args.p_puntos[0].localId], duplicadosIds: [] as string[] }, error: null as Error | null }));
const cliente = { auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) }, rpc } as unknown as SupabaseClient<Database>;

describe("Cola de Telemetría Offline (cola-telemetria-offline)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    configurarStorageTelemetria(new InMemoryTelemetryQueueStorage());
    await limpiarColaTelemetria();
  });

  it("encola puntos de telemetría válidos", async () => {
    const encolado = await encolarPuntoTelemetria(
      "t-100",
      { lat: 19.4326, lng: -99.1332, precisionM: 5, velocidadMps: 10 },
      { usuarioId: "user-1", localId: "p-1" }
    );

    expect(encolado).toBe(true);
    expect(await contarColaTelemetria()).toBe(1);

    const cola = await leerColaTelemetria();
    expect(cola[0].localId).toBe("p-1");
    expect(cola[0].latitude).toBe(19.4326);
  });

  it("descarta puntos duplicados o sin desplazamiento significativo salvo críticos", async () => {
    await encolarPuntoTelemetria(
      "t-100",
      { lat: 19.4326, lng: -99.1332, precisionM: 5 },
      { usuarioId: "user-1", localId: "p-1" }
    );

    // Mismo punto exacto sin desplazamiento
    const segundo = await encolarPuntoTelemetria(
      "t-100",
      { lat: 19.4326, lng: -99.1332, precisionM: 5 },
      { usuarioId: "user-1", localId: "p-2" }
    );
    expect(segundo).toBe(false);
    expect(await contarColaTelemetria()).toBe(1);

    // Punto crítico sí se encola aunque no haya desplazamiento
    const critico = await encolarPuntoTelemetria(
      "t-100",
      { lat: 19.4326, lng: -99.1332, precisionM: 5 },
      { usuarioId: "user-1", localId: "p-critico", critical: true }
    );
    expect(critico).toBe(true);
    expect(await contarColaTelemetria()).toBe(2);
  });

  it("sincroniza puntos pendientes con el servidor y los remueve de la cola", async () => {
    await encolarPuntoTelemetria(
      "t-100",
      { lat: 19.4326, lng: -99.1332 },
      { usuarioId: "user-1", localId: "p-sync-1" }
    );

    const clienteMock = cliente;
    const sincronizados = await sincronizarColaTelemetria(clienteMock);

    expect(sincronizados).toBe(1);
    expect(rpc).toHaveBeenCalledWith("registrar_telemetria_lote", expect.objectContaining({ p_traslado_id: "t-100", p_puntos: [expect.objectContaining({ localId: "p-sync-1", lat: 19.4326, fuente: "web_foreground" })] }));
    expect(await contarColaTelemetria()).toBe(0);
  });

  it("conserva identidad y hora de captura después de un fallo y reconoce el reintento duplicado", async () => {
    await encolarPuntoTelemetria("t-100", { lat: 19, lng: -99 }, { usuarioId: "user-1", localId: "stable", deviceTimestamp: "2026-10-30T15:00:00Z" });
    rpc.mockResolvedValueOnce({ data: { aceptados: [], duplicadosIds: [] }, error: new Error("offline") });
    await expect(sincronizarColaTelemetria(cliente)).rejects.toThrow("offline");
    expect((await leerColaTelemetria())[0]).toMatchObject({ localId: "stable", deviceTimestamp: "2026-10-30T15:00:00Z", attempts: 1 });
    rpc.mockResolvedValueOnce({ data: { aceptados: [], duplicadosIds: ["stable"] }, error: null });
    expect(await sincronizarColaTelemetria(cliente, { ignoreBackoff: true })).toBe(1);
    expect(await contarColaTelemetria()).toBe(0);
  });

  it("no envía ni elimina los puntos de otro usuario", async () => {
    await encolarPuntoTelemetria("t-100", { lat: 19, lng: -99 }, { usuarioId: "otro", localId: "other" });
    expect(await sincronizarColaTelemetria(cliente)).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
    expect(await contarColaTelemetria()).toBe(1);
  });

  it("conserva la señal cada 30 segundos aunque no haya movimiento", async () => {
    await encolarPuntoTelemetria("t-100", { lat: 19, lng: -99 }, { usuarioId: "user-1", deviceTimestamp: "2026-10-30T15:00:00Z" });
    expect(await encolarPuntoTelemetria("t-100", { lat: 19, lng: -99 }, { usuarioId: "user-1", deviceTimestamp: "2026-10-30T15:00:30Z" })).toBe(true);
  });

  it("no elimina puntos sin confirmación explícita", async () => {
    await encolarPuntoTelemetria("t-100", { lat: 19, lng: -99 }, { usuarioId: "user-1", localId: "pending" });
    rpc.mockResolvedValueOnce({ data: { aceptados: [], duplicadosIds: [] }, error: null });
    await expect(sincronizarColaTelemetria(cliente)).rejects.toThrow("telemetry_point_not_acknowledged");
    expect(await contarColaTelemetria()).toBe(1);
  });
});
