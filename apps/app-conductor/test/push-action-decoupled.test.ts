import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  registrarAperturaPush: vi.fn(),
  registrarDispositivoPush: vi.fn(),
  desactivarDispositivoPush: vi.fn(),
  crearClienteNavegador: vi.fn(() => ({})),
  isNativePlatform: vi.fn(() => true),
  pushListeners: new Map<string, Function>(),
  checkPermissions: vi.fn().mockResolvedValue({ receive: "granted" }),
  requestPermissions: vi.fn().mockResolvedValue({ receive: "granted" }),
  register: vi.fn().mockResolvedValue(undefined),
  createChannel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: mocks.isNativePlatform,
  },
}));

vi.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    createChannel: mocks.createChannel,
    addListener: vi.fn((event: string, callback: Function) => {
      mocks.pushListeners.set(event, callback);
      return Promise.resolve({ remove: vi.fn() });
    }),
    checkPermissions: mocks.checkPermissions,
    requestPermissions: mocks.requestPermissions,
    register: mocks.register,
  },
}));

vi.mock("@ruum/api/drivers", () => ({
  registrarAperturaPush: mocks.registrarAperturaPush,
  registrarDispositivoPush: mocks.registrarDispositivoPush,
  desactivarDispositivoPush: mocks.desactivarDispositivoPush,
}));

vi.mock("../src/lib/supabase-browser", () => ({
  crearClienteNavegador: mocks.crearClienteNavegador,
}));

// Mock de almacenamiento seguro en memoria
let storageLocal: Record<string, string> = {};
vi.mock("../src/lib/almacenamiento-seguro-local", () => ({
  guardarJsonLocalSeguro: vi.fn(async (key: string, val: unknown) => {
    storageLocal[key] = JSON.stringify(val);
  }),
  leerJsonLocalSeguro: vi.fn(async <T>(key: string): Promise<T | null> => {
    const v = storageLocal[key];
    return v ? (JSON.parse(v) as T) : null;
  }),
  eliminarJsonLocalSeguro: vi.fn(async (key: string) => {
    delete storageLocal[key];
  }),
}));

vi.mock("../src/lib/observability", () => ({
  recordOperationalEvent: vi.fn(),
}));

import {
  inicializarPush,
  sincronizarAperturasPushPendientes,
  PUSH_APERTURAS_PENDIENTES_KEY,
} from "../src/lib/push-notifications";

describe("push-notifications - Desacoplamiento de navegación y métricas (H13)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageLocal = {};
    mocks.pushListeners.clear();
    mocks.crearClienteNavegador.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "u1" } } } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    });
  });

  it("navega al destino inmediatamente aunque registrarAperturaPush falle o sea rechazado por el servidor", async () => {
    const onNavigate = vi.fn();
    mocks.registrarAperturaPush.mockRejectedValue(new Error("Network timeout en RPC registrar_apertura_push"));

    await inicializarPush(onNavigate);

    const listenerActionPerformed = mocks.pushListeners.get("pushNotificationActionPerformed");
    expect(listenerActionPerformed).toBeDefined();

    // Simular que el usuario pulsa una notificación con destino a un viaje
    listenerActionPerformed!({
      notification: {
        data: {
          notificacion_id: "notif-uuid-1234",
          destino: "/viajes/traslado-777",
        },
      },
    });

    // La navegación debe ocurrir de inmediato sin haber sido bloqueada por el error
    expect(onNavigate).toHaveBeenCalledWith("/viajes/traslado-777");

    // Esperar a que la promesa asíncrona de guardado en cola termine
    await vi.waitFor(() => {
      expect(storageLocal[PUSH_APERTURAS_PENDIENTES_KEY]).toBeDefined();
    });

    const colaGuardada = storageLocal[PUSH_APERTURAS_PENDIENTES_KEY];
    const pendientes = JSON.parse(colaGuardada);
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].notificacionId).toBe("notif-uuid-1234");
    expect(pendientes[0].notificacionId).toBe("notif-uuid-1234");
  });

  it("sincronizarAperturasPushPendientes reintenta las métricas fallidas y vacía la cola al completarse", async () => {
    // Estado inicial: un ítem pendiente guardado en el almacenamiento durable
    storageLocal[PUSH_APERTURAS_PENDIENTES_KEY] = JSON.stringify([
      {
        notificacionId: "notif-uuid-1234",
        deviceId: "device-uuid-test",
        intentos: 1,
        creadoEn: new Date().toISOString(),
      },
    ]);

    // Ahora la red se restablece y el RPC tiene éxito
    mocks.registrarAperturaPush.mockResolvedValue({ data: { ok: true }, error: null });

    const sincronizados = await sincronizarAperturasPushPendientes();

    expect(sincronizados).toBe(1);
    expect(mocks.registrarAperturaPush).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        notificacionId: "notif-uuid-1234",
        deviceId: "device-uuid-test",
      })
    );

    // La cola en almacenamiento seguro debe quedar vacía / eliminada
    expect(storageLocal[PUSH_APERTURAS_PENDIENTES_KEY]).toBeUndefined();
  });
});
