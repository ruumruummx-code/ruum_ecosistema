import "server-only";

export class ErrorServicioCotizacion extends Error {
  constructor(mensaje: string, public readonly status = 503) {
    super(mensaje);
  }
}

// Cache en memoria para geocodificación de códigos postales (finitos en México ~32k)
const cacheCoordenadasCP = new Map<string, [number, number]>();
const promesasEnVueloCP = new Map<string, Promise<[number, number] | null>>();

/** Limpia el cache en memoria (útil en pruebas) */
export function limpiarCacheCoordenadasCP(): void {
  cacheCoordenadasCP.clear();
  promesasEnVueloCP.clear();
}

/**
 * Obtiene las coordenadas [lng, lat] para un código postal mexicano.
 * Implementa cache en memoria y deduplicación de consultas simultáneas.
 */
export async function coordenadaPostalMasiva(cp: string, token: string): Promise<[number, number] | null> {
  const normalizado = cp.trim();
  if (!normalizado) return null;

  // 1. Revisar cache en memoria
  if (cacheCoordenadasCP.has(normalizado)) {
    return cacheCoordenadasCP.get(normalizado)!;
  }

  // 2. Revisar si ya hay una petición en curso para este mismo CP
  if (promesasEnVueloCP.has(normalizado)) {
    return promesasEnVueloCP.get(normalizado)!;
  }

  const promesa = (async (): Promise<[number, number] | null> => {
    const params = new URLSearchParams({
      q: normalizado,
      country: "mx",
      types: "postcode",
      autocomplete: "false",
      access_token: token,
      limit: "1"
    });

    let res: Response;
    try {
      res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, {
        signal: AbortSignal.timeout(8000)
      });
    } catch {
      throw new ErrorServicioCotizacion("No se pudo conectar con el servicio de mapas. Reintenta la cotización.");
    }

    if (res.status === 401 || res.status === 403) {
      throw new ErrorServicioCotizacion("El servicio de mapas no está disponible. Contacta a soporte para revisar su configuración.");
    }
    if (res.status === 429) {
      throw new ErrorServicioCotizacion("El servicio de mapas alcanzó su límite de consultas. Espera un momento y reintenta.", 429);
    }
    if (!res.ok) {
      throw new ErrorServicioCotizacion("El servicio de mapas no pudo procesar la cotización. Reintenta en unos momentos.");
    }

    const data = await res.json().catch(() => null);
    const punto: unknown = data?.features?.[0]?.geometry?.coordinates;
    if (!Array.isArray(punto) || punto.length !== 2 || !punto.every((n) => typeof n === "number" && Number.isFinite(n))) {
      return null;
    }

    const coordenadas = punto as [number, number];
    // Guardar en cache en memoria
    cacheCoordenadasCP.set(normalizado, coordenadas);
    return coordenadas;
  })();

  promesasEnVueloCP.set(normalizado, promesa);
  try {
    return await promesa;
  } finally {
    promesasEnVueloCP.delete(normalizado);
  }
}
