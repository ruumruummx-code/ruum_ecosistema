"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PasaporteRow } from "./trips-utils";
import { tieneMapboxConfigurado } from "../../lib/mapbox-rutas";

interface TrasladosMapaProps {
  Traslados: PasaporteRow[];
  onSelect: (viaje: PasaporteRow) => void;
  vistaId?: string;
  onReturnToList?: () => void;
}

export function TrasladosMapa({ Traslados, onSelect, vistaId, onReturnToList }: TrasladosMapaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const [errorMapa, setErrorMapa] = useState<string | null>(null);
  const [cargandoMapa, setCargandoMapa] = useState(true);

  const TrasladosConCoords = useMemo(() => Traslados.filter((v): v is PasaporteRow & { origen_lng: number; origen_lat: number } => v.origen_lng != null && v.origen_lat != null), [Traslados]);

  useEffect(() => {
    if (!tieneMapboxConfigurado()) {
      setCargandoMapa(false);
      return;
    }
    if (TrasladosConCoords.length === 0) {
      setCargandoMapa(false);
      return;
    }

    let cancelled = false;
    let map: unknown = null;

    async function init() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;

        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string | undefined;
        if (!token) {
          setErrorMapa("Token Mapbox no configurado");
          setCargandoMapa(false);
          return;
        }
        mapboxgl.accessToken = token;

        if (!containerRef.current) return;

        // Centro: promedio o primer punto
        const lats = TrasladosConCoords.map((v) => v.origen_lat);
        const lngs = TrasladosConCoords.map((v) => v.origen_lng);
        const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;

        const m = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [centerLng, centerLat] as [number, number],
          zoom: 10,
          attributionControl: false
        });
        mapRef.current = m as unknown as null;
        map = m;

        m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        m.addControl(new mapboxgl.AttributionControl({ compact: true }));

        m.on("load", () => {
          if (cancelled) return;
          // Si solo un punto, no ajustar bounds
          if (TrasladosConCoords.length === 1) {
            setCargandoMapa(false);
            return;
          }
          const bounds = new mapboxgl.LngLatBounds();
          TrasladosConCoords.forEach((v) => bounds.extend([v.origen_lng, v.origen_lat]));
          m.fitBounds(bounds, { padding: 40, maxZoom: 13, duration: 600 });
          setCargandoMapa(false);
        });

        // Crear markers con popup ligero (signal)
        TrasladosConCoords.forEach((viaje) => {
          const el = document.createElement("div");
          el.className = "ruum-map-pin";
          el.style.cssText =
            "width:48px;height:48px;border-radius:50%;background:#FFC400;border:3px solid #0f172a;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#0f172a;box-shadow:0 4px 12px rgba(0,0,0,0.25);cursor:pointer;transform:translate(-50%,-50%)";
          el.textContent = "📍";
          el.setAttribute("role", "button");
          el.setAttribute("aria-label", `Ver oferta ${viaje.origen_ciudad ?? ""} — ${viaje.ganancia_conductor ? "$" + Math.round(viaje.ganancia_conductor) : ""}`);
          el.tabIndex = 0;

          const precio = viaje.ganancia_conductor != null ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(viaje.ganancia_conductor) : "—";
          const distancia = viaje.distancia_km != null ? `${viaje.distancia_km.toFixed(1)} km` : "";
          const popupContent = document.createElement("div");
          popupContent.className = "conductor-map-popup";
          for (const [className, text] of [
            ["conductor-map-popup__eyebrow", "Traslado"],
            ["conductor-map-popup__route", `${viaje.origen_ciudad ?? "Origen"} → ${viaje.destino_ciudad ?? "Destino"}`],
            ["conductor-map-popup__meta", `${precio} · ${distancia}`],
            ["conductor-map-popup__action", "Toca para ver →"]
          ]) {
            const line = document.createElement("div"); line.className = className; line.textContent = text; popupContent.append(line);
          }
          const popup = new mapboxgl.Popup({ offset: 18, closeButton: false, maxWidth: "220px" }).setDOMContent(popupContent);

          const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([viaje.origen_lng, viaje.origen_lat]).setPopup(popup).addTo(m);

          el.addEventListener("click", () => onSelect(viaje));
          el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(viaje);
            }
          });
          marker.getElement().addEventListener("mouseenter", () => popup.addTo(m));
        });

        m.on("error", () => {
          if (!cancelled) setErrorMapa("No pudimos cargar el mapa");
        });
      } catch (err) {
        if (!cancelled) {
          setErrorMapa("Mapa no disponible");
          setCargandoMapa(false);
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
  }, [TrasladosConCoords, onSelect, vistaId]);

  const fallback = (message: string) => <div className="flex h-full flex-col justify-center gap-2 rounded-xl border border-border bg-surface-elevated p-3 text-center">
    <p className="text-sm">{message}</p>
    {onReturnToList && <button type="button" className="min-h-12 rounded-xl border border-border p-2 text-sm" onClick={onReturnToList}>Volver a lista</button>}
  </div>;
  if (!tieneMapboxConfigurado()) return fallback("Mapa no disponible. Puedes revisar los traslados en la lista.");
  if (Traslados.length === 0) return null;
  if (TrasladosConCoords.length === 0) return fallback("Estos traslados aún no tienen coordenadas. Usa la lista para revisarlos.");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border shadow-xs bg-surface" aria-label="Mapa de ofertas">
      {cargandoMapa && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="size-7 rounded-full border-3 border-border border-t-signal animate-spin" aria-hidden />
            <span className="font-body text-sm font-semibold text-text-secondary">Cargando mapa…</span>
          </div>
        </div>
      )}
      {errorMapa && (
        <div className="absolute top-3 left-3 right-3 z-10 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-body text-sm font-semibold text-amber-600">
          {errorMapa} — usa la lista
        </div>
      )}
      <div ref={containerRef} className="h-full min-h-[150px] w-full" role="application" aria-label="Mapa interactivo de ofertas, usa lista para accesibilidad" />
      <div className="absolute bottom-2 left-2 right-2 flex justify-center pointer-events-none">
        <span className="rounded-full bg-surface-elevated/90 backdrop-blur border border-border/40 px-3 py-1.5 font-body text-sm font-semibold text-text-secondary shadow-sm">
          {TrasladosConCoords.length} ofertas en mapa · Toca un pin para ver detalle
        </span>
      </div>
    </div>
  );
}
