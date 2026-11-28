import {
  descargarArchivoEvidenciaStorage,
  registrarConflictoEvidencia,
  guardarFotoEvidenciaSincronizada,
  subirArchivoEvidenciaStorage
} from "@ruum/api/custody";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { createLogger, errorCode } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "./supabase-browser";
import { withTimeout } from "./with-timeout";
import { recordOperationalEvent } from "./observability";

// PERF-004 — timeouts para sync offline
const TIMEOUT_UPLOAD_MS = 15_000;
const TIMEOUT_UPSERT_MS = 10_000;
import {
  eliminarJsonLocalSeguro,
  guardarJsonLocalSeguro,
  leerJsonLocalSeguro
} from "./almacenamiento-seguro-local";
import { registrarEvidenciaDescartada } from "./evidencias-descartadas";

const CLAVE_COLA = "ruum_cola_evidencia";
const CLAVE_BIN_PREFIX = "ruum_evidencia_bin_";
const logger = createLogger("evidencia_offline");
const BACKOFF_REINTENTO_MS = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000
];

export const TTL_COLA_EVIDENCIA_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
export const MAX_REINTENTOS_EVIDENCIA = 15;

export interface ItemColaEvidencia {
  usuarioId: string;
  /** UUID generado en el dispositivo — es la clave de idempotencia al subir (ver propuesta de arquitectura, sección 5). */
  localId: string;
  trasladoId: string;
  tipo: "inicial" | "final";
  angulo: string;
  dataUrl: string;
  fileName?: string;
  fileSizeBytes?: number;
  sha256?: string;
  requisitoId?: string;
  lat?: number;
  lng?: number;
  capturadaEn: string;
  retryCount: number;
  lastAttemptAt?: string;
  lastErrorCode?: string;
  conflictoCustodia?: true;
}

export interface EvidenceQueueStorage {
  read(): Promise<ItemColaEvidencia[]>;
  write(items: ItemColaEvidencia[]): Promise<void>;
  clear(): Promise<void>;
}

export class CapacitorPreferencesEvidenceStorage implements EvidenceQueueStorage {
  async read(): Promise<ItemColaEvidencia[]> {
    try {
      const data = await leerJsonLocalSeguro<ItemColaEvidencia[]>(CLAVE_COLA);
      if (!data) return [];
      return normalizarItemsCola(data);
    } catch (err) {
      logger.warn("evidence_queue_read_failed", { error: errorCode(err) });
      return [];
    }
  }

  async write(items: ItemColaEvidencia[]): Promise<void> {
    await guardarJsonLocalSeguro(CLAVE_COLA, normalizarItemsCola(items));
  }

  async clear(): Promise<void> {
    await eliminarJsonLocalSeguro(CLAVE_COLA);
  }
}

export class InMemoryEvidenceStorage implements EvidenceQueueStorage {
  private items: ItemColaEvidencia[];

  constructor(initialItems: ItemColaEvidencia[] = []) {
    this.items = normalizarItemsCola(initialItems);
  }

  async read(): Promise<ItemColaEvidencia[]> {
    return normalizarItemsCola(this.items);
  }

  async write(items: ItemColaEvidencia[]): Promise<void> {
    this.items = normalizarItemsCola(items);
  }

  async clear(): Promise<void> {
    this.items = [];
  }
}

async function usuarioActualId(): Promise<string | null> {
  if (!tieneSupabaseConfigurado()) return null;
  try {
    const { data } = await crearClienteNavegador().auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

let storageColaEvidencia: EvidenceQueueStorage = new CapacitorPreferencesEvidenceStorage();

export function configurarStorageColaEvidencia(storage: EvidenceQueueStorage) {
  storageColaEvidencia = storage;
}

export function obtenerStorageColaEvidencia(): EvidenceQueueStorage {
  return storageColaEvidencia;
}

// P1 mediano plazo: binarios fuera del JSON principal, en storage privado cifrado por item
const CLAVE_BIN_PREFIX_INTERNAL = CLAVE_BIN_PREFIX;
async function guardarBinarioEvidencia(localId: string, dataUrl: string): Promise<void> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return;
  try {
    await guardarJsonLocalSeguro(CLAVE_BIN_PREFIX_INTERNAL + localId, { dataUrl });
  } catch (err) {
    logger.warn("evidence_binary_store_failed", { localId, error: errorCode(err) });
    throw err;
  }
}
async function leerBinarioEvidencia(localId: string): Promise<string | null> {
  try {
    const data = await leerJsonLocalSeguro<{ dataUrl: string }>(CLAVE_BIN_PREFIX_INTERNAL + localId);
    return data?.dataUrl ?? null;
  } catch {
    return null;
  }
}
async function eliminarBinarioEvidencia(localId: string): Promise<void> {
  try {
    await eliminarJsonLocalSeguro(CLAVE_BIN_PREFIX_INTERNAL + localId);
  } catch {}
}
async function obtenerDataUrlParaItem(item: ItemColaEvidencia): Promise<string> {
  if (item.dataUrl && item.dataUrl.startsWith("data:")) return item.dataUrl;
  const fromFile = await leerBinarioEvidencia(item.localId);
  if (fromFile) return fromFile;
  return item.dataUrl;
}
async function limpiarBinariosDeCola(items: ItemColaEvidencia[]): Promise<void> {
  await Promise.all(items.map((it) => eliminarBinarioEvidencia(it.localId)));
}

/**
 * Cola local de evidencia pendiente de subir. La propuesta de arquitectura
 * original (sección 11) planteaba SQLite local; la lógica de cola ya depende
 * de EvidenceQueueStorage para poder sustituir Preferences por SQLite o
 * IndexedDB sin cambiar el contrato que consume la pantalla de evidencia.
 */

/**
 * Lectura cruda sin filtro de usuario — uso interno para escrituras que
 * deben preservar todos los usuarios en el dispositivo.
 * Exportada solo para tests/ diagnóstico; la UI debe seguir usando leerColaEvidencia().
 */
export async function leerColaEvidenciaCompleta(): Promise<ItemColaEvidencia[]> {
  return normalizarItemsCola(await storageColaEvidencia.read());
}

async function encolarEvidenciaInterna(item: ItemColaEvidencia): Promise<void> {
  if (!item.usuarioId) throw new Error("evidence_queue_user_required");
  const colaCompleta = await leerColaEvidenciaCompleta();
  const itemNormalizado = normalizarItemCola(item);
  itemNormalizado.sha256 = await hashBlob(blobDesdeDataUrl(await obtenerDataUrlParaItem(itemNormalizado)));
  const dataUrlOriginal = itemNormalizado.dataUrl;
  // P1 mediano plazo: guardar binario fuera del JSON principal (cifrado por item)
  // En la cola principal guardar solo metadata (sin dataUrl grande) — se reconstruye al leer para UI/sync
  const itemParaCola: ItemColaEvidencia = { ...itemNormalizado, dataUrl: "" };
  // No reemplazar capturas diferentes; reintento idéntico conserva ID y metadatos.
  const mismoId = colaCompleta.find((ex) => ex.localId === itemParaCola.localId);
  if (mismoId && (mismoId.usuarioId !== itemParaCola.usuarioId || mismoId.trasladoId !== itemParaCola.trasladoId || mismoId.tipo !== itemParaCola.tipo || mismoId.angulo !== itemParaCola.angulo || mismoId.sha256 !== itemParaCola.sha256)) throw new Error("evidence_capture_identity_conflict");
  const identica = colaCompleta.find((ex) => ex.usuarioId === itemParaCola.usuarioId && ex.trasladoId === itemParaCola.trasladoId && ex.tipo === itemParaCola.tipo && ex.angulo === itemParaCola.angulo && ex.sha256 === itemParaCola.sha256);
  if (identica) return;
  if (dataUrlOriginal && dataUrlOriginal.startsWith("data:")) await guardarBinarioEvidencia(itemNormalizado.localId, dataUrlOriginal);
  await storageColaEvidencia.write([...colaCompleta, itemParaCola]);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ruum:evidencia-pendiente"));
}

export async function leerColaEvidencia(trasladoId?: string, usuarioIdExplicito?: string): Promise<ItemColaEvidencia[]> {
  const cola = await leerColaEvidenciaCompleta();
  // Enriquecer con binario para UI/sync (mantener cola principal ligera)
  const colaConBinario = await Promise.all(
    cola.map(async (it) => {
      if (!it.dataUrl || !it.dataUrl.startsWith("data:")) {
        const bin = await leerBinarioEvidencia(it.localId);
        if (bin) return { ...it, dataUrl: bin };
      }
      return it;
    })
  );
  const usuarioId = usuarioIdExplicito ?? await usuarioActualId();
  const porUsuario = usuarioId ? colaConBinario.filter((item) => item.usuarioId === usuarioId) : colaConBinario;
  return trasladoId ? porUsuario.filter((item) => item.trasladoId === trasladoId) : porUsuario;
}

async function quitarDeColaEvidenciaInterna(localId: string): Promise<void> {
  const colaCompleta = await leerColaEvidenciaCompleta();
  const restante = colaCompleta.filter((item) => item.localId !== localId);
  await storageColaEvidencia.write(restante);
  await eliminarBinarioEvidencia(localId);
}

export async function contarColaEvidencia(trasladoId?: string, usuarioIdExplicito?: string): Promise<number> {
  const cola = await leerColaEvidencia(trasladoId, usuarioIdExplicito);
  return cola.length;
}

export async function leerColaEvidenciaDeTraslado(trasladoId: string): Promise<ItemColaEvidencia[]> {
  const cola = await leerColaEvidencia();
  return cola.filter((item) => item.trasladoId === trasladoId);
}

export async function limpiarColaEvidenciaDeUsuario(usuarioId: string): Promise<void> {
  const colaCompleta = await leerColaEvidenciaCompleta();
  const aBorrar = colaCompleta.filter((item) => item.usuarioId === usuarioId);
  const restante = colaCompleta.filter((item) => item.usuarioId !== usuarioId);
  await storageColaEvidencia.write(restante);
  await limpiarBinariosDeCola(aBorrar);
}

export async function limpiarColaEvidenciaCompleta(): Promise<void> {
  const colaCompleta = await leerColaEvidenciaCompleta();
  await storageColaEvidencia.clear();
  await limpiarBinariosDeCola(colaCompleta);
}

/**
 * Limpieza segura: por defecto solo borra evidencia del usuario actual,
 * nunca de otros usuarios en el mismo dispositivo. Pasar `null` fuerza borrado
 * total (uso exclusivo en force-logout con autorización explícita).
 */
export async function limpiarColaEvidencia(usuarioIdExplicito?: string | null): Promise<void> {
  if (usuarioIdExplicito !== undefined) {
    if (usuarioIdExplicito === null) {
      await limpiarColaEvidenciaCompleta();
      return;
    }
    await limpiarColaEvidenciaDeUsuario(usuarioIdExplicito);
    return;
  }
  const usuarioId = await usuarioActualId();
  if (usuarioId) {
    await limpiarColaEvidenciaDeUsuario(usuarioId);
  } else {
    // Sin sesión (tests / preview sin Supabase): clear total por compatibilidad
    await limpiarColaEvidenciaCompleta();
  }
}

function extensionDesdeDataUrl(dataUrl: string) {
  const match = /^data:image\/([a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
  const formato = match?.[1]?.toLowerCase();
  if (formato === "jpeg") return "jpg";
  if (formato === "png" || formato === "webp" || formato === "jpg") return formato;
  return "jpg";
}

function blobDesdeDataUrl(dataUrl: string): Blob {
  const [metadata, base64] = dataUrl.split(",");
  if (!metadata || !base64) {
    throw new Error("Foto local inválida: no tiene formato data URL.");
  }

  const mime = /^data:([^;]+);base64$/.exec(metadata)?.[1] ?? "image/jpeg";
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
}

function isOnline() {
  if (typeof navigator === "undefined") return null;
  return navigator.onLine;
}

/**
 * Huella sha256 (hex) del archivo de evidencia.
 *
 * Es lo que define la identidad de la evidencia en la cadena de custodia: un
 * reintento de la cola con el mismo contenido tiene la misma huella (es
 * idempotente) y un contenido distinto es un conflicto que hay que escalar.
 */
export async function calcularSha256(dataUrl: string): Promise<string | null> {
  try {
    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/** El objeto ya existe en Storage (subida parcial previa): no es un error. */
function esObjetoExistente(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const info = error as { statusCode?: number | string; status?: number | string; code?: string; error?: string; message?: string };
  const estado = info.statusCode ?? info.status;
  if (String(estado) === "409") return true;
  const texto = `${info.code ?? ""} ${info.error ?? ""} ${info.message ?? ""}`.toLowerCase();
  return texto.includes("already exists") || texto.includes("duplicate");
}

function esItemValidoYTolerable(item: ItemColaEvidencia, ahoraMs = Date.now()): boolean {
  if (!item || typeof item !== "object") return false;
  if (!item.localId || !item.usuarioId || !item.trasladoId) return false;
  // dataUrl puede estar vacío si el binario está en storage separado (mediano plazo); se valida al sincronizar

  if (item.capturadaEn) {
    const capturadaMs = new Date(item.capturadaEn).getTime();
    if (Number.isFinite(capturadaMs) && ahoraMs - capturadaMs > TTL_COLA_EVIDENCIA_MS) {
      logger.warn("evidence_item_purged_ttl", { localId: item.localId, tripId: item.trasladoId });
      void recordOperationalEvent("evidence_stuck", {
        localId: item.localId,
        trasladoId: item.trasladoId,
        scope: "evidencia|offline",
        razon: "ttl_expirado_7d"
      }, "error");
      const detalle = {
        localId: item.localId,
        trasladoId: item.trasladoId,
        razon: "ttl_expirado",
        angulo: item.angulo,
        tipo: item.tipo,
        fecha: new Date().toISOString()
      };
      void registrarEvidenciaDescartada(detalle);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ruum:evidencia-descartada", {
          detail: detalle
        }));
      }
      return false;
    }
  }

  if (item.conflictoCustodia !== true && typeof item.retryCount === "number" && item.retryCount > MAX_REINTENTOS_EVIDENCIA) {
    logger.warn("evidence_item_purged_max_retries", { localId: item.localId, tripId: item.trasladoId, retryCount: item.retryCount });
    void recordOperationalEvent("evidence_stuck", {
      localId: item.localId,
      trasladoId: item.trasladoId,
      retryCount: item.retryCount,
      scope: "evidencia|offline",
      razon: "max_reintentos_excedido"
    }, "error");
    const detalle = {
      localId: item.localId,
      trasladoId: item.trasladoId,
      razon: "max_reintentos",
      angulo: item.angulo,
      tipo: item.tipo,
      fecha: new Date().toISOString()
    };
    void registrarEvidenciaDescartada(detalle);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ruum:evidencia-descartada", {
        detail: detalle
      }));
    }
    return false;
  }

  return true;
}

function normalizarItemCola(item: ItemColaEvidencia): ItemColaEvidencia {
  let fileSizeBytes = item.fileSizeBytes;
  if (!fileSizeBytes && typeof item.dataUrl === "string") {
    const b64 = item.dataUrl.split(",")[1] ?? "";
    fileSizeBytes = Math.floor(b64.length * 0.75);
  }

  return {
    ...item,
    fileSizeBytes,
    retryCount: Number.isInteger(item.retryCount) && item.retryCount >= 0 ? item.retryCount : 0,
    ...(typeof item.lastAttemptAt === "string" ? { lastAttemptAt: item.lastAttemptAt } : {}),
    ...(typeof item.lastErrorCode === "string" ? { lastErrorCode: item.lastErrorCode } : {})
  };
}

function normalizarItemsCola(valor: unknown, ahoraMs = Date.now()): ItemColaEvidencia[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((item) => esItemValidoYTolerable(item as ItemColaEvidencia, ahoraMs))
    .map((item) => normalizarItemCola(item as ItemColaEvidencia));
}

function backoffMsParaIntentos(retryCount: number) {
  if (retryCount <= 0) return 0;
  return BACKOFF_REINTENTO_MS[Math.min(retryCount - 1, BACKOFF_REINTENTO_MS.length - 1)];
}

function puedeReintentarse(item: ItemColaEvidencia, ahoraMs = Date.now()) {
  if (!item.lastAttemptAt) return true;
  const ultimoIntentoMs = new Date(item.lastAttemptAt).getTime();
  if (!Number.isFinite(ultimoIntentoMs)) return true;
  return ahoraMs - ultimoIntentoMs >= backoffMsParaIntentos(item.retryCount);
}

async function registrarIntentoFallido(item: ItemColaEvidencia, error: unknown, conflicto: boolean) {
  const colaCompleta = await leerColaEvidenciaCompleta();
  const codigo = errorCode(error);
  const ahora = new Date().toISOString();
  await storageColaEvidencia.write(
    colaCompleta.map((existente) =>
      existente.localId === item.localId
        ? {
            ...existente,
            retryCount: existente.retryCount + 1,
            lastAttemptAt: ahora,
            lastErrorCode: codigo,
            ...(conflicto ? { conflictoCustodia: true as const } : {})
          }
        : existente
    )
  );
  return {
    ...item,
    retryCount: item.retryCount + 1,
    lastAttemptAt: ahora,
    lastErrorCode: codigo
  };
}

function logEvidenceSyncFailed(
  item: ItemColaEvidencia,
  stage: "auth" | "local_payload" | "storage_upload" | "evidence_insert" | "evidence_upsert",
  error: unknown,
  queueSize: number
) {
  logger.error(
    "evidence_sync_failed",
    {
      tripId: item.trasladoId,
      evidenceType: item.tipo,
      angle: item.angulo,
      isOnline: isOnline(),
      retryCount: item.retryCount,
      lastAttemptAt: item.lastAttemptAt ?? null,
      lastErrorCode: item.lastErrorCode ?? null,
      queueSize,
      stage,
      errorCode: errorCode(error)
    },
    "offline_recoverable"
  );
}

async function sincronizarColaEvidenciaInterna(
  cliente: SupabaseClient<Database>,
  opciones: {
    trasladoId?: string;
    ignoreBackoff?: boolean;
    onItemSincronizado?: (item: ItemColaEvidencia) => void | Promise<void>;
  } = {}
) {
  const { data: sesionActual, error } = await cliente.auth.getUser();
  if (error) throw error;
  const authUserId = sesionActual.user?.id;
  if (!authUserId) throw new Error("No hay sesión para subir evidencia.");

  const cola = (await leerColaEvidenciaCompleta()).filter((item) =>
    item.usuarioId === authUserId && (!opciones.trasladoId || item.trasladoId === opciones.trasladoId)
  );
  const items = cola.filter((item) =>
    item.conflictoCustodia !== true && (opciones.ignoreBackoff || puedeReintentarse(item))
  );
  let sincronizadas = 0;
  let primerError: { causa: unknown } | undefined;

  for (const item of items) {
    let stage: Parameters<typeof logEvidenceSyncFailed>[1] = "local_payload";
    let conflicto = false;

    try {
      const dataUrl = await obtenerDataUrlParaItem(item);
      const blob = blobDesdeDataUrl(dataUrl);
      const hash = await hashBlob(blob);
      if (item.sha256 && item.sha256 !== hash) {
        conflicto = true;
        throw new Error("evidence_local_hash_conflict");
      }

      stage = "storage_upload";
      const extension = extensionDesdeDataUrl(dataUrl);
      const ruta = `${authUserId}/${item.trasladoId}/${item.tipo}/${item.localId}-${item.angulo}.${extension}`;
      const { error: uploadError } = await withTimeout(
        subirArchivoEvidenciaStorage(cliente, ruta, blob, { upsert: false, contentType: blob.type || "image/jpeg" }),
        TIMEOUT_UPLOAD_MS,
        `storage_upload:${item.localId}`
      );
      if (uploadError) {
        if (!esObjetoExistente(uploadError)) throw uploadError;
        const { data: existente, error: descargaError } = await withTimeout(
          descargarArchivoEvidenciaStorage(cliente, ruta),
          TIMEOUT_UPLOAD_MS,
          `storage_download:${item.localId}`
        );
        if (descargaError || !existente) throw descargaError ?? new Error("evidence_existing_object_unverified");
        const hashExistente = await hashBlob(existente);
        if (hashExistente !== hash) {
          conflicto = true;
          await withTimeout(
            registrarConflictoEvidencia(cliente, { captura_id: item.localId, traslado_id: item.trasladoId, ruta, sha256_esperado: hash, sha256_observado: hashExistente }),
            TIMEOUT_UPSERT_MS,
            `evidence_conflict:${item.localId}`
          );
          throw new Error("evidence_storage_hash_conflict");
        }
      }

      stage = "evidence_insert";
      const resultado = await withTimeout(
        guardarFotoEvidenciaSincronizada(cliente, {
          id: item.localId,
          traslado_id: item.trasladoId,
          tipo: item.tipo,
          angulo: item.angulo as Database["public"]["Enums"]["angulo_evidencia"],
          url: ruta,
          local_path: null,
          capturada_en: item.capturadaEn,
          lat: item.lat ?? null,
          lng: item.lng ?? null,
          sincronizada: true,
          sha256: hash,
        }),
        TIMEOUT_UPSERT_MS,
        `evidence_insert:${item.localId}`
      );
      if (resultado.estado === "conflicto") {
        conflicto = true;
        throw new Error("evidence_checksum_conflict");
      }

      await quitarDeColaEvidenciaInterna(item.localId);
    } catch (error) {
      const actualizado = await registrarIntentoFallido(item, error, conflicto);
      logEvidenceSyncFailed(actualizado, stage, error, cola.length);
      if (conflicto) {
        void recordOperationalEvent("evidence_stuck", {
          localId: item.localId,
          trasladoId: item.trasladoId,
          scope: "evidencia|custodia",
          razon: "conflicto_sha256"
        }, "error");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ruum:evidencia-conflicto", {
            detail: { localId: item.localId, trasladoId: item.trasladoId }
          }));
        }
      } else {
        primerError ??= { causa: error };
      }
      continue;
    }

    sincronizadas += 1;
    try {
      await opciones.onItemSincronizado?.(item);
    } catch (error) {
      logger.warn("evidence_sync_notification_failed", { errorCode: errorCode(error), localId: item.localId });
    }
  }

  if (sincronizadas > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ruum:evidencia-sincronizada"));
  }

  if (primerError && sincronizadas === 0) throw primerError.causa;
  return sincronizadas;
}

/**
 * Un lote recorre cada captura una vez bajo el mismo bloqueo de cola.
 * Conserva timeouts y errores; no repite el traslado completo por cada foto.
 * Uso: sincronizarColaEvidenciaBulk(cliente, { trasladoId })
 */
export async function sincronizarColaEvidenciaBulk(
  cliente: SupabaseClient<Database>, opciones: { trasladoId?: string; ignoreBackoff?: boolean } = {}
): Promise<number> {
  // Una sola pasada. Antes cada tarea volvía a sincronizar todo el traslado.
  return sincronizarColaEvidencia(cliente, opciones);
}

let operacionCola: Promise<unknown> = Promise.resolve();
function serializar<T>(fn: () => Promise<T>): Promise<T> {
  const p = operacionCola.then(fn, fn); operacionCola = p.catch(() => undefined); return p;
}
async function conLockNavegador<T>(fn: () => Promise<T>): Promise<T> {
  return typeof navigator !== "undefined" && navigator.locks ? await navigator.locks.request("ruum-evidencia-queue", fn) : fn();
}
export function encolarEvidencia(...args: Parameters<typeof encolarEvidenciaInterna>) { return serializar(() => conLockNavegador(() => encolarEvidenciaInterna(...args))); }
export function sincronizarColaEvidencia(...args: Parameters<typeof sincronizarColaEvidenciaInterna>) { return serializar(() => conLockNavegador(() => sincronizarColaEvidenciaInterna(...args))); }
export async function hashBlob(blob: Blob): Promise<string> { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))).map((n) => n.toString(16).padStart(2,"0")).join(""); }
