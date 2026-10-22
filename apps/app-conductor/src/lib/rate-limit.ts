/**
 * Rate-limit distribuido para rutas API del conductor.
 * Respaldado por @ruum/api/rate-limit con soporte de Upstash Redis,
 * fallback en memoria y degradación segura.
 */

import { NextRequest } from "next/server";
import {
  rateLimitDistribuido,
  obtenerIpConfiable,
  MemoryRateLimitStore,
  RedisRateLimitStore,
  defaultMemoryStore,
  getRedisClient,
  __resetRateLimitStateForTest,
  type RateLimitStore,
  type RateLimitOptions as ApiRateLimitOptions,
  type RateLimitResult
} from "@ruum/api/rate-limit";

export type { RateLimitStore, RateLimitResult };
export { MemoryRateLimitStore, RedisRateLimitStore, getRedisClient, __resetRateLimitStateForTest };

export const rateLimitStore: RateLimitStore = defaultMemoryStore;

export interface RateLimitOptions {
  max: number;
  ventanaMs: number;
  clave?: string;
  failClosed?: boolean;
  store?: RateLimitStore;
}

/**
 * Evalúa si una petición está dentro del límite permitido.
 */
export async function rateLimit(
  identificador: string | null | undefined,
  opciones: RateLimitOptions
): Promise<RateLimitResult> {
  return rateLimitDistribuido(identificador, opciones);
}

/**
 * Extrae la IP del cliente desde las cabeceras de la request.
 * Prioriza cabeceras de proxy confiables (Vercel, load balancer).
 */
export function ipDeRequest(request: NextRequest | { headers: Headers }): string | null {
  return obtenerIpConfiable(request);
}
