
const tokenMapbox = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export function tieneMapboxConfigurado(): boolean {
  return Boolean(tokenMapbox);
}

export interface PuntoMapa {
  lat: number;
  lng: number;
}

