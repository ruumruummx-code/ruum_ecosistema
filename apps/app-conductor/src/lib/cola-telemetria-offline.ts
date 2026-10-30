import { registrarLoteTelemetria } from "@ruum/api/tracking";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { distanciaMetrosEntre, type Coordenadas } from "./ubicacion";
import { guardarJsonLocalSeguro, leerJsonLocalSeguro, eliminarJsonLocalSeguro } from "./almacenamiento-seguro-local";
import { indexedDBTelemetryStorage, esIndexedDBDisponible } from "./idx-telemetria-store";

const CLAVE_COLA_TELEMETRIA = "ruum_cola_telemetria_v1";
const MAX_PUNTOS_COLA = 500;
const DISTANCIA_SIGNIFICATIVA_M = 25;
const BACKOFF_TELEMETRIA_MS = [30_000, 2 * 60_000, 5 * 60_000, 15 * 60_000];

export interface PuntoTelemetriaLocal {
  usuarioId: string;
  localId: string;
  trasladoId: string;
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
  speedMps?: number | null;
  heading?: number | null;
  deviceTimestamp: string;
  attempts: number;
  lastAttemptAt?: string;
  critical?: boolean;
}

export interface TelemetryQueueStorage {
  read(): Promise<PuntoTelemetriaLocal[]>;
  write(items: PuntoTelemetriaLocal[]): Promise<void>;
  clear(): Promise<void>;
}

export class SecureTelemetryQueueStorage implements TelemetryQueueStorage {
  async read() {
    return normalizar(await leerJsonLocalSeguro<PuntoTelemetriaLocal[]>(CLAVE_COLA_TELEMETRIA));
  }

  async write(items: PuntoTelemetriaLocal[]) {
    await guardarJsonLocalSeguro(CLAVE_COLA_TELEMETRIA, normalizar(items));
  }

  async clear() {
    await eliminarJsonLocalSeguro(CLAVE_COLA_TELEMETRIA);
  }
}

export class InMemoryTelemetryQueueStorage implements TelemetryQueueStorage {
  constructor(private items: PuntoTelemetriaLocal[] = []) {}

  async read() {
    return normalizar(this.items);
  }

  async write(items: PuntoTelemetriaLocal[]) {
    this.items = normalizar(items);
  }

  async clear() {
    this.items = [];
  }
}

/**
 * Almacenamiento dual: escribe siempre en el storage configurado (cifrado)
 * Y en IndexedDB como fallback obligatorio. Lee del storage configurado;
 * si está vacío, cae a IndexedDB. Garantiza que ningún punto de telemetría
 * se pierda aunque el almacenamiento principal falle.
 */
export class DualTelemetryQueueStorage implements TelemetryQueueStorage {
  constructor(
    private principal: TelemetryQueueStorage,
    private fallback: TelemetryQueueStorage = indexedDBTelemetryStorage
  ) {}

  async read(): Promise<PuntoTelemetriaLocal[]> {
    const principales = await this.principal.read();
    if (principales.length > 0) return principales;
    if (esIndexedDBDisponible()) {
      return normalizar(await this.fallback.read());
    }
    return principales;
  }

  async write(items: PuntoTelemetriaLocal[]): Promise<void> {
    const normalizados = normalizar(items);
    // Escribir al storage principal (cifrado)
    await this.principal.write(normalizados);
    // Fallback obligatorio: escribir también en IndexedDB
    if (esIndexedDBDisponible()) {
      await this.fallback.write(normalizados).catch(() => {
        // IndexedDB no debe bloquear la operación principal
      });
    }
  }

  async clear(): Promise<void> {
    await this.principal.clear();
    if (esIndexedDBDisponible()) {
      await this.fallback.clear().catch(() => undefined);
    }
  }
}

let storageTelemetria: TelemetryQueueStorage = new DualTelemetryQueueStorage(
  new SecureTelemetryQueueStorage()
);

let operacionPendiente: Promise<unknown> = Promise.resolve();
function serializar<T>(operacion: () => Promise<T>): Promise<T> {
 const siguiente = operacionPendiente.then(operacion, operacion);
 operacionPendiente = siguiente.catch(() => undefined); return siguiente;
}
export function configurarStorageTelemetria(storage: TelemetryQueueStorage) {
  storageTelemetria = storage;
}

function normalizar(items: unknown): PuntoTelemetriaLocal[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => item as PuntoTelemetriaLocal)
    .filter((item) => item.usuarioId && item.localId && item.trasladoId && Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    .map((item) => ({
      ...item,
      attempts: Number.isInteger(item.attempts) && item.attempts >= 0 ? item.attempts : 0
    }));
}

function esPuntoIdentico(a: PuntoTelemetriaLocal, b: PuntoTelemetriaLocal) {
  return a.trasladoId === b.trasladoId && a.latitude === b.latitude && a.longitude === b.longitude && a.accuracyM === b.accuracyM;
}

function debeGuardarPunto(ultimo: PuntoTelemetriaLocal | undefined, siguiente: PuntoTelemetriaLocal) {
  if (!ultimo || ultimo.trasladoId !== siguiente.trasladoId) return true;
  if (siguiente.critical) return true;
  if (Date.parse(siguiente.deviceTimestamp) - Date.parse(ultimo.deviceTimestamp) >= 15_000) return true;
  if (esPuntoIdentico(ultimo, siguiente)) return false;
  return distanciaMetrosEntre(
    { lat: ultimo.latitude, lng: ultimo.longitude },
    { lat: siguiente.latitude, lng: siguiente.longitude }
  ) >= DISTANCIA_SIGNIFICATIVA_M;
}

function limitarTamano(items: PuntoTelemetriaLocal[]) {
  if (items.length <= MAX_PUNTOS_COLA) return items;
  const criticos = items.filter((item) => item.critical);
  const recientes = items.filter((item) => !item.critical).slice(-(MAX_PUNTOS_COLA - criticos.length));
  return [...criticos, ...recientes].slice(-MAX_PUNTOS_COLA);
}

async function encolarPuntoTelemetriaInterno(
  trasladoId: string,
  ubicacion: Coordenadas & { heading?: number | null },
  opciones: { usuarioId: string; critical?: boolean; localId?: string; deviceTimestamp?: string }
) {
  const cola = await leerColaTelemetria();
  if (!opciones.usuarioId) throw new Error("telemetry_queue_user_required");
  const punto: PuntoTelemetriaLocal = {
    usuarioId: opciones.usuarioId,
    localId: opciones.localId ?? crypto.randomUUID(),
    trasladoId,
    latitude: ubicacion.lat,
    longitude: ubicacion.lng,
    accuracyM: ubicacion.precisionM ?? null,
    speedMps: ubicacion.velocidadMps ?? null,
    heading: ubicacion.heading ?? null,
    deviceTimestamp: opciones.deviceTimestamp ?? new Date().toISOString(),
    attempts: 0,
    critical: opciones.critical ?? false
  };

  const ultimo = cola.at(-1);
  if (!debeGuardarPunto(ultimo, punto)) return false;

  await storageTelemetria.write(limitarTamano([...cola, punto]));
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ruum:telemetria-pendiente"));
  return true;
}

export async function leerColaTelemetria(trasladoId?: string) {
  const cola = normalizar(await storageTelemetria.read());
  return trasladoId ? cola.filter((item) => item.trasladoId === trasladoId) : cola;
}

export async function contarColaTelemetria() {
  return (await leerColaTelemetria()).length;
}

function puedeReintentarse(item: PuntoTelemetriaLocal, ahoraMs = Date.now()) {
  if (!item.lastAttemptAt) return true;
  const ultimoIntentoMs = new Date(item.lastAttemptAt).getTime();
  if (!Number.isFinite(ultimoIntentoMs)) return true;
  const backoff = BACKOFF_TELEMETRIA_MS[Math.min(item.attempts, BACKOFF_TELEMETRIA_MS.length - 1)] ?? BACKOFF_TELEMETRIA_MS.at(-1)!;
  return ahoraMs - ultimoIntentoMs >= backoff;
}

async function marcarFallo(item: PuntoTelemetriaLocal) {
  const ahora = new Date().toISOString();
  const cola = await leerColaTelemetria();
  await storageTelemetria.write(
    cola.map((existente) =>
      existente.localId === item.localId
        ? { ...existente, attempts: existente.attempts + 1, lastAttemptAt: ahora }
        : existente
    )
  );
}

async function quitarConfirmado(localId: string) {
  const cola = await leerColaTelemetria();
  await storageTelemetria.write(cola.filter((item) => item.localId !== localId));
}

async function sincronizarColaTelemetriaInterno(
  cliente: SupabaseClient<Database>,
  opciones: { ignoreBackoff?: boolean } = {}
) {
  const { data: sesion, error: authError } = await cliente.auth.getUser();
  if (authError) throw authError;
  if (!sesion.user) return 0;
  const cola = await leerColaTelemetria();
  const items = cola.filter((item) => item.usuarioId === sesion.user!.id && (opciones.ignoreBackoff || puedeReintentarse(item)));
  let sincronizados = 0;
  let ultimoError: unknown;

  for (const item of items) {
    try {
      const data = await registrarLoteTelemetria(cliente, item.trasladoId, [{
        localId: item.localId,
        deviceTimestamp: item.deviceTimestamp,
        lat: item.latitude,
        lng: item.longitude,
        precisionM: item.accuracyM ?? null,
        velocidadMps: item.speedMps ?? null,
        fuente: "web_foreground",
        online: true
        }]);
      if (!data?.aceptados?.includes(item.localId) && !data?.duplicadosIds?.includes(item.localId)) {
        throw new Error("telemetry_point_not_acknowledged");
      }
      await quitarConfirmado(item.localId);
      sincronizados += 1;
    } catch (error) {
      await marcarFallo(item);
      ultimoError = error;
    }
  }

  if (sincronizados > 0 && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ruum:telemetria-sincronizada"));
  if (ultimoError) throw ultimoError;
  return sincronizados;
}

export async function limpiarColaTelemetria() {
  await storageTelemetria.clear();
}

export const OFFLINE_TELEMETRY_QUEUE_KEY = CLAVE_COLA_TELEMETRIA;

export function encolarPuntoTelemetria(...args: Parameters<typeof encolarPuntoTelemetriaInterno>) {
  return serializar(() => encolarPuntoTelemetriaInterno(...args));
}

export function sincronizarColaTelemetria(...args: Parameters<typeof sincronizarColaTelemetriaInterno>) {
  return serializar(() => sincronizarColaTelemetriaInterno(...args));
}
