import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  DualTelemetryQueueStorage,
  InMemoryTelemetryQueueStorage,
  type PuntoTelemetriaLocal,
  type TelemetryQueueStorage
} from "../src/lib/cola-telemetria-offline";
import {
  IndexedDBTelemetryQueueStorage,
  reiniciarBaseDeDatosParaTesting,
  STORE_NAME
} from "../src/lib/idx-telemetria-store";

const puntoA: PuntoTelemetriaLocal = {
  usuarioId: "user-1",
  localId: "punto-a",
  trasladoId: "t-1",
  latitude: 19.4326,
  longitude: -99.1332,
  accuracyM: 5,
  deviceTimestamp: "2026-11-01T12:00:00Z",
  attempts: 0
};

const puntoB: PuntoTelemetriaLocal = {
  usuarioId: "user-1",
  localId: "punto-b",
  trasladoId: "t-1",
  latitude: 19.4330,
  longitude: -99.1335,
  accuracyM: 5,
  deviceTimestamp: "2026-11-01T12:00:15Z",
  attempts: 0
};

type GlobalConIDB = typeof globalThis & { indexedDB?: unknown };

interface MockGetAllRequest {
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  result: PuntoTelemetriaLocal[];
}

interface MockTransaction {
  objectStore: () => {
    clear: () => void;
    put: (item: PuntoTelemetriaLocal) => void;
    delete: (id: string) => void;
    getAll: () => MockGetAllRequest;
  };
  oncomplete: (() => void) | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
}

interface MockOpenRequest {
  onsuccess: ((ev: { target: MockOpenRequest }) => void) | null;
  onerror: (() => void) | null;
  onupgradeneeded: (() => void) | null;
  result?: {
    objectStoreNames: { contains: () => boolean };
    transaction: (...args: unknown[]) => MockTransaction;
  };
}

describe("H03 — Semántica de reemplazo en IndexedDB y no-resurrección tras ACK", () => {
  let storeMap: Map<string, PuntoTelemetriaLocal>;
  let originalIndexedDB: unknown;

  beforeEach(() => {
    storeMap = new Map();
    originalIndexedDB = (globalThis as GlobalConIDB).indexedDB;

    const mockIDB = {
      open: vi.fn(() => {
        const req: MockOpenRequest = { onsuccess: null, onerror: null, onupgradeneeded: null };
        queueMicrotask(() => {
          const dbResult = {
            objectStoreNames: { contains: () => true },
            transaction: (): MockTransaction => ({
              objectStore: () => ({
                clear: () => storeMap.clear(),
                put: (item: PuntoTelemetriaLocal) => storeMap.set(item.localId, { ...item }),
                delete: (id: string) => storeMap.delete(id),
                getAll: () => {
                  const getReq: MockGetAllRequest = { onsuccess: null, onerror: null, result: [] };
                  queueMicrotask(() => {
                    getReq.result = Array.from(storeMap.values());
                    getReq.onsuccess?.();
                  });
                  return getReq;
                }
              }),
              oncomplete: null,
              onerror: null,
              onabort: null
            })
          };
          // Disparar oncomplete en microtask tras operaciones de transaccion
          const origTx = dbResult.transaction;
          dbResult.transaction = () => {
            const tx = origTx();
            queueMicrotask(() => tx.oncomplete?.());
            return tx;
          };
          req.result = dbResult;
          req.onsuccess?.({ target: req });
        });
        return req;
      })
    };

    (globalThis as GlobalConIDB).indexedDB = mockIDB;
    reiniciarBaseDeDatosParaTesting();
  });

  afterEach(() => {
    (globalThis as GlobalConIDB).indexedDB = originalIndexedDB;
    reiniciarBaseDeDatosParaTesting();
  });

  it("IndexedDB.write ejecuta reemplazo atómico y elimina registros descartados o confirmados", async () => {
    const idbStorage = new IndexedDBTelemetryQueueStorage();

    // 1. Escribir [puntoA, puntoB]
    await idbStorage.write([puntoA, puntoB]);
    expect(await idbStorage.read()).toHaveLength(2);

    // 2. puntoA confirmado: escribir [puntoB]
    await idbStorage.write([puntoB]);
    const trasAckA = await idbStorage.read();
    expect(trasAckA).toHaveLength(1);
    expect(trasAckA[0].localId).toBe("punto-b");

    // 3. puntoB confirmado: escribir []
    await idbStorage.write([]);
    const trasAckB = await idbStorage.read();
    expect(trasAckB).toHaveLength(0);

    // 4. Simular recarga de página: la base de datos IndexedDB sigue vacía, no resucita puntoA ni puntoB
    reiniciarBaseDeDatosParaTesting();
    const idbStorageTrasRecarga = new IndexedDBTelemetryQueueStorage();
    const trasRecarga = await idbStorageTrasRecarga.read();
    expect(trasRecarga).toHaveLength(0);
  });

  it("DualTelemetryQueueStorage: escribir [A], ACK de A (escribir []), leer: cola permanece vacía tras recarga", async () => {
    const idbStorage = new IndexedDBTelemetryQueueStorage();
    const principal = new InMemoryTelemetryQueueStorage();
    const dual = new DualTelemetryQueueStorage(principal, idbStorage);

    // 1. Escribir [A]
    await dual.write([puntoA]);
    expect(await dual.read()).toHaveLength(1);

    // 2. Recibir ACK de A -> escribir []
    await dual.write([]);

    // 3. Leer: principal vacío y fallback también vacío
    const leidoInmediato = await dual.read();
    expect(leidoInmediato).toEqual([]);

    // 4. Recarga simulada: nueva instancia dual con almacenamiento preservado
    reiniciarBaseDeDatosParaTesting();
    const nuevoDual = new DualTelemetryQueueStorage(principal, new IndexedDBTelemetryQueueStorage());
    const leidoTrasRecarga = await nuevoDual.read();
    expect(leidoTrasRecarga).toEqual([]);
  });
});

describe("H04 — Fallback cubre fallos del almacén principal (read y write)", () => {
  it("read: consulta y retorna datos del fallback si el almacén principal lanza error", async () => {
    const principalConFallo: TelemetryQueueStorage = {
      read: vi.fn(async () => {
        throw new Error("Preferences_storage_corrupted");
      }),
      write: vi.fn(async () => {}),
      clear: vi.fn(async () => {})
    };

    const fallbackSano = new InMemoryTelemetryQueueStorage([puntoA]);
    const dual = new DualTelemetryQueueStorage(principalConFallo, fallbackSano);

    // No debe lanzar error; debe recuperar puntoA del fallback
    const items = await dual.read();
    expect(items).toHaveLength(1);
    expect(items[0].localId).toBe("punto-a");
  });

  it("write: persiste en el fallback si el almacén principal falla por cuota o error", async () => {
    const principalConFallo: TelemetryQueueStorage = {
      read: vi.fn(async () => []),
      write: vi.fn(async () => {
        throw new Error("QuotaExceededError: disk full");
      }),
      clear: vi.fn(async () => {})
    };

    const fallbackSano = new InMemoryTelemetryQueueStorage([]);
    const dual = new DualTelemetryQueueStorage(principalConFallo, fallbackSano);

    // No debe fallar la operación si el fallback logra persistir
    await expect(dual.write([puntoA])).resolves.not.toThrow();

    // El fallback contiene el dato persistido
    expect(await fallbackSano.read()).toHaveLength(1);
    expect((await fallbackSano.read())[0].localId).toBe("punto-a");
  });

  it("write: lanza error exigiendo confirmación si AMBOS almacenes fallan", async () => {
    const principalConFallo: TelemetryQueueStorage = {
      read: vi.fn(async () => []),
      write: vi.fn(async () => {
        throw new Error("Primary_write_failed");
      }),
      clear: vi.fn(async () => {})
    };

    const fallbackConFallo: TelemetryQueueStorage = {
      read: vi.fn(async () => []),
      write: vi.fn(async () => {
        throw new Error("Fallback_write_failed");
      }),
      clear: vi.fn(async () => {})
    };

    const dual = new DualTelemetryQueueStorage(principalConFallo, fallbackConFallo);

    // Debe lanzar error porque ningún almacén pudo confirmar la persistencia
    await expect(dual.write([puntoA])).rejects.toThrow("Primary_write_failed");
  });

  it("read: lanza error si AMBOS almacenes fallan", async () => {
    const principalConFallo: TelemetryQueueStorage = {
      read: vi.fn(async () => {
        throw new Error("Primary_read_failed");
      }),
      write: vi.fn(async () => {}),
      clear: vi.fn(async () => {})
    };

    const fallbackConFallo: TelemetryQueueStorage = {
      read: vi.fn(async () => {
        throw new Error("Fallback_read_failed");
      }),
      write: vi.fn(async () => {}),
      clear: vi.fn(async () => {})
    };

    const dual = new DualTelemetryQueueStorage(principalConFallo, fallbackConFallo);

    await expect(dual.read()).rejects.toThrow("Primary_read_failed");
  });
});
