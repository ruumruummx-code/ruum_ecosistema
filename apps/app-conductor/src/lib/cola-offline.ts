import {
  guardarFotoEvidenciaSincronizada,
  subirArchivoEvidenciaStorage,
  type ResultadoGuardadoEvidencia
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
const BUCKET_EVIDENCIA = "evidencia";
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

export async function encolarEvidencia(item: ItemColaEvidencia): Promise<void> {
  if (!item.usuarioId) throw new Error("evidence_queue_user_required");
  const colaCompleta = await leerColaEvidenciaCompleta();
  const itemNormalizado = normalizarItemCola(item);
  const dataUrlOriginal = itemNormalizado.dataUrl;
  // P1 mediano plazo: guardar binario fuera del JSON principal (cifrado por item)
  if (dataUrlOriginal && dataUrlOriginal.startsWith("data:")) {
    await guardarBinarioEvidencia(itemNormalizado.localId, dataUrlOriginal);
  }
  // En la cola principal guardar solo metadata (sin dataUrl grande) — se reconstruye al leer para UI/sync
  const itemParaCola: ItemColaEvidencia = { ...itemNormalizado, dataUrl: "" };
  // Deduplicar SOLO contra items del mismo usuario + mismo traslado/tipo/ángulo/sha — nunca contra otros usuarios
  const restantes = colaCompleta.filter((existente) => {
    if (existente.localId === itemParaCola.localId) return false;
    if (existente.usuarioId !== itemParaCola.usuarioId) return true;
    const mismoSlot =
      existente.trasladoId === itemParaCola.trasladoId &&
      existente.tipo === itemParaCola.tipo &&
      existente.angulo === itemParaCola.angulo;
    if (mismoSlot) return false;
    const mismoSha =
      Boolean(existente.sha256 && itemParaCola.sha256) &&
      existente.trasladoId === itemParaCola.trasladoId &&
      existente.sha256 === itemParaCola.sha256;
    if (mismoSha) return false;
    return true;
  });
  // Si se reemplaza un slot, limpiar binario del item reemplazado
  const reemplazados = colaCompleta.filter((ex) => !restantes.includes(ex) && ex.localId !== itemParaCola.localId);
  if (reemplazados.length > 0) await limpiarBinariosDeCola(reemplazados);
  await storageColaEvidencia.write([...restantes, itemParaCola]);
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

export async function quitarDeColaEvidencia(localId: string): Promise<void> {
  const colaCompleta = await leerColaEvidenciaCompleta();
  const restante = colaCompleta.filter((item) => item.localId !== localId);
  await storageColaEvidencia.write(restante);
  await eliminarBinarioEvidencia(localId);
}

export async function contarColaEvidencia(trasladoId?: string): Promise<number> {
  const cola = await leerColaEvidencia();
  return trasladoId ? cola.filter((item) => item.trasladoId === trasladoId).length : cola.length;
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
function esObjetoYaExistente(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const info = error as { statusCode?: number; status?: number; code?: string; message?: string };
  const estado = info.statusCode ?? info.status;
  if (estado === 409) return true;
  const texto = `${info.code ?? ""} ${info.message ?? ""}`.toLowerCase();
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

  if (typeof item.retryCount === "number" && item.retryCount > MAX_REINTENTOS_EVIDENCIA) {
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

async function registrarIntentoFallido(item: ItemColaEvidencia, error: unknown) {
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
            lastErrorCode: codigo
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

export async function sincronizarColaEvidencia(
  cliente: SupabaseClient<Database>,
  opciones: {
    trasladoId?: string;
    ignoreBackoff?: boolean;
    onItemSincronizado?: (item: ItemColaEvidencia) => void | Promise<void>;
  } = {}
) {
  const cola = await leerColaEvidencia();
  const itemsBase = opciones.trasladoId ? cola.filter((item) => item.trasladoId === opciones.trasladoId) : cola;
  const items = opciones.ignoreBackoff ? itemsBase : itemsBase.filter((item) => puedeReintentarse(item));
  let sincronizadas = 0;
  let conflictos = 0;

  // Validar sesión UNA sola vez por ciclo de sync (no por item) para evitar
  // N round-trips de Auth en redes lentas (3G). authUserId se reusa para todos los items.
  const { data: sesion } = await cliente.auth.getUser();
  const authUserId = sesion.user?.id;
  if (!authUserId) {
    const error = new Error("No hay sesión para subir evidencia.");
    // Registrar intento fallido para cada item pendiente
    for (const item of items) {
      const actualizado = await registrarIntentoFallido(item, error);
      logEvidenceSyncFailed(actualizado, "auth", error, itemsBase.length);
    }
    throw error;
  }

  for (const item of items) {
    let blob: Blob;
    let dataUrlEfectivo: string;
    try {
      dataUrlEfectivo = await obtenerDataUrlParaItem(item);
      blob = blobDesdeDataUrl(dataUrlEfectivo);
    } catch (error) {
      const actualizado = await registrarIntentoFallido(item, error);
      logEvidenceSyncFailed(actualizado, "local_payload", error, itemsBase.length);
      throw error;
    }

    const extension = extensionDesdeDataUrl(dataUrlEfectivo);
    const ruta = `${authUserId}/${item.trasladoId}/${item.tipo}/${item.localId}-${item.angulo}.${extension}`;
    // La huella del archivo define la identidad de la evidencia en la cadena de
    // custodia: es lo que permite distinguir un reintento idempotente de un
    // intento de sobrescribir.
    const sha256 = await calcularSha256(dataUrlEfectivo);
    const { error: uploadError } = await withTimeout(
      subirArchivoEvidenciaStorage(cliente, ruta, blob, {
        upsert: false,
        contentType: blob.type || "image/jpeg",
      }) as Promise<{ error: unknown | null }>,
      TIMEOUT_UPLOAD_MS,
      `storage_upload:${item.localId}`
    );
    // `upsert: false`: la evidencia registrada no se sobrescribe nunca. Si el
    // objeto ya existe es porque una subida parcial previa dejó el archivo en
    // su sitio: se conserva y sigue el flujo (el insert de abajo decide).
    if (uploadError && !esObjetoYaExistente(uploadError)) {
      const actualizado = await registrarIntentoFallido(item, uploadError);
      logEvidenceSyncFailed(actualizado, "storage_upload", uploadError, itemsBase.length);
      throw uploadError;
    }

    let evidenciaError: unknown | null = null;
    let resultado: ResultadoGuardadoEvidencia | null = null;
    try {
      resultado = await withTimeout(
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
          sha256
        }),
        TIMEOUT_UPSERT_MS,
        `evidence_insert:${item.localId}`
      );
    } catch (error) {
      evidenciaError = error;
    }

    if (evidenciaError) {
      const actualizado = await registrarIntentoFallido(item, evidenciaError);
      logEvidenceSyncFailed(actualizado, "evidence_insert", evidenciaError, itemsBase.length);
      throw evidenciaError;
    }

    if (resultado && resultado.estado === "conflicto") {
      // Conflicto de cadena de custodia: el archivo no coincide con el ya
      // registrado. No se reintenta (reintentar no lo resuelve) y la evidencia
      // queda marcada en conflicto con la incidencia abierta a soporte.
      await quitarDeColaEvidencia(item.localId);
      conflictos += 1;
      logger.error(
        "evidence_checksum_conflict",
        {
          tripId: item.trasladoId,
          evidenceType: item.tipo,
          angle: item.angulo,
          localId: item.localId,
          sha256Registrado: resultado.sha256Registrado,
          sha256Recibido: resultado.sha256Recibido,
          queueSize: itemsBase.length
        },
        "security_event"
      );
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
      continue;
    }

    await quitarDeColaEvidencia(item.localId);
    sincronizadas += 1;
    await opciones.onItemSincronizado?.(item);
  }

  if (sincronizadas > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ruum:evidencia-sincronizada"));
  }

  if (conflictos > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ruum:evidencia-conflicto-resuelto", { detail: { conflictos } }));
  }

  return sincronizadas;
}

/**
 * Nota: sincronizarColaEvidenciaBulk fue eliminada (muerto y roto, O(n²)).
 * Usar sincronizarColaEvidencia directamente, que ya valida auth una sola vez
 * por ciclo de sync y procesa items de forma secuencial con timeouts.
 */
