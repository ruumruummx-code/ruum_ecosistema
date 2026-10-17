"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mapa de operación que abarca el 100% de la pantalla como fondo interactivo.
 * Se carga de forma dinámica (mapbox-gl) para no bloquear el render inicial
 * y proteger los Web Vitals. Si no hay token de Mapbox, se muestra un fondo
 * neutro sin romper la vista.
 */
export function MapaConductor() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const [cargando, setCargando] = useState(true);
  const [errorMapa, setErrorMapa] = useState<string | null>(null);
  const [centro, setCentro] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      setCargando(false);
      return;
    }

    let cancelled = false;
    let map: unknown = null;

    async function init() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string | undefined;
        if (!token) {
          setErrorMapa("Mapa no configurado");
          setCargando(false);
          return;
        }
        mapboxgl.accessToken = token;

        const container = containerRef.current;
        if (!container) return;

        const m = new mapboxgl.Map({
          container,
          style: "mapbox://styles/mapbox/streets-v11",
          center: centro ?? [-99.1332, 19.4326], // CDMX por defecto
          zoom: 13,
          attributionControl: false
        });
        mapRef.current = m;
        map = m;

        m.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

        m.on("load", () => {
          if (cancelled) return;
          setCargando(false);
          // Intentar centrar en la ubicación real del conductor
          if (typeof navigator !== "undefined" && navigator.geolocation && !centro) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (cancelled) return;
                const [lng, lat] = [pos.coords.longitude, pos.coords.latitude];
                m.flyTo({ center: [lng, lat] as [number, number], zoom: 14, duration: 800 });
              },
              () => {},
              { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
            );
          }
        });

        m.on("error", () => {
          if (!cancelled) setErrorMapa("No pudimos cargar el mapa");
        });
      } catch (err) {
        if (!cancelled) {
          setErrorMapa("Mapa no disponible");
          setCargando(false);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      try {
        const m = map as unknown as { remove?: () => void } | null;
        if (m && typeof m.remove === "function") m.remove();
      } catch {}
      mapRef.current = null;
    };
  }, [centro]);

  // Solicitar ubicación del conductor una vez para centrar el mapa
  useEffect(() => {
    if (centro || typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCentro([pos.coords.longitude, pos.coords.latitude]),
      () => {},
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );
  }, []);

  if (errorMapa || !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="absolute inset-0 z-0 bg-surface flex flex-col items-center justify-center text-text-tertiary">
        <span className="text-4xl mb-2" aria-hidden>🗺️</span>
        <p className="font-display text-sm font-bold text-text-primary">Mapa de operación</p>
        {errorMapa && (
          <p className="mt-1 font-body text-xs text-text-tertiary max-w-[260px] text-center">{errorMapa}</p>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-surface" role="region" aria-label="Mapa de operación del conductor">
      {cargando && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="size-7 rounded-full border-3 border-border border-t-signal animate-spin" aria-hidden />
            <span className="font-body text-xs font-semibold text-text-secondary">Cargando mapa…</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="inset-0" role="application" aria-label="Mapa interactivo de operación" />
    </div>
  );
}
