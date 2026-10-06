import { Redis } from "@upstash/redis";

export const MAX_BODY = 5 * 1024;
export const RATE_WINDOW_MS = 60_000;
export const MAX_PER_WINDOW = 10;

const hits = new Map<string, { count: number; resetAt: number }>();
let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (!hasUpstash && !hasKv) {
    redisClient = null;
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
    redisClient = null;
  }
  return redisClient;
}

export function __clearCspRateLimitForTest() {
  hits.clear();
}

export async function rateLimit(ip: string): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  return rateLimitConVentana(ip, "csp-report", MAX_PER_WINDOW, RATE_WINDOW_MS);
}

/**
 * Rate limit genérico reutilizable (auditoría S-2/S-3/S-7).
 *
 * El cooldown de reenvío de código y la verificación de OTP vivían solo en
 * localStorage / en el navegador, por lo que un bucle podía saltárselos. Al
 * pasar por el servidor, el límite pasa a ser el único control efectivo.
 *
 * @param clave Namespace para no mezclar contadores entre endpoints.
 * @param maxPeticiones Peticiones permitidas por ventana.
 * @param ventanaMs Tamaño de la ventana en milisegundos.
 */
export async function rateLimitConVentana(
  identificador: string,
  clave: string,
  maxPeticiones: number,
  ventanaMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number; restantes?: number }> {
  const redis = getRedis();
  if (redis) {
    try {
      const redisKey = `rl:${clave}:${identificador}`;
      const count = (await redis.incr(redisKey)) as number;
      if (count === 1) {
        await redis.expire(redisKey, Math.ceil(ventanaMs / 1000));
      }
      if (count > maxPeticiones) {
        const ttl = (await redis.ttl(redisKey)) as number;
        const retryAfterSec = ttl > 0 ? ttl : Math.ceil(ventanaMs / 1000);
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

/** IP del cliente respetando el header que inyecta el CDN/proxy. */
export function obtenerIp(request: { headers: Headers }): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const primera = fwd.split(",")[0]?.trim();
    if (primera) return primera;
  }
  return request.headers.get("x-real-ip")?.trim() || "desconocida";
}
