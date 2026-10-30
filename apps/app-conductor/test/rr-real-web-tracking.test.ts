import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let cleanup: (() => void) | void;
const mocks = vi.hoisted(() => ({
  enqueue: vi.fn(async () => true), sync: vi.fn(async () => 1),
  position: vi.fn(async () => ({ lat: 19, lng: -99, capturedAt: "2026-10-30T15:00:00Z" })),
  stopWatch: vi.fn(),
  watch: vi.fn(),
  session: vi.fn(async () => ({ data: { session: { user: { id: "driver" } } } }))
}));
vi.mock("react", () => ({ useEffect: (fn: () => (() => void) | void) => { cleanup = fn(); } }));
vi.mock("../src/lib/cola-telemetria-offline", () => ({ encolarPuntoTelemetria: mocks.enqueue, sincronizarColaTelemetria: mocks.sync }));
vi.mock("../src/lib/supabase-browser", () => ({ tieneSupabaseConfigurado: () => true, crearClienteNavegador: () => ({ auth: { getSession: mocks.session } }) }));
vi.mock("../src/lib/background-tracking", () => ({ soportaTrackingNativo: () => false }));
vi.mock("../src/lib/ubicacion", () => ({ obtenerUbicacionActual: mocks.position, observarUbicacionActual: mocks.watch, distanciaMetrosEntre: () => 0 }));
import { useDriverLocationTracking } from "../src/app/useDriverLocationTracking";
const trip = { trasladoId: "trip", estado: "traslado_en_curso" as const, folio: "RR", etapa: "En curso", destinoActual: "Destino" };

describe("RR-REAL-002 web tracking lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks();
    const browser = Object.assign(new EventTarget(), { setInterval, clearInterval });
    vi.stubGlobal("window", browser);
    mocks.watch.mockResolvedValue(mocks.stopWatch);
  });
  afterEach(() => { cleanup?.(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("queues actual capture time and sends every 30 seconds while stationary", async () => {
    useDriverLocationTracking(trip);
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.enqueue).toHaveBeenCalledWith("trip", expect.anything(), { usuarioId: "driver", deviceTimestamp: "2026-10-30T15:00:00Z" });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mocks.position).toHaveBeenCalledTimes(2);
    expect(mocks.sync).toHaveBeenCalledTimes(2);
    cleanup?.(); cleanup = undefined;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.position).toHaveBeenCalledTimes(2);
    expect(mocks.stopWatch).toHaveBeenCalledTimes(1);
  });

  it("retries queued points immediately on reconnection", async () => {
    useDriverLocationTracking(trip);
    await vi.advanceTimersByTimeAsync(0);
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.sync).toHaveBeenCalledWith(expect.anything(), { ignoreBackoff: true });
  });

  it("stops a watch that resolves after the effect has unmounted", async () => {
    let finish: ((stop: () => void) => void) | undefined;
    mocks.watch.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    useDriverLocationTracking(trip);
    cleanup?.(); cleanup = undefined;
    finish?.(mocks.stopWatch);
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.stopWatch).toHaveBeenCalledOnce();
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
});
