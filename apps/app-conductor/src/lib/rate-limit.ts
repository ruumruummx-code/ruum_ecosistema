/**
 * Rate-limit distribuido para rutas API del conductor.
 *
 * Diseño: soporta un almacén inyectable (`RateLimitStore`) para que en
 * producción (Vercel serverless, múltiples instancias) se pueda conectar
 * a Upstash/Redis sin cambiar las rutas API. En desarrollo / single-instance
 * se usa `MemoryRateLimitStore`.
 *
 * Uso:
 *   import { rateLimit } from "@/lib/rate-limit";
 *   const { allowed, remaining, resetAt } = await rateLimit(identificador, { max: 30, ventanaMs: 60_000 });
 */

import { NextRequest } from "next/server";

export interface RateLimitStore {
  /**
   * Incrementa el contador para la clave dada y devuelve { count, resetAt }.
   * resetAt es el timestamp de expiración de la ventana actual (ms).
   */
  increment(clave: string, ventanaMs: number): Promise<{ count: number; resetAt: number }>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private datos = new Map<string, { count: number; resetAt: number }>();

  async increment(clave: string, ventanaMs: number): Promise<{ count: number; resetAt: number }> {
    const ahora = Date.now();
    const existente = this.datos.get(clave);
    if (!existente || ahora > existente.resetAt) {
      this.datos.set(clave, { count: 1, resetAt: ahora + ventanaMs });
      return { count: 1, resetAt: ahora + ventanaMs };
    }
    existente.count += 1;
    return { count: existente.count, resetAt: existente.resetAt };
  }
}

// Store global (single instance en desarrollo). En producción serverless,
// reemplazar por Upstash/Redis inyectando una implementación de RateLimitStore.
export const rateLimitStore: RateLimitStore = new MemoryRateLimitStore();

/**
 * Evalúa si una petición está dentro del límite permitido.
 * Lanza un error si se excede el límite (el llamador debe responder 429).
 */
export async function rateLimit(
  identificador: string,
  opciones: { max: number; ventanaMs: number; store?: RateLimitStore }
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const store = opciones.store ?? rateLimitStore;
  const { count, resetAt } = await store.increment(identificador, opciones.ventanaMs);
  const remaining = Math.max(0, opciones.max - count);
  const allowed = count <= opciones.max;
  return { allowed, remaining, resetAt };
}

/**
 * Extrae la IP del cliente desde las cabeceras de la request.
 * Prioriza cabeceras de proxy confiables (Vercel, load balancer).
 */
export function ipDeRequest(request: NextRequest): string | null {
  const vercel = request.headers.get("x-vercel-forwarded-for")?.split(",").map((t) => t.trim()).filter(Boolean).pop();
  if (vercel && /^\d{1,3}(\.\d{1,3}){3}$/.test(vercel)) return vercel;
  const real = request.headers.get("x-real-ip")?.trim();
  if (real && /^\d{1,3}(\.\d{1,3}){3}$/.test(real)) return real;
  const fwd = request.headers.get("x-forwarded-for")?.split(",").map((t) => t.trim()).filter(Boolean).pop();
  if (fwd && /^\d{1,3}(\.\d{1,3}){3}$/.test(fwd)) return fwd;
  return null;
}
