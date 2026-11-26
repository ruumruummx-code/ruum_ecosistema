"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import type { TrasladoMapa } from "@ruum/api/services";
import { obtenerRutaMapbox } from "../../lib/mapbox-rutas";
import {
  tokenMapbox,
  estiloMapbox,
  obtenerColoresMapa,
  crearPin,
  htmlPopoverVehiculo,
  trasladoSinCoordenadas,
  calidadUbicacion,
  esEmergenciaMapa,
  puntoMedio,
  puntoConductor,
  puntoConOffset
} from "./MapaTipos";

export function useMapboxOperativo({
  mapRef,
  cargando,
  trasladosVisibles,
  ahora,
  onSeleccionarTraslado
}: {
  mapRef: RefObject<HTMLDivElement | null>;
  cargando: boolean;
  trasladosVisibles: TrasladoMapa[];
  ahora: Date | null;
  onSeleccionarTraslado: (id: string) => void;
}) {
  const mapaRef = useRef<MapboxMap | null>(null);
  const marcadoresRef = useRef<MapboxMarker[]>([]);
  const [errorMapa, setErrorMapa] = useState<string | null>(null);

  useEffect(() => {
    if (cargando || !mapRef.current || trasladosVisibles.length === 0) return;
    if (mapaRef.current) return;

    let cancelado = false;
    void (async () => {
      if (!tokenMapbox) {
        setErrorMapa("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN no está configurado.");
        return;
      }
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        mapboxgl.accessToken = tokenMapbox;
        const mapa = new mapboxgl.Map({ container: mapRef.current!, style: estiloMapbox, center: [-100, 22.5], zoom: 4.2 });
        mapa.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
        mapaRef.current = mapa;
        mapa.on("error", (evento) => setErrorMapa(evento.error?.message ?? "No se pudo cargar el mapa."));
        await new Promise<void>((resolve) => mapa.once("load", () => resolve()));
        if (cancelado) return;
        const coloresMapa = obtenerColoresMapa();

        const bounds = new mapboxgl.LngLatBounds();
        const completos = trasladosVisibles.filter((t) => !trasladoSinCoordenadas(t));
        const vehiculosGps = completos
          .map((t) => {
            const punto = puntoConductor(t);
            if (!punto) return null;
            const calidad = calidadUbicacion(t, ahora);
            return {
              type: "Feature" as const,
              properties: {
                trasladoId: t.traslado_id,
                estadoSenal: calidad.estadoSenal,
                popupHtml: htmlPopoverVehiculo(t, calidad)
              },
              geometry: { type: "Point" as const, coordinates: punto }
            };
          })
          .filter((feature): feature is NonNullable<typeof feature> => Boolean(feature));
        if (vehiculosGps.length > 0) {
          mapa.addSource("vehiculos-operativos-cluster", {
            type: "geojson",
            data: { type: "FeatureCollection", features: vehiculosGps },
            cluster: true,
            clusterMaxZoom: 12,
            clusterRadius: 44
          });
          mapa.addLayer({
            id: "clusters-vehiculos",
            type: "circle",
            source: "vehiculos-operativos-cluster",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": coloresMapa.vehiculo,
              "circle-radius": ["step", ["get", "point_count"], 18, 10, 23, 25, 29],
              "circle-stroke-color": coloresMapa.pinBordeClaro,
              "circle-stroke-width": 2
            }
          });
          mapa.addLayer({
            id: "clusters-vehiculos-conteo",
            type: "symbol",
            source: "vehiculos-operativos-cluster",
            filter: ["has", "point_count"],
            layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
            paint: { "text-color": coloresMapa.pinBordeClaro }
          });
          mapa.addLayer({
            id: "vehiculos-no-agrupados",
            type: "circle",
            source: "vehiculos-operativos-cluster",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": ["case", ["==", ["get", "estadoSenal"], "confirmada"], coloresMapa.vehiculo, coloresMapa.sinSenal],
              "circle-radius": 9,
              "circle-stroke-color": coloresMapa.pinBordeClaro,
              "circle-stroke-width": 3
            }
          });
          mapa.on("click", "clusters-vehiculos", (evento) => {
            const features = mapa.queryRenderedFeatures(evento.point, { layers: ["clusters-vehiculos"] });
            const clusterId = (features[0] as unknown as { properties?: { cluster_id?: number } })?.properties?.cluster_id;
            const source = mapa.getSource("vehiculos-operativos-cluster") as { getClusterExpansionZoom: (id: number, callback: (error: Error | null, zoom: number) => void) => void };
            if (typeof clusterId !== "number") return;
            source.getClusterExpansionZoom(clusterId, (error, zoom) => {
              if (error) return;
              const coordinates = (features[0] as unknown as { geometry?: { coordinates?: [number, number] } } | undefined)?.geometry?.coordinates;
              if (coordinates) mapa.easeTo({ center: coordinates, zoom });
            });
          });
          mapa.on("click", "vehiculos-no-agrupados", (evento) => {
            const feature = evento.features?.[0] as unknown as { geometry?: { coordinates?: [number, number] }; properties?: { popupHtml?: string; trasladoId?: string } } | undefined;
            const coordinates = feature?.geometry?.coordinates;
            const popupHtml = typeof feature?.properties?.popupHtml === "string" ? feature.properties.popupHtml : null;
            const trasladoId = typeof feature?.properties?.trasladoId === "string" ? feature.properties.trasladoId : null;
            if (trasladoId) onSeleccionarTraslado(trasladoId);
            if (coordinates && popupHtml) new mapboxgl.Popup({ offset: 18, maxWidth: "320px" }).setLngLat(coordinates).setHTML(popupHtml).addTo(mapa);
          });
        }
        await Promise.all(completos.map(async (t, indice) => {
          const origen: [number, number] = [t.origen_lng!, t.origen_lat!];
          const destino: [number, number] = [t.destino_lng!, t.destino_lat!];
          const emergencia = esEmergenciaMapa(t);
          const color = t.tiene_incidencia_abierta ? coloresMapa.incidencia : coloresMapa.origen;
          const { geometry: geometria, degradada } = await obtenerRutaMapbox(origen, destino);
          if (cancelado) return;
          const sourceId = `ruta-${indice}`;
          mapa.addSource(sourceId, { type: "geojson", data: { type: "Feature", properties: {}, geometry: geometria } });
          mapa.addLayer({
            id: sourceId,
            type: "line",
            source: sourceId,
            paint: { "line-color": color, "line-width": 3, "line-opacity": .65, "line-dasharray": degradada ? [1.2, 1.2] : [1, 0] }
          });

          const etiquetaTraslado = `${t.vehiculo_marca ?? "Vehículo"} ${t.vehiculo_modelo ?? ""}`.trim();
          const origenEl = crearPin("origen", coloresMapa.origen, coloresMapa.pinBordeClaro, `Origen de ${etiquetaTraslado}: ${t.origen_ciudad}. Seleccionar traslado.`);
          origenEl.onclick = () => onSeleccionarTraslado(t.traslado_id);
          const origenMarker = new mapboxgl.Marker({ element: origenEl }).setLngLat(origen)
            .setPopup(new mapboxgl.Popup({ offset: 18 }).setText(`${t.vehiculo_marca ?? ""} ${t.vehiculo_modelo ?? ""} → ${t.destino_ciudad}`)).addTo(mapa);
          const destinoEl = crearPin("destino", coloresMapa.destino, coloresMapa.pinBordeOscuro, `Destino de ${etiquetaTraslado}: ${t.destino_ciudad}. Seleccionar traslado.`);
          destinoEl.onclick = () => onSeleccionarTraslado(t.traslado_id);
          const destinoMarker = new mapboxgl.Marker({ element: destinoEl }).setLngLat(destino)
            .setPopup(new mapboxgl.Popup({ offset: 18 }).setText(`Destino: ${t.destino_ciudad}`)).addTo(mapa);
          const puntoVehiculo = puntoConductor(t);
          if (puntoVehiculo) bounds.extend(puntoVehiculo);
          marcadoresRef.current.push(origenMarker, destinoMarker);
          if (t.tiene_incidencia_abierta) {
            const puntoAlerta = puntoVehiculo ?? puntoMedio(origen, destino);
            const incidenciaEl = crearPin("incidencia", coloresMapa.incidencia, coloresMapa.pinBordeClaro, `Incidencia abierta en traslado ${etiquetaTraslado}. Seleccionar traslado.`);
            incidenciaEl.onclick = () => onSeleccionarTraslado(t.traslado_id);
            const incidenciaMarker = new mapboxgl.Marker({ element: incidenciaEl }).setLngLat(puntoConOffset(puntoAlerta, 0.16))
              .setPopup(new mapboxgl.Popup({ offset: 18 }).setText("Incidencia abierta")).addTo(mapa);
            marcadoresRef.current.push(incidenciaMarker);
          }
          if (emergencia) {
            const puntoAlerta = puntoVehiculo ?? puntoMedio(origen, destino);
            const emergenciaEl = crearPin("emergencia", coloresMapa.emergencia, coloresMapa.pinBordeClaro, `Emergencia operativa en traslado ${etiquetaTraslado}. Seleccionar traslado.`);
            emergenciaEl.onclick = () => onSeleccionarTraslado(t.traslado_id);
            const emergenciaMarker = new mapboxgl.Marker({ element: emergenciaEl }).setLngLat(puntoConOffset(puntoAlerta, -0.16))
              .setPopup(new mapboxgl.Popup({ offset: 18 }).setText("Emergencia operativa")).addTo(mapa);
            marcadoresRef.current.push(emergenciaMarker);
          }
          bounds.extend(origen).extend(destino);
        }));
        if (!bounds.isEmpty()) mapa.fitBounds(bounds, { padding: 70, maxZoom: 9, duration: 0 });
      } catch (error) {
        setErrorMapa(error instanceof Error ? error.message : "No se pudo inicializar Mapbox.");
      }
    })();

    return () => {
      cancelado = true;
      marcadoresRef.current.forEach((marcador) => marcador.remove());
      marcadoresRef.current = [];
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, [ahora, cargando, onSeleccionarTraslado, trasladosVisibles, mapRef]);

  return { mapaRef, errorMapa };
}
