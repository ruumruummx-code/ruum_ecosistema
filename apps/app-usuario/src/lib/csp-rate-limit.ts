import { Redis } from "@upstash/redis";

export const MAX_BODY = 5 * 1024;
export const RATE_WINDOW_MS = 60_000;
export const MAX_PER_WINDOW = 10;

const hits = new Map<string, { count: number; resetAt: number }>();
/** A2: tope del fallback en memoria para que identificadores rotatorios no lo hagan crecer sin límite. */
const MAX_MEMORY_KEYS = 5000;

let redisClient: Redis | null | undefined;
/** A4: momento del último fallo de construcción/conexión; evita fijar null para siempre. */
let redisUltimoFalloMs = 0;
const REDIS_REINTENTO_MS = 30_000;

function getRedis(): Redis | null {
  if (redisClient !== undefined && redisClient !== null) return redisClient;
  if (redisClient === null && Date.now() - redisUltimoFalloMs < REDIS_REINTENTO_MS) {
    return null; // backoff: no reintentar la construcción en cada request
  }
  const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (!hasUpstash && !hasKv) {
    redisClient = null;
    redisUltimoFalloMs = Date.now();
    return redisClient;
  }
  try {
    if (hasUpstash) {
      redisClient = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
      return redisClient;
    }
    if (hasKv) {
      redisClient = new Redis({ url: process.env.KV_REST_API_URL!, token: process.env.KV_REST_API_TOKEN! });
      return redisClient;
    }
    redisClient = Redis.fromEnv();
    return redisClient;
  } catch {
    // A4: se registra el momento para reintentar más tarde en vez de
    // quedarse en null durante toda la vida de la instancia.
    redisClient = null;
    redisUltimoFalloMs = Date.now();
  }
  return redisClient;
}

export function __clearCspRateLimitForTest() {
  hits.clear();
}

/** A2: purga oportunista del fallback en memoria (expiradas primero, FIFO si sigue lleno). */
function purgarMemoria(now: number) {
  if (hits.size <= MAX_MEMORY_KEYS) return;
  for (const [k, v] of hits) {
    if (now > v.resetAt) hits.delete(k);
    if (hits.size <= MAX_MEMORY_KEYS) return;
  }
  // Sigue lleno (claves rotatorias vigentes): evicción FIFO de las más antiguas.
  const exceso = hits.size - MAX_MEMORY_KEYS;
  let eliminadas = 0;
  for (const k of hits.keys()) {
    hits.delete(k);
    eliminadas += 1;
    if (eliminadas >= exceso) break;
  }
}

export async function rateLimit(ip: string | null): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  return rateLimitConVentana(ip, "csp-report", MAX_PER_WINDOW, RATE_WINDOW_MS);
}

/**
 * Rate limit genérico reutilizable (auditoría S-2/S-3/S-7).
 *
 * El cooldown de reenvío de código y la verificación de OTP vivían solo en
 * localStorage / en el navegador, por lo que un bucle podía saltárselos. Al
 * pasar por el servidor, el límite pasa a ser el único control efectivo.
 *
 * @param identificador Identificador del bucket (IP validada, correo, userId…).
 *   Un valor `null`/vacío significa "sin identificador confiable": se permite
 *   (fail-open en esta dimensión) en vez de compartir un bucket global que un
 *   atacante podría saturar para negar el servicio a usuarios legítimos (A2).
 *   Los endpoints combinan esta dimensión con otras (correo, userId).
 * @param clave Namespace para no mezclar contadores entre endpoints.
 * @param maxPeticiones Peticiones permitidas por ventana.
 * @param ventanaMs Tamaño de la ventana en milisegundos.
 */
export async function rateLimitConVentana(
  identificador: string | null | undefined,
  clave: string,
  maxPeticiones: number,
  ventanaMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number; restantes?: number }> {
  if (!identificador) {
    console.warn("[rate-limit-usuario] sin identificador confiable, se omite esta dimension", { clave });
    return { allowed: true, restantes: maxPeticiones };
  }
  const redis = getRedis();
  if (redis) {
    try {
      const redisKey = `rl:${clave}:${identificador}`;
      const ttlSec = Math.ceil(ventanaMs / 1000);
      // A4: SET NX con EX antes del INCR. La clave siempre nace con TTL: si el
      // proceso muere entre operaciones no queda una clave eterna que bloquee
      // el identificador para siempre (el INCR+EXPIRE separado sí lo dejaba).
      await redis.set(redisKey, "0", { nx: true, ex: ttlSec });
      const count = (await redis.incr(redisKey)) as number;
      if (count > maxPeticiones) {
        const ttl = (await redis.ttl(redisKey)) as number;
        const retryAfterSec = ttl > 0 ? ttl : ttlSec;
        return { allowed: false, retryAfterSec, restantes: 0 };
      }
      return { allowed: true, restantes: maxPeticiones - count };
    } catch (e) {
      console.warn("[rate-limit-usuario] redis fallo, fallback a memoria", e);
    }
  }
  const now = Date.now();
  const memoryKey = `${clave}:${identificador}`;
  const entry = hits.get(memoryKey);
  if (!entry || now > entry.resetAt) {
    purgarMemoria(now);
    hits.set(memoryKey, { count: 1, resetAt: now + ventanaMs });
    return { allowed: true, restantes: maxPeticiones - 1 };
  }
  if (entry.count >= maxPeticiones) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec, restantes: 0 };
  }
  entry.count += 1;
  return { allowed: true, restantes: maxPeticiones - entry.count };
}

function esIp(valor: string): boolean {
  // IPv4 con puerto opcional (los proxies a veces añaden :puerto).
  const v4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(:\d{1,5})?$/.exec(valor);
  if (v4) return true;
  // IPv6 (con o sin corchetes, con posible zona %eth0).
  const sinCorchetes = valor.replace(/^\[|\]$/g, "");
  return sinCorchetes.includes(":") && /^[0-9a-fA-F:.]+(%[0-9a-zA-Z._-]+)?$/.test(sinCorchetes);
}

function normalizarIp(valor: string): string | null {
  let v = valor.trim();
  // Quitar puerto de IPv4 ("1.2.3.4:5678" → "1.2.3.4").
  const v4puerto = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(:\d{1,5})?$/.exec(v);
  if (v4puerto) return v.split(":")[0];
  v = v.replace(/^\[|\]$/g, "");
  return esIp(v) ? v : null;
}

/** Último token válido de una cabecera que puede traer lista separada por comas. */
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
 * IP del cliente sin confiar en X-Forwarded-For a ciegas (A1).
 *
 * El primer token de X-Forwarded-For lo inyecta el propio cliente y cada proxy
 * añade al FINAL: rotar ese header genera identificadores infinitos y anula el
 * rate limit. Orden de confianza:
 *   1. `x-vercel-forwarded-for` (la fija la plataforma, el cliente no la controla),
 *   2. `x-real-ip` (la fija el proxy/CDN de borde),
 *   3. último token válido de `x-forwarded-for` (el que añadió el proxy más
 *      cercano; nunca el primero).
 * Todo valor se valida como IP literal. Devuelve `null` si no hay IP confiable
 * en vez de un bucket compartido ("desconocida") que permitiría DoS (A2).
 */
export function obtenerIp(request: { headers: Headers }): string | null {
  return (
    ultimaIpValida(request.headers.get("x-vercel-forwarded-for")) ??
    ultimaIpValida(request.headers.get("x-real-ip")) ??
    ultimaIpValida(request.headers.get("x-forwarded-for"))
  );
}
