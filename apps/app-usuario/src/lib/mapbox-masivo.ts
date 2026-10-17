import "server-only";

export class ErrorServicioCotizacion extends Error {
  constructor(mensaje: string, public readonly status = 503) { super(mensaje); }
}

export async function coordenadaPostalMasiva(cp: string, token: string): Promise<[number, number] | null> {
  const params = new URLSearchParams({ q: cp, country: "mx", types: "postcode", autocomplete: "false", access_token: token, limit: "1" });
  let res: Response;
  try {
    res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new ErrorServicioCotizacion("No se pudo conectar con el servicio de mapas. Reintenta la cotización.");
  }
  if (res.status === 401 || res.status === 403) throw new ErrorServicioCotizacion("El servicio de mapas no está disponible. Contacta a soporte para revisar su configuración.");
  if (res.status === 429) throw new ErrorServicioCotizacion("El servicio de mapas alcanzó su límite de consultas. Espera un momento y reintenta.", 429);
  if (!res.ok) throw new ErrorServicioCotizacion("El servicio de mapas no pudo procesar la cotización. Reintenta en unos momentos.");
  const data = await res.json().catch(() => null);
  const punto: unknown = data?.features?.[0]?.geometry?.coordinates;
  if (!Array.isArray(punto) || punto.length !== 2 || !punto.every(n => typeof n === "number" && Number.isFinite(n))) return null;
  return punto as [number, number];
}
