import "server-only";
import type { SolicitudTrasladoValidada } from "@ruum/shared/validacion";
import { obtenerRutaRecalculadaServidor, RutaNoDisponibleError } from "./ruta-cache";

/** Las coordenadas del navegador nunca determinan la distancia facturable. */
export async function resolverRutaSolicitudServidor(datos: SolicitudTrasladoValidada) {
  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) throw new RutaNoDisponibleError();
  const direcciones = [
    [datos.origenCalle, datos.origenNumero, datos.origenColonia, datos.origenCodigoPostal, datos.origenCiudad, datos.origenEstado],
    ...datos.paradas.map((p) => [p.calle, p.numero, p.colonia, p.codigoPostal, p.ciudad, p.estado]),
    [datos.destinoCalle, datos.destinoNumero, datos.destinoColonia, datos.destinoCodigoPostal, datos.destinoCiudad, datos.destinoEstado],
  ];
  const puntos = await Promise.all(direcciones.map(async (partes) => {
    const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
    url.search = new URLSearchParams({ q: partes.join(", "), country: "mx", types: "address", limit: "1", access_token: token }).toString();
    try {
      const respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!respuesta.ok) throw new RutaNoDisponibleError();
      const resultado = await respuesta.json() as { features?: Array<{ geometry?: { coordinates?: number[] } }> };
      const [lng, lat] = resultado.features?.[0]?.geometry?.coordinates ?? [];
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new RutaNoDisponibleError();
      }
      return { lat, lng };
    } catch {
      throw new RutaNoDisponibleError();
    }
  }));
  const origen = puntos[0];
  const destino = puntos[puntos.length - 1];
  const paradas = puntos.slice(1, -1);
  const ruta = await obtenerRutaRecalculadaServidor(origen, destino, paradas);
  return { ...ruta, origenLat: origen.lat, origenLng: origen.lng, destinoLat: destino.lat, destinoLng: destino.lng, paradasCoords: paradas };
}
