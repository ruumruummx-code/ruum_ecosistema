import { Redis } from "@upstash/redis";

export interface RateLimitStore {
  /**
   * Incrementa el contador para la clave dada y devuelve { count, resetAt }.
   * resetAt es el timestamp de expiración de la ventana actual (ms).
   */
  increment(clave: string, ventanaMs: number): Promise<{ count: number; resetAt: number }>;
}

const MAX_MEMORY_KEYS = 5000;
const REDIS_REINTENTO_MS = 30_000;

let redisClient: Redis | null | undefined;
let redisUltimoFalloMs = 0;

export function getRedisClient(): Redis | null {
  if (redisClient !== undefined && redisClient !== null) return redisClient;
  if (redisClient === null && Date.now() - redisUltimoFalloMs < REDIS_REINTENTO_MS) {
    return null;
  }
  const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  if (!hasUpstash && !hasKv) {
    redisClient = null;
    redisUltimoFalloMs = Date.now();
    return null;
  }

  try {
    if (hasUpstash) {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!
      });
      return redisClient;
    }
    if (hasKv) {
      redisClient = new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!
      });
      return redisClient;
    }
    redisClient = Redis.fromEnv();
    return redisClient;
  } catch {
    redisClient = null;
    redisUltimoFalloMs = Date.now();
    return null;
  }
}

export class MemoryRateLimitStore implements RateLimitStore {
  private datos = new Map<string, { count: number; resetAt: number }>();

  async increment(clave: string, ventanaMs: number): Promise<{ count: number; resetAt: number }> {
    const ahora = Date.now();
    const existente = this.datos.get(clave);

    if (!existente || ahora > existente.resetAt) {
      this.purgarMemoria(ahora);
      this.datos.set(clave, { count: 1, resetAt: ahora + ventanaMs });
      return { count: 1, resetAt: ahora + ventanaMs };
    }

    existente.count += 1;
    return { count: existente.count, resetAt: existente.resetAt };
  }

  clear() {
    this.datos.clear();
  }

  get size(): number {
    return this.datos.size;
  }

  private purgarMemoria(now: number) {
    if (this.datos.size <= MAX_MEMORY_KEYS) return;
    for (const [k, v] of this.datos) {
      if (now > v.resetAt) this.datos.delete(k);
      if (this.datos.size <= MAX_MEMORY_KEYS) return;
    }
    const exceso = this.datos.size - MAX_MEMORY_KEYS;
    let eliminadas = 0;
    for (const k of this.datos.keys()) {
      this.datos.delete(k);
      eliminadas += 1;
      if (eliminadas >= exceso) break;
    }
  }
}

export class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async increment(clave: string, ventanaMs: number): Promise<{ count: number; resetAt: number }> {
    const ttlSec = Math.ceil(ventanaMs / 1000);
    const key = `rl:${clave}`;
    await this.redis.set(key, "0", { nx: true, ex: ttlSec });
    const count = (await this.redis.incr(key)) as number;
    let ttl = (await this.redis.ttl(key)) as number;
    if (ttl <= 0) ttl = ttlSec;
    return { count, resetAt: Date.now() + ttl * 1000 };
  }
}

export const defaultMemoryStore = new MemoryRateLimitStore();

export function __resetRateLimitStateForTest() {
  redisClient = undefined;
  redisUltimoFalloMs = 0;
  defaultMemoryStore.clear();
}

export interface RateLimitOptions {
  max: number;
  ventanaMs: number;
  clave?: string;
  failClosed?: boolean;
  store?: RateLimitStore;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec?: number;
  degraded?: boolean;
}

/**
 * Evalúa rate-limit distribuido con soporte Upstash Redis, fallback en memoria y degradación controlada.
 */
export async function rateLimitDistribuido(
  identificador: string | null | undefined,
  opciones: RateLimitOptions
): Promise<RateLimitResult> {
  const clave = opciones.clave ? `${opciones.clave}:${identificador ?? "anon"}` : (identificador ?? "anon");
  const ahora = Date.now();

  if (!identificador) {
    return {
      allowed: true,
      remaining: opciones.max,
      resetAt: ahora + opciones.ventanaMs
    };
  }

  let store = opciones.store;
  let isDegradedToMemory = false;

  if (!store) {
    const redis = getRedisClient();
    if (redis) {
      store = new RedisRateLimitStore(redis);
    } else {
      isDegradedToMemory = true;
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "[rate-limit] ALERTA PRODUCCIÓN: Redis no configurado o no disponible; degradado a memoria por instancia",
          { clave, failClosed: Boolean(opciones.failClosed) }
        );
        if (opciones.failClosed) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: ahora + Math.ceil(opciones.ventanaMs / 1000) * 1000,
            retryAfterSec: Math.ceil(opciones.ventanaMs / 1000),
            degraded: true
          };
        }
      }
      store = defaultMemoryStore;
    }
  }

  try {
    const { count, resetAt } = await store.increment(clave, opciones.ventanaMs);
    const allowed = count <= opciones.max;
    const remaining = Math.max(0, opciones.max - count);
    const retryAfterSec = Math.max(1, Math.ceil((resetAt - ahora) / 1000));

    return {
      allowed,
      remaining,
      resetAt,
      ...(allowed ? {} : { retryAfterSec }),
      ...(isDegradedToMemory ? { degraded: true } : {})
    };
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] ALERTA PRODUCCIÓN: Error en almacenamiento rate-limit; evaluando comportamiento de degradación",
        { error: err, clave, failClosed: Boolean(opciones.failClosed) }
      );
      if (opciones.failClosed) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: ahora + Math.ceil(opciones.ventanaMs / 1000) * 1000,
          retryAfterSec: Math.ceil(opciones.ventanaMs / 1000),
          degraded: true
        };
      }
    }

    // Fail-open or fallback to memory
    try {
      const { count, resetAt } = await defaultMemoryStore.increment(clave, opciones.ventanaMs);
      const allowed = count <= opciones.max;
      const remaining = Math.max(0, opciones.max - count);
      const retryAfterSec = Math.max(1, Math.ceil((resetAt - ahora) / 1000));
      return {
        allowed,
        remaining,
        resetAt,
        ...(allowed ? {} : { retryAfterSec }),
        degraded: true
      };
    } catch {
      return {
        allowed: !opciones.failClosed,
        remaining: 0,
        resetAt: ahora + opciones.ventanaMs,
        degraded: true
      };
    }
  }
}

function esIp(valor: string): boolean {
  const v4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(:\d{1,5})?$/.exec(valor);
  if (v4) return true;
  const sinCorchetes = valor.replace(/^\[|\]$/g, "");
  return sinCorchetes.includes(":") && /^[0-9a-fA-F:.]+(%[0-9a-zA-Z._-]+)?$/.test(sinCorchetes);
}

function normalizarIp(valor: string): string | null {
  let v = valor.trim();
  const v4puerto = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(:\d{1,5})?$/.exec(v);
  if (v4puerto) return v.split(":")[0];
  v = v.replace(/^\[|\]$/g, "");
  return esIp(v) ? v : null;
}

function ultimaIpValida(cabecera: string | null): string | null {
  if (!cabecera) return null;
  const tokens = cabecera.split(",").map((t) => t.trim()).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const ip = normalizarIp(tokens[i]);
    if (ip) return ip;
  }
  return null;
}

/**
 * Extrae la IP confiable del cliente sin confiar en el primer token manipulable de X-Forwarded-For.
 */
export function obtenerIpConfiable(request: { headers: Headers }): string | null {
  return (
    ultimaIpValida(request.headers.get("x-vercel-forwarded-for")) ??
    ultimaIpValida(request.headers.get("x-real-ip")) ??
    ultimaIpValida(request.headers.get("x-forwarded-for"))
  );
}
