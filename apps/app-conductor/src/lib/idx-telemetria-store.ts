/**
 * Almacenamiento IndexedDB para la cola de telemetría del conductor.
 * Fallback obligatorio y persistente para `encolarPuntoTelemetria` cuando
 * el almacenamiento seguro local (Preferences/localStorage) no está disponible
 * o como respaldo adicional contra pérdida de datos offline.
 *
 * Base de datos: ruum_telemetria_db
 * Versión: 1
 * Almacén de objetos: puntos_telemetria (keyPath: localId)
 */

import type { PuntoTelemetriaLocal } from "./cola-telemetria-offline";

const DB_NAME = "ruum_telemetria_db";
const DB_VERSION = 1;
const STORE_NAME = "puntos_telemetria";

let dbPromise: Promise<IDBDatabase> | null = null;

function abrirBaseDeDatos(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexeddb_unavailable"));
      return;
    }
    const solicitud = indexedDB.open(DB_NAME, DB_VERSION);
    solicitud.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "localId" });
        store.createIndex("por_traslado", "trasladoId", { unique: false });
        store.createIndex("por_intentos", "attempts", { unique: false });
      }
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
    solicitud.onblocked = () => {
      // No bloquear: permitir que se use el almacenamiento existente
    };
  });
  return dbPromise;
}

function esIndexedDBDisponible(): boolean {
  return typeof indexedDB !== "undefined";
}

export class IndexedDBTelemetryQueueStorage {
  async read(): Promise<PuntoTelemetriaLocal[]> {
    if (!esIndexedDBDisponible()) return [];
    const db = await abrirBaseDeDatos();
    return new Promise((resolve, reject) => {
      const transaccion = db.transaction([STORE_NAME], "readonly");
      const store = transaccion.objectStore(STORE_NAME);
      const solicitud = store.getAll();
      solicitud.onsuccess = () => resolve(solicitud.result as PuntoTelemetriaLocal[]);
      solicitud.onerror = () => reject(solicitud.error);
    });
  }

  async write(items: PuntoTelemetriaLocal[]): Promise<void> {
    if (!esIndexedDBDisponible()) return;
    const db = await abrirBaseDeDatos();
    return new Promise((resolve, reject) => {
      const transaccion = db.transaction([STORE_NAME], "readwrite");
      const store = transaccion.objectStore(STORE_NAME);
      for (const item of items) {
        store.put(item);
      }
      transaccion.oncomplete = () => resolve();
      transaccion.onerror = () => reject(transaccion.error);
    });
  }

  async clear(): Promise<void> {
    if (!esIndexedDBDisponible()) return;
    const db = await abrirBaseDeDatos();
    return new Promise((resolve, reject) => {
      const transaccion = db.transaction([STORE_NAME], "readwrite");
      const store = transaccion.objectStore(STORE_NAME);
      const solicitud = store.clear();
      solicitud.onsuccess = () => resolve();
      solicitud.onerror = () => reject(solicitud.error);
    });
  }

  async eliminar(localId: string): Promise<void> {
    if (!esIndexedDBDisponible()) return;
    const db = await abrirBaseDeDatos();
    return new Promise((resolve, reject) => {
      const transaccion = db.transaction([STORE_NAME], "readwrite");
      const store = transaccion.objectStore(STORE_NAME);
      const solicitud = store.delete(localId);
      solicitud.onsuccess = () => resolve();
      solicitud.onerror = () => reject(solicitud.error);
    });
  }
}

/**
 * Instancia compartida del almacenamiento IndexedDB para telemetría.
 * Se expone para permitir inyección en tests y reuso en otros módulos.
 */
export const indexedDBTelemetryStorage = new IndexedDBTelemetryQueueStorage();

export { DB_NAME, STORE_NAME, esIndexedDBDisponible };
