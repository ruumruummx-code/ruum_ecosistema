import "server-only";
import { createHash } from "node:crypto";
import type { SolicitudTrasladoValidada } from "@ruum/shared/validacion";
import { obtenerRutaRecalculadaServidor, RutaNoDisponibleError } from "./ruta-cache";
import { getRedis } from "./csp-rate-limit";

interface Punto {
  lat: number;
  lng: number;
}

/** Pin colocado por el usuario en el mapa (origen/destino). */
export interface PinesCliente {
  origen?: Punto | null;
  destino?: Punto | null;
}

/** Hasta esta distancia el pin del usuario se acepta sin preguntar. */
export const PIN_TOLERANCIA_M = 300;
/** Más allá de esta distancia pin y dirección son incoherentes: no se acepta ni confirmando. */
export const PIN_MAXIMO_CONFIRMABLE_M = 5_000;

const GEOCODE_CACHE_TTL_SEG = 7 * 24 * 3600;

/**
 * El pin del mapa y la dirección escrita difieren más de la tolerancia.
 * La UI debe pedir al usuario que confirme el pin (o corrija la dirección)
 * y reenviar con `confirmarUbicacionPin: true`.
 */
export class UbicacionDivergenteError extends Error {
  constructor(
    public readonly punto: "origen" | "destino",
    public readonly distanciaM: number,
    public readonly confirmable: boolean
  ) {
    super(
      confirmable
        ? `El punto que marcaste en el mapa para el ${punto} está a ${Math.round(distanciaM)} m de la dirección escrita. Confirma que el pin es correcto o ajusta la dirección.`
        : `El punto del mapa para el ${punto} está a más de ${PIN_MAXIMO_CONFIRMABLE_M / 1000} km de la dirección escrita. Revisa la dirección o vuelve a colocar el pin.`
    );
  }
}

export function distanciaMetros(a: Punto, b: Punto): number {
  const R = 6_371_000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function puntoValido(p: Punto | null | undefined): p is Punto {
  return Boolean(p) && Number.isFinite(p!.lat) && Number.isFinite(p!.lng) && Math.abs(p!.lat) <= 90 && Math.abs(p!.lng) <= 180;
}

function claveGeocodificacion(consulta: string) {
  const normalizada = consulta.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
  return `cache:geocode:v1:${createHash("sha256").update(normalizada).digest("hex").slice(0, 32)}`;
}

/** Geocodificación con caché en Redis por dirección normalizada (evita repetir Mapbox en cada reintento). */
async function geocodificar(consulta: string, token: string): Promise<Punto> {
  const redis = getRedis();
  const clave = claveGeocodificacion(consulta);
  if (redis) {
    try {
      const cacheado = await redis.get<Punto>(clave);
      if (puntoValido(cacheado)) return cacheado;
    } catch {
      // La caché nunca bloquea la cotización.
    }
  }
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.search = new URLSearchParams({ q: consulta, country: "mx", types: "address", limit: "1", access_token: token }).toString();
  let punto: Punto;
  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!respuesta.ok) throw new RutaNoDisponibleError();
    const resultado = await respuesta.json() as { features?: Array<{ geometry?: { coordinates?: number[] } }> };
    const [lng, lat] = resultado.features?.[0]?.geometry?.coordinates ?? [];
    punto = { lat, lng };
    if (!puntoValido(punto)) throw new RutaNoDisponibleError();
  } catch {
    throw new RutaNoDisponibleError();
  }
  if (redis) {
    try {
      await redis.set(clave, punto, { ex: GEOCODE_CACHE_TTL_SEG });
    } catch {
      // best effort
    }
  }
  return punto;
}

/**
 * Decide qué coordenada usar para un extremo de la ruta.
 *
 * Antes la geocodificación del servidor (limit: 1) sobrescribía siempre el pin
 * que eligió el usuario, y en México eso suele mover la recolección. Ahora:
 * - pin a ≤ 300 m de la dirección: se usa el pin (más preciso);
 * - 300 m – 5 km: se exige confirmación explícita del usuario;
 * - > 5 km o pin inválido: se usa la geocodificación / se rechaza.
 */
export function elegirCoordenada(
  punto: "origen" | "destino",
  geocodificado: Punto,
  pin: Punto | null | undefined,
  confirmado: boolean
): Punto {
  if (!puntoValido(pin)) return geocodificado;
  const distancia = distanciaMetros(geocodificado, pin);
  if (distancia <= PIN_TOLERANCIA_M) return pin;
  if (distancia > PIN_MAXIMO_CONFIRMABLE_M) throw new UbicacionDivergenteError(punto, distancia, false);
  if (!confirmado) throw new UbicacionDivergenteError(punto, distancia, true);
  return pin;
}

/** La distancia facturable se calcula en servidor; el pin del navegador solo se acepta si es coherente con la dirección. */
export async function resolverRutaSolicitudServidor(
  datos: SolicitudTrasladoValidada,
  pines: PinesCliente = {},
  confirmarUbicacionPin = false
) {
  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) throw new RutaNoDisponibleError();
  const direcciones = [
    [datos.origenCalle, datos.origenNumero, datos.origenColonia, datos.origenCodigoPostal, datos.origenCiudad, datos.origenEstado],
    ...datos.paradas.map((p) => [p.calle, p.numero, p.colonia, p.codigoPostal, p.ciudad, p.estado]),
    [datos.destinoCalle, datos.destinoNumero, datos.destinoColonia, datos.destinoCodigoPostal, datos.destinoCiudad, datos.destinoEstado],
  ];
  const puntos = await Promise.all(direcciones.map((partes) => geocodificar(partes.join(", "), token)));
  const origen = elegirCoordenada("origen", puntos[0], pines.origen, confirmarUbicacionPin);
  const destino = elegirCoordenada("destino", puntos[puntos.length - 1], pines.destino, confirmarUbicacionPin);
  const paradas = puntos.slice(1, -1);
  const ruta = await obtenerRutaRecalculadaServidor(origen, destino, paradas);
  return { ...ruta, origenLat: origen.lat, origenLng: origen.lng, destinoLat: destino.lat, destinoLng: destino.lng, paradasCoords: paradas };
}
