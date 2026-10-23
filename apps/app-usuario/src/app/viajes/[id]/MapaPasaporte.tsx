"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapboxMap, Marker, GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { UbicacionTraslado } from "@ruum/api/services";
import { logStructuredWarn } from "@/lib/logger";
import styles from "./pasaporte.module.css";
type Point = {
    lat: number | null;
    lng: number | null;
};
function valid(p: Point): p is {
    lat: number;
    lng: number;
} { return typeof p.lat === "number" && typeof p.lng === "number" && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180; }
export function MapaPasaporte({ origen: originProp, destino: destinationProp, ubicacion, activo, haciaOrigen = false, seguirUbicacion = false, onEta }: {
    origen: Point;
    destino: Point;
    ubicacion: UbicacionTraslado | null;
    activo: boolean;
    haciaOrigen?: boolean;
    seguirUbicacion?: boolean;
    onEta: (minutes: number | null) => void;
}) {
    const origen = useMemo(() => ({ lat: originProp.lat, lng: originProp.lng }), [originProp.lat, originProp.lng]);
    const destino = useMemo(() => ({ lat: destinationProp.lat, lng: destinationProp.lng }), [destinationProp.lat, destinationProp.lng]);
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<MapboxMap | null>(null);
    const driver = useRef<Marker | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const driverLat = ubicacion ? Number(ubicacion.lat) : null;
    const driverLng = ubicacion ? Number(ubicacion.lng) : null;
    useEffect(() => {
        if (!token || !container.current)
            return;
        let cancelled = false;
        let observer: ResizeObserver | undefined;
        void import("mapbox-gl").then(({ default: mb }) => {
            if (cancelled || !container.current)
                return;
            const initial = valid(origen) ? [origen.lng, origen.lat] as [
                number,
                number
            ] : [-99.1332, 19.4326] as [
                number,
                number
            ];
            const instance = new mb.Map({ container: container.current, accessToken: token, style: "mapbox://styles/mapbox/streets-v12", center: initial, zoom: 12 });
            map.current = instance;
            instance.on("load", () => { if (cancelled)
                return; instance.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } }); instance.addLayer({ id: "route", type: "line", source: "route", paint: { "line-color": "#176bcb", "line-width": 5 } }); setReady(true); });
            instance.on("error", () => { if (!cancelled)
                setError("No pudimos cargar el mapa. Intenta actualizar el seguimiento."); });
            if (valid(origen))
                new mb.Marker({ color: "#16a34a" }).setLngLat([origen.lng, origen.lat]).addTo(instance);
            if (valid(destino))
                new mb.Marker({ color: "#ef4444" }).setLngLat([destino.lng, destino.lat]).addTo(instance);
            if (valid(origen) && valid(destino))
                instance.fitBounds([[origen.lng, origen.lat], [destino.lng, destino.lat]], { padding: { top: 60, bottom: 140, left: 40, right: 40 }, maxZoom: 15, duration: 0 });
            observer = new ResizeObserver(() => instance.resize());
            observer.observe(container.current);
        }).catch((err) => { if (!cancelled) {
            logStructuredWarn("viajes/MapaPasaporte", "inicializacion_mapa_fallida", err);
            setError("Mapa no disponible en este dispositivo.");
        } });
        return () => { cancelled = true; observer?.disconnect(); driver.current = null; map.current?.remove(); map.current = null; setReady(false); };
        // Rebuild only when the endpoints change; live driver updates keep the camera position.
    }, [token, origen, destino]);
    useEffect(() => { if (activo)
        map.current?.resize(); }, [activo]);
    useEffect(() => {
        if (!ready || !map.current || !valid({ lat: driverLat, lng: driverLng }))
            return;
        let cancelled = false;
        void import("mapbox-gl").then(({ default: mb }) => { if (cancelled || !map.current)
            return; if (!driver.current)
            driver.current = new mb.Marker({ color: "#f59e0b" }).setLngLat([driverLng!, driverLat!]).addTo(map.current); driver.current.setLngLat([driverLng!, driverLat!]); });
        return () => { cancelled = true; };
    }, [ready, driverLat, driverLng]);
    useEffect(() => {
        const target = haciaOrigen ? origen : destino;
        if (!ready || !token || !valid(target))
            return;
        const start = seguirUbicacion && valid({ lat: driverLat, lng: driverLng }) ? { lat: driverLat!, lng: driverLng! } : origen;
        if (!valid(start))
            return;
        const abort = new AbortController();
        onEta(null);
        void fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${target.lng},${target.lat}?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`, { signal: abort.signal }).then(r => { if (!r.ok)
            throw new Error("route"); return r.json(); }).then(data => {
            if (abort.signal.aborted)
                return;
            const route = data.routes?.[0];
            if (!route)
                return;
            (map.current?.getSource("route") as GeoJSONSource | undefined)?.setData({ type: "Feature", properties: {}, geometry: route.geometry });
            if (seguirUbicacion && ubicacion && Number.isFinite(route.duration))
                onEta(Math.max(1, Math.ceil(route.duration / 60)));
        }).catch((err) => { if (!abort.signal.aborted) {
            logStructuredWarn("viajes/MapaPasaporte", "calculo_eta_fallido", err);
            onEta(null);
        } });
        return () => abort.abort();
    }, [ready, token, origen, destino, driverLat, driverLng, ubicacion, haciaOrigen, seguirUbicacion, onEta]);
    return <><div ref={container} className={styles.map} aria-label="Mapa interactivo del traslado">{!token && <div className={styles.empty}>El mapa no está disponible por ahora. El estado de tu traslado sigue actualizándose.</div>}</div>{error && <p className={styles.mapError} role="status">{error}</p>}</>;
}
