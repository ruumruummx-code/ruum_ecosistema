"use client";

import { useEffect, useState } from "react";
import { MapaEstatico } from "@ruum/ui";
import { obtenerUbicacionActual } from "@/lib/ubicacion";
import { ConductorIcon } from "@/components/icons";
import {
  construirUrlMapaRutaConduccion,
  tieneMapboxConfigurado,
  type PuntoMapa
} from "@/lib/mapbox-rutas";

export interface MapaRutaConduccionProps {
  origen: PuntoMapa;
  destino: PuntoMapa;
}

export function MapaRutaConduccion({ origen, destino }: MapaRutaConduccionProps) {
  const [urlMapa, setUrlMapa] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      if (!tieneMapboxConfigurado()) {
        setCargando(false);
        return;
      }
      try {
        // Try getting current location. If unavailable, fallback to null.
        const ubicacion = await obtenerUbicacionActual().catch(() => null);
        const url = await construirUrlMapaRutaConduccion(origen, destino, ubicacion);
        if (!cancelado) {
          setUrlMapa(url);
          setCargando(false);
        }
      } catch (err) {
        console.error("Error al construir mapa de ruta de conducción:", err);
        if (!cancelado) {
          setCargando(false);
        }
      }
    }
    void cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origen.lat, origen.lng, destino.lat, destino.lng]);

  if (cargando) {
    return (
      <div className="h-44 w-full animate-pulse rounded-xl bg-ui-muted/45 border border-ui-line/10 flex items-center justify-center text-ui-fg-muted font-body text-xs" aria-hidden>
        Cargando mapa interactivo...
      </div>
    );
  }

  if (!urlMapa) {
    // OSM / Leaflet / or static fallback placeholder if Mapbox is not configured
    return (
      <div className="h-44 w-full bg-ui-muted/45 rounded-xl flex flex-col items-center justify-center border border-ui-line/10 relative overflow-hidden">
        {/* Simple visual path fallback */}
        <svg width="100%" height="100%" className="absolute inset-0 select-none opacity-20 pointer-events-none" aria-hidden="true">
          <path d="M 30 130 Q 120 40 210 120 T 370 50" fill="none" stroke="var(--conductor-brand)" strokeWidth="4" strokeDasharray="8, 8" />
        </svg>
        <div className="w-10 h-10 rounded-full bg-ui-success/10 border border-ui-success/20 flex items-center justify-center text-ui-success text-lg z-10">
          <ConductorIcon name="pin" />
        </div>
        <span className="font-display text-xs font-bold text-ui-fg-muted mt-2 z-10">Ruta de conducción activa</span>
        <span className="font-body text-xs text-ui-fg-muted z-10">{origen.lat.toFixed(4)}, {origen.lng.toFixed(4)} ➔ {destino.lat.toFixed(4)}, {destino.lng.toFixed(4)}</span>
      </div>
    );
  }

  return (
    <div className="h-44 w-full rounded-xl border border-ui-line/30 overflow-hidden relative">
      <MapaEstatico
        src={urlMapa}
        alt="Mapa del trayecto desde origen hasta el destino del traslado"
        className="object-cover"
        sizes="(max-width: 767px) 100vw, 400px"
      />
    </div>
  );
}
