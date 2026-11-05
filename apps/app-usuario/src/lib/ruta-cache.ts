import { createHash } from "node:crypto";
import { getRedis } from "@/lib/csp-rate-limit";
import { logStructuredWarn } from "@/lib/logger";
import { obtenerRutaDirectionsMapboxConParadas } from "@ruum/shared/utils";

export class RutaNoDisponibleError extends Error {
  constructor() { super("No pudimos confirmar la ruta. Intenta cotizar nuevamente."); }
}

export const RUTA_CACHE_TTL_SEG = 86_400; // 24 horas

export interface CoordenadaPunto {
  lat: number;
  lng: number;
}

export interface ResultadoRutaRecalculada {
  distanciaKm: number;
  tiempoEstimadoHoras: number;
  fuente: "cache" | "mapbox";
}

/**
 * Genera una clave determinista en Redis basada en coordenadas redondeadas a 5 decimales
 * (~1.1 metros de resolución), suficiente para deduplicar consultas sobre las mismas calles.
 */
export function generarClaveCacheRuta(
  origen: CoordenadaPunto,
  destino: CoordenadaPunto,
  paradas: CoordenadaPunto[] = []
): string {
  const coordsStr = [
    `${origen.lat.toFixed(5)},${origen.lng.toFixed(5)}`,
    ...paradas.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`),
    `${destino.lat.toFixed(5)},${destino.lng.toFixed(5)}`,
  ].join(";");
  const hash = createHash("sha256").update(coordsStr).digest("hex").slice(0, 32);
  return `cache:ruta:${hash}`;
}

/**
 * RUUM-USR-F6-001 (CA-10 / T11): Consulta y persistencia de rutas frecuentes en Redis
 * para mitigar latencia y costo de llamadas a Mapbox.
 */
export async function consultarRutaEnCache(
  cacheKey: string
): Promise<{ distanciaKm: number; tiempoEstimadoHoras: number } | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const cached = await redis.get<{ distanciaKm: number; tiempoEstimadoHoras: number }>(cacheKey);
    if (
      cached &&
      typeof cached.distanciaKm === "number" &&
      typeof cached.tiempoEstimadoHoras === "number" &&
      Number.isFinite(cached.distanciaKm) && cached.distanciaKm > 0 && cached.distanciaKm <= 20000 &&
      Number.isFinite(cached.tiempoEstimadoHoras) && cached.tiempoEstimadoHoras > 0 && cached.tiempoEstimadoHoras <= 720
    ) {
      return cached;
    }
  } catch (err) {
    logStructuredWarn("ruta-cache", "redis_get_fallido", err, { cacheKey });
  }
  return null;
}

export async function guardarRutaEnCache(
  cacheKey: string,
  datos: { distanciaKm: number; tiempoEstimadoHoras: number },
  ttlSeg: number = RUTA_CACHE_TTL_SEG
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(cacheKey, datos, { ex: ttlSeg });
  } catch (err) {
    logStructuredWarn("ruta-cache", "redis_set_fallido", err, { cacheKey });
  }
}

/**
 * Recalcula la ruta en el servidor como única fuente de verdad (CB-1 / CA-1).
 */
export async function obtenerRutaRecalculadaServidor(
  origen: CoordenadaPunto,
  destino: CoordenadaPunto,
  paradas: CoordenadaPunto[] = []
): Promise<ResultadoRutaRecalculada> {
  if ([origen, ...paradas, destino].some((p) =>
    !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180)) {
    throw new RutaNoDisponibleError();
  }
  const cacheKey = generarClaveCacheRuta(origen, destino, paradas);

  // 1. Verificar si existe en la caché de Redis
  const cached = await consultarRutaEnCache(cacheKey);
  if (cached) {
    return {
      distanciaKm: Number(cached.distanciaKm.toFixed(2)),
      tiempoEstimadoHoras: Number(cached.tiempoEstimadoHoras.toFixed(2)),
      fuente: "cache",
    };
  }

  // 2. Consulta Mapbox Directions
  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (token) {
    try {
      const puntosParadas: Array<[number, number]> = paradas.map((p) => [p.lng, p.lat]);
      const ruta = await obtenerRutaDirectionsMapboxConParadas(
        [origen.lng, origen.lat],
        [destino.lng, destino.lat],
        puntosParadas,
        token,
        {
          lanzarErrores: true,
          maxIntentos: 3,
          timeoutMs: 8000,
          demoraReintentoMs: 300,
        }
      );

      if (ruta && ruta.distanciaKm != null && ruta.tiempoHoras != null && Number.isFinite(ruta.distanciaKm) && ruta.distanciaKm > 0 && ruta.distanciaKm <= 20000 &&
          Number.isFinite(ruta.tiempoHoras) && ruta.tiempoHoras > 0 && ruta.tiempoHoras <= 720) {
        const distanciaKm = Number(Number(ruta.distanciaKm).toFixed(2));
        const tiempoEstimadoHoras = Number(Number(ruta.tiempoHoras).toFixed(2));
        await guardarRutaEnCache(cacheKey, { distanciaKm, tiempoEstimadoHoras });
        return { distanciaKm, tiempoEstimadoHoras, fuente: "mapbox" };
      }
    } catch (err) {
      logStructuredWarn("ruta-cache", "mapbox_directions_fallido", err);
    }
  }

  // Una estimación geodésica no autoriza un cobro ni puede omitir escalas.
  throw new RutaNoDisponibleError();
}
