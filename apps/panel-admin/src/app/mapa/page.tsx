"use client";

/**
 * PRD §10.3 — Mapa operativo. Muestra todos los traslados activos con pin
 * de origen (azul trazabilidad) y pin de destino (amarillo ruta), línea punteada de
 * ruta calculada, y panel lateral de selección. Usa Mapbox GL JS y Directions.
 *
 * La posición del conductor se pinta solo cuando existe telemetría real en
 * tracking_salud_traslado/ubicaciones_traslado. Origen y destino son
 * referencias operativas de ruta, no sustitutos de GPS.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import Link from "next/link";
import { Aviso, EstadoBadge } from "@ruum/ui";
import { listarTrasladosActivosMapa, type TrasladoMapa } from "@ruum/api/services";
import { obtenerRutaMapbox } from "../../lib/mapbox-rutas";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

const ETIQUETA_ESTADO: Partial<Record<string, string>> = {
  conductor_asignado: "Conductor asignado",
  conductor_en_camino_al_origen: "En camino al origen",
  conductor_en_punto_de_recoleccion: "En punto de recolección",
  verificacion_vehiculo_en_proceso: "Verificando vehículo",
  evidencia_inicial_en_proceso: "Capturando evidencia inicial",
  evidencia_inicial_completada: "Evidencia inicial completa",
  vehiculo_recibido: "Vehículo recibido",
  traslado_en_curso: "En ruta",
  incidencia_reportada: "Incidencia reportada",
  llegada_a_destino: "Llegó al destino",
  evidencia_final_en_proceso: "Capturando evidencia final",
  evidencia_final_completada: "Evidencia final completa",
  entrega_confirmada: "Entrega confirmada",
  pago_pendiente: "Pago pendiente",
  pago_completado: "Pago completado"
};

type EstadoConexionMapa = "datos_en_vivo" | "actualizando" | "reconectando" | "sin_conexion" | "desactualizado";
type VistaMapaMovil = "mapa" | "lista" | "alertas";
type FiltroMapa = "todos" | "en_ruta" | "incidencias" | "sin_senal" | "ubicacion_antigua";
type SimboloMapa = "origen" | "destino" | "vehiculo" | "incidencia" | "emergencia" | "sin_senal" | "ruta_real" | "ruta_aproximada";
type EstadoSenalMapa = "confirmada" | "estimada" | "antigua" | "sin_senal" | "sin_ubicacion";
type CategoriaPrioridadMapa = "emergencia" | "incidencia_critica" | "sla_vencido" | "sin_senal" | "desviacion" | "en_riesgo" | "normal";

function tiempoRelativo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h`;
}

const tokenMapbox = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const estiloMapbox = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/streets-v12";
const UMBRAL_UBICACION_ANTIGUA_MIN = 30;
const UMBRAL_SIN_SENAL_MIN = 60;
const FRECUENCIA_GPS_ESPERADA_SEG = 30;
const ORDEN_PRIORIDAD_MAPA: CategoriaPrioridadMapa[] = ["emergencia", "incidencia_critica", "sla_vencido", "sin_senal", "desviacion", "en_riesgo", "normal"];
const ETIQUETA_PRIORIDAD_MAPA: Record<CategoriaPrioridadMapa, string> = {
  emergencia: "Emergencia",
  incidencia_critica: "Incidencia crítica",
  sla_vencido: "SLA vencido",
  sin_senal: "Sin señal",
  desviacion: "Desviación",
  en_riesgo: "En riesgo",
  normal: "Operación normal"
};
const DESCRIPCION_PRIORIDAD_MAPA: Record<CategoriaPrioridadMapa, string> = {
  emergencia: "Incidencia abierta en estado de emergencia operativa.",
  incidencia_critica: "Traslado con incidencia abierta.",
  sla_vencido: "Reservado para el SLA operativo cuando el backend lo exponga.",
  sin_senal: "Última ubicación supera el umbral de señal.",
  desviacion: "Reservado para detección de desvío de ruta.",
  en_riesgo: "Ubicación antigua o punto estimado desactualizado.",
  normal: "Traslados sin alerta prioritaria."
};
const COLOR_MAPA = {
  origen: "var(--ui-success)",
  destino: "var(--ui-brand)",
  incidencia: "var(--ui-danger)",
  emergencia: "var(--ui-danger)",
  vehiculo: "var(--ui-success)",
  sinSenal: "var(--ui-fg-muted)",
  pinBordeClaro: "var(--ui-fg)",
  pinBordeOscuro: "var(--ui-card)",
  pinSombra: "var(--ui-shadow-md)"
} as const;

function obtenerColoresMapa() {
  const estilos = window.getComputedStyle(document.documentElement);
  const leer = (token: string) => estilos.getPropertyValue(token).trim();
  return {
    origen: leer("--ui-success"),
    destino: leer("--ui-brand"),
    incidencia: leer("--ui-danger"),
    emergencia: leer("--ui-danger"),
    vehiculo: leer("--ui-success"),
    sinSenal: leer("--ui-fg-muted"),
    pinBordeClaro: leer("--ui-fg"),
    pinBordeOscuro: leer("--ui-card")
  };
}

function crearPin(simbolo: SimboloMapa, color: string, borde: string, etiqueta: string): HTMLButtonElement {
  const pin = document.createElement("button");
  const figura = document.createElement("span");
  pin.type = "button";
  pin.setAttribute("aria-label", etiqueta);
  pin.setAttribute("title", etiqueta);
  Object.assign(pin.style, {
    width: "44px",
    height: "44px",
    border: "0",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0"
  });
  Object.assign(figura.style, {
    width: "24px",
    height: "24px",
    color,
    background: "var(--ui-card)",
    border: `3px solid ${simbolo === "sin_senal" ? color : borde}`,
    boxShadow: COLOR_MAPA.pinSombra,
    pointerEvents: "none",
    display: "grid",
    placeItems: "center",
    fontSize: "13px",
    fontWeight: "800",
    lineHeight: "1"
  });
  aplicarSimboloMapa(figura, simbolo, color);
  pin.appendChild(figura);
  return pin;
}

function aplicarSimboloMapa(figura: HTMLSpanElement, simbolo: SimboloMapa, color: string) {
  if (simbolo === "origen") {
    Object.assign(figura.style, { borderRadius: "9999px", background: color });
    figura.textContent = "";
    return;
  }
  if (simbolo === "destino") {
    Object.assign(figura.style, { borderRadius: "4px", borderColor: color });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("width", "18"); svg.setAttribute("height", "18");
    const path = document.createElementNS(svg.namespaceURI, "path"); path.setAttribute("d", "M7 21V4h9l-1.4 3L16 10H7"); path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor"); path.setAttribute("stroke-width", "2.2"); path.setAttribute("stroke-linejoin", "round"); svg.appendChild(path); figura.replaceChildren(svg);
    return;
  }
  if (simbolo === "vehiculo") {
    Object.assign(figura.style, { borderRadius: "9999px", borderColor: color });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("width", "18"); svg.setAttribute("height", "18");
    const path = document.createElementNS(svg.namespaceURI, "path"); path.setAttribute("d", "M5 12l7-7 7 7h-4v7H9v-7H5z"); path.setAttribute("fill", "currentColor"); svg.appendChild(path); figura.replaceChildren(svg);
    return;
  }
  if (simbolo === "incidencia") {
    Object.assign(figura.style, {
      width: "0",
      height: "0",
      background: "transparent",
      borderLeft: "14px solid transparent",
      borderRight: "14px solid transparent",
      borderBottom: `25px solid ${color}`,
      borderTop: "0",
      boxShadow: COLOR_MAPA.pinSombra
    });
    figura.textContent = "";
    return;
  }
  if (simbolo === "emergencia") {
    Object.assign(figura.style, { borderRadius: "9999px", borderColor: color, color });
    figura.textContent = "!";
    return;
  }
  Object.assign(figura.style, { borderRadius: "9999px", borderStyle: "dashed", borderColor: color, color });
  figura.textContent = "";
}

export default function PaginaMapaOperativo() {
  const [traslados, setTraslados] = useState<TrasladoMapa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [estadoConexionGps, setEstadoConexionGps] = useState<EstadoConexionMapa>("actualizando");
  const [ultimaRespuestaExitosa, setUltimaRespuestaExitosa] = useState<Date | null>(null);
  const [seccionesDesactualizadas, setSeccionesDesactualizadas] = useState<string[]>([]);
  const [actualizandoManual, setActualizandoManual] = useState(false);
  const [ahora, setAhora] = useState<Date | null>(null);
  const [vistaMovil, setVistaMovil] = useState<VistaMapaMovil>("mapa");
  const [filtroMapa, setFiltroMapa] = useState<FiltroMapa>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalleColapsado, setDetalleColapsado] = useState(false);
  const [ordenPrioridad, setOrdenPrioridad] = useState<CategoriaPrioridadMapa[]>(ORDEN_PRIORIDAD_MAPA);
  const [panelActivosAbierto, setPanelActivosAbierto] = useState(false);
  const [panelPrioridadAbierto, setPanelPrioridadAbierto] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<MapboxMap | null>(null);
  const marcadoresRef = useRef<MapboxMarker[]>([]);
  const focoPrevioPanelRef = useRef<HTMLElement | null>(null);
  const [errorMapa, setErrorMapa] = useState<string | null>(null);
  const [errorOperacional, setErrorOperacional] = useState<string | null>(null);

  const seleccionarTraslado = useCallback((trasladoId: string) => {
    focoPrevioPanelRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSeleccionado(trasladoId);
    setPanelActivosAbierto(true);
  }, []);

  const cerrarPanelSeleccionado = useCallback(() => {
    setSeleccionado(null);
    window.requestAnimationFrame(() => focoPrevioPanelRef.current?.focus());
  }, []);

  function moverPrioridad(categoria: CategoriaPrioridadMapa, direccion: -1 | 1) {
    setOrdenPrioridad((actual) => {
      const indice = actual.indexOf(categoria);
      const siguienteIndice = indice + direccion;
      if (indice < 0 || siguienteIndice < 0 || siguienteIndice >= actual.length) return actual;
      const copia = [...actual];
      const [item] = copia.splice(indice, 1);
      copia.splice(siguienteIndice, 0, item!);
      return copia;
    });
  }

  function restablecerPrioridad() {
    setOrdenPrioridad(ORDEN_PRIORIDAD_MAPA);
  }

  useEffect(() => {
    if (!seleccionado) return;
    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") cerrarPanelSeleccionado();
    }
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [seleccionado, cerrarPanelSeleccionado]);

  const cargar = useCallback(async (esRefresco = false) => {
      if (!esRefresco) setCargando(true);
      if (esRefresco) {
        setActualizandoManual(true);
        setEstadoConexionGps(ultimaRespuestaExitosa ? "reconectando" : "actualizando");
      }
      if (!tieneSupabaseConfigurado()) {
        if (!ultimaRespuestaExitosa) setTraslados([]);
        setEstadoConexionGps(ultimaRespuestaExitosa ? "desactualizado" : "sin_conexion");
        setSeccionesDesactualizadas(["ubicaciones reales", "traslados activos"]);
        setErrorOperacional("Supabase no está configurado. El mapa operativo no muestra registros demo.");
        setCargando(false);
        setActualizandoManual(false);
        return;
      }
      try {
        const cliente = crearClienteNavegador();
        setTraslados(await listarTrasladosActivosMapa(cliente));
        setEstadoConexionGps("datos_en_vivo");
        setUltimaRespuestaExitosa(new Date());
        setSeccionesDesactualizadas([]);
        setErrorOperacional(null);
      } catch (error) {
        const teniaRespuesta = Boolean(ultimaRespuestaExitosa);
        if (!teniaRespuesta) setTraslados([]);
        setEstadoConexionGps(teniaRespuesta ? "desactualizado" : "sin_conexion");
        setSeccionesDesactualizadas(["ubicaciones reales", "traslados activos"]);
        setErrorOperacional(error instanceof Error ? error.message : "No se pudieron cargar ubicaciones reales del mapa.");
      } finally {
        setCargando(false);
        setActualizandoManual(false);
      }
  }, [setCargando, setActualizandoManual, setEstadoConexionGps, setTraslados, setUltimaRespuestaExitosa, setSeccionesDesactualizadas, ultimaRespuestaExitosa]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    setAhora(new Date());
    const intervalo = window.setInterval(() => setAhora(new Date()), 30000);
    return () => window.clearInterval(intervalo);
  }, []);

  const trasladosVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return traslados
      .filter((t) => {
        const calidad = calidadUbicacion(t, ahora);
        if (filtroMapa === "en_ruta" && t.estado !== "traslado_en_curso") return false;
        if (filtroMapa === "incidencias" && !t.tiene_incidencia_abierta) return false;
        if (filtroMapa === "sin_senal" && calidad.estadoSenal !== "sin_senal") return false;
        if (filtroMapa === "ubicacion_antigua" && calidad.estadoSenal !== "antigua" && calidad.estadoSenal !== "sin_senal") return false;
        if (!q) return true;
        return [
          t.traslado_id,
          t.conductor_nombre,
          t.vehiculo_marca,
          t.vehiculo_modelo,
          t.origen_ciudad,
          t.destino_ciudad,
          ETIQUETA_ESTADO[t.estado] ?? t.estado
        ].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => compararPrioridadMapa(a, b, ordenPrioridad, ahora));
  }, [ahora, busqueda, filtroMapa, ordenPrioridad, traslados]);

  useEffect(() => {
    if (vistaMovil === "mapa") window.setTimeout(() => mapaRef.current?.resize(), 0);
  }, [vistaMovil]);

  useEffect(() => {
    if (!seleccionado) return;
    document.getElementById(`mapa-lista-${seleccionado}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const traslado = traslados.find((t) => t.traslado_id === seleccionado);
    if (!traslado || trasladoSinCoordenadas(traslado)) return;
    const centro = puntoMedio([traslado.origen_lng!, traslado.origen_lat!], [traslado.destino_lng!, traslado.destino_lat!]);
    mapaRef.current?.flyTo({ center: centro, zoom: Math.max(mapaRef.current.getZoom(), 7), duration: 650, essential: true });
  }, [seleccionado, traslados]);

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
            if (trasladoId) seleccionarTraslado(trasladoId);
            if (coordinates && popupHtml) new mapboxgl.Popup({ offset: 18, maxWidth: "320px" }).setLngLat(coordinates).setHTML(popupHtml).addTo(mapa);
          });
        }
        await Promise.all(completos.map(async (t, indice) => {
          const origen: [number, number] = [t.origen_lng!, t.origen_lat!];
          const destino: [number, number] = [t.destino_lng!, t.destino_lat!];
          const emergencia = esEmergenciaMapa(t);
          const calidad = calidadUbicacion(t, ahora);
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
          origenEl.onclick = () => seleccionarTraslado(t.traslado_id);
          const origenMarker = new mapboxgl.Marker({ element: origenEl }).setLngLat(origen)
            .setPopup(new mapboxgl.Popup({ offset: 18 }).setText(`${t.vehiculo_marca ?? ""} ${t.vehiculo_modelo ?? ""} → ${t.destino_ciudad}`)).addTo(mapa);
          const destinoEl = crearPin("destino", coloresMapa.destino, coloresMapa.pinBordeOscuro, `Destino de ${etiquetaTraslado}: ${t.destino_ciudad}. Seleccionar traslado.`);
          destinoEl.onclick = () => seleccionarTraslado(t.traslado_id);
          const destinoMarker = new mapboxgl.Marker({ element: destinoEl }).setLngLat(destino)
            .setPopup(new mapboxgl.Popup({ offset: 18 }).setText(`Destino: ${t.destino_ciudad}`)).addTo(mapa);
          const puntoVehiculo = puntoConductor(t);
          if (puntoVehiculo) bounds.extend(puntoVehiculo);
          marcadoresRef.current.push(origenMarker, destinoMarker);
          if (t.tiene_incidencia_abierta) {
            const puntoAlerta = puntoVehiculo ?? puntoMedio(origen, destino);
            const incidenciaEl = crearPin("incidencia", coloresMapa.incidencia, coloresMapa.pinBordeClaro, `Incidencia abierta en traslado ${etiquetaTraslado}. Seleccionar traslado.`);
            incidenciaEl.onclick = () => seleccionarTraslado(t.traslado_id);
            const incidenciaMarker = new mapboxgl.Marker({ element: incidenciaEl }).setLngLat(puntoConOffset(puntoAlerta, 0.16))
              .setPopup(new mapboxgl.Popup({ offset: 18 }).setText("Incidencia abierta")).addTo(mapa);
            marcadoresRef.current.push(incidenciaMarker);
          }
          if (emergencia) {
            const puntoAlerta = puntoVehiculo ?? puntoMedio(origen, destino);
            const emergenciaEl = crearPin("emergencia", coloresMapa.emergencia, coloresMapa.pinBordeClaro, `Emergencia operativa en traslado ${etiquetaTraslado}. Seleccionar traslado.`);
            emergenciaEl.onclick = () => seleccionarTraslado(t.traslado_id);
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
  }, [ahora, cargando, seleccionarTraslado, trasladosVisibles]);

  const sel = traslados.find((t) => t.traslado_id === seleccionado);
  const enRuta = traslados.filter((t) => t.estado === "traslado_en_curso").length;
  const conInc = traslados.filter((t) => t.tiene_incidencia_abierta).length;
  const pendientesGeocodificacion = traslados.filter(trasladoSinCoordenadas).length;
  const sinSenal = traslados.filter((t) => calidadUbicacion(t, ahora).estadoSenal === "sin_senal").length;
  const ubicacionAntigua = traslados.filter((t) => {
    const estado = calidadUbicacion(t, ahora).estadoSenal;
    return estado === "antigua" || estado === "sin_senal";
  }).length;
  const alertasMapa = traslados.filter((t) => t.tiene_incidencia_abierta || trasladoSinCoordenadas(t) || calidadUbicacion(t, ahora).estadoSenal === "sin_senal" || calidadUbicacion(t, ahora).estadoSenal === "antigua");
  const calidadSeleccionada = sel ? calidadUbicacion(sel, ahora) : null;
  const estadoGpsGlobal = estadoGpsMapa(estadoConexionGps, sinSenal + pendientesGeocodificacion, ubicacionAntigua);
  const filtrosMapa = [
    { id: "todos" as const, label: "Todos", total: traslados.length },
    { id: "en_ruta" as const, label: "En ruta", total: enRuta },
    { id: "incidencias" as const, label: "Con incidencia", total: conInc },
    { id: "sin_senal" as const, label: "Sin señal", total: sinSenal + pendientesGeocodificacion },
    { id: "ubicacion_antigua" as const, label: "Ubicación antigua", total: ubicacionAntigua }
  ];

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <div className="flex flex-col gap-4 border-b border-ui-line px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Mapa operativo</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="font-mono-ruum text-xs text-ui-fg-muted">Torre de control · datos GPS y traslados activos</p>
            <span className={`rounded-full border px-2.5 py-1 font-body text-xs font-semibold ${claseEstadoConexion(estadoConexionGps)}`}>
              {textoEstadoConexionMapa(estadoConexionGps)}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-body text-xs font-semibold ${estadoGpsGlobal.clase}`}>
              <span className="size-2 rounded-full bg-current" aria-hidden="true" />
              {estadoGpsGlobal.etiqueta}
            </span>
            <span className="font-body text-xs text-ui-fg-muted">GPS cada {FRECUENCIA_GPS_ESPERADA_SEG}s · expira en {UMBRAL_SIN_SENAL_MIN} min</span>
            {ultimaRespuestaExitosa && (
              <time dateTime={ultimaRespuestaExitosa.toISOString()} className="font-body text-xs text-ui-fg-muted">
                {textoActualizadoHace(ultimaRespuestaExitosa, ahora)}
              </time>
            )}
          </div>
          {seccionesDesactualizadas.length > 0 && (
            <p className="mt-2 font-body text-xs text-ui-warning">
              Pueden estar desactualizadas: {seccionesDesactualizadas.join(", ")}.
            </p>
          )}
          {errorOperacional && (
            <div className="mt-3 max-w-3xl"><Aviso tono="danger">{errorOperacional}</Aviso></div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPanelPrioridadAbierto((actual) => !actual)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm font-semibold text-ui-fg-muted transition-colors hover:border-ui-brand/50 hover:text-ui-fg"
          >
            Configurar jerarquía
          </button>
          <button
            type="button"
            onClick={() => setPanelActivosAbierto((actual) => !actual)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm font-semibold text-ui-fg-muted transition-colors hover:border-ui-brand/50 hover:text-ui-fg"
          >
            Activos ({trasladosVisibles.length})
          </button>
          <button
            type="button"
            onClick={() => void cargar(true)}
            disabled={actualizandoManual}
            className="relative inline-flex min-h-10 items-center justify-center overflow-hidden rounded-lg border border-ui-line-strong bg-ui-card px-4 py-2 font-body text-sm font-semibold text-ui-fg-muted transition-colors hover:border-ui-brand/50 hover:text-ui-fg disabled:cursor-wait disabled:opacity-70"
          >
            <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-ui-brand transition-transform ${actualizandoManual ? "animate-pulse" : ""}`} aria-hidden="true" />
            {actualizandoManual ? "Reconectando" : "Actualizar"}
          </button>
        </div>
      </div>

      <section className="grid gap-3 border-b border-ui-line px-4 py-3 sm:px-6 lg:grid-cols-[minmax(220px,1fr)_auto]" aria-label="Toolbar de busqueda y filtros del mapa operativo">
        <div className="flex min-w-0 flex-wrap gap-2">
          {filtrosMapa.map(({ id, label, total }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filtroMapa === id}
              onClick={() => setFiltroMapa(id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-1.5 font-body text-sm font-semibold transition-colors ${filtroMapa === id ? "border-ui-brand bg-ui-brand-soft text-ui-fg ring-1 ring-inset ring-ui-warning/20" : "border-ui-line-strong text-ui-fg-muted hover:border-ui-brand/40"}`}
            >
              <span>{label}</span>
              <span className="rounded-full bg-ui-muted px-2 py-0.5 font-mono-ruum text-xs text-ui-fg">{total}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar conductor, vehículo o ciudad"
          className="min-h-10 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 font-body text-sm text-ui-fg placeholder:text-ui-fg-muted lg:w-80"
          aria-label="Buscar en mapa operativo"
        />
      </section>

      {panelPrioridadAbierto && (
        <section className="border-b border-ui-line bg-ui-muted px-4 py-4 sm:px-6" aria-label="Configurar jerarquía de alertas">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Configurar jerarquía de alertas</p>
              <p className="mt-1 font-body text-sm text-ui-fg-muted">
                La lista y el mapa se ordenan con esta jerarquía. Las prioridades se recalculan al cambiar estado, incidencia o calidad de ubicación.
              </p>
            </div>
            <button
              type="button"
              onClick={restablecerPrioridad}
              className="w-fit rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm font-semibold text-ui-fg-muted hover:border-ui-brand/40"
            >
              Orden recomendado
            </button>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {ordenPrioridad.map((categoria, indice) => (
              <div key={categoria} className={`rounded-lg border px-3 py-3 ${claseTarjetaPrioridadMapa(categoria)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono-ruum text-xs text-ui-fg-muted">Nivel {indice + 1}</p>
                    <p className="mt-1 font-body text-sm font-semibold text-ui-fg">{ETIQUETA_PRIORIDAD_MAPA[categoria]}</p>
                    <p className="mt-1 line-clamp-2 font-body text-xs text-ui-fg-muted">{DESCRIPCION_PRIORIDAD_MAPA[categoria]}</p>
                  </div>
                  <SimboloPrioridad categoria={categoria} />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => moverPrioridad(categoria, -1)}
                    disabled={indice === 0}
                    className="min-h-8 rounded border border-ui-line-strong px-2 font-mono-ruum text-xs text-ui-fg-muted disabled:opacity-40"
                    aria-label={`Subir prioridad ${ETIQUETA_PRIORIDAD_MAPA[categoria]}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moverPrioridad(categoria, 1)}
                    disabled={indice === ordenPrioridad.length - 1}
                    className="min-h-8 rounded border border-ui-line-strong px-2 font-mono-ruum text-xs text-ui-fg-muted disabled:opacity-40"
                    aria-label={`Bajar prioridad ${ETIQUETA_PRIORIDAD_MAPA[categoria]}`}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <nav className="grid grid-cols-3 border-b border-ui-line lg:hidden" aria-label="Vista móvil del mapa operativo">
        {[
          ["mapa", "Mapa"],
          ["lista", "Lista"],
          ["alertas", "Alertas"]
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setVistaMovil(id as VistaMapaMovil)}
            className={`px-3 py-3 font-body text-sm font-semibold ${vistaMovil === id ? "border-b-2 border-ui-brand text-ui-fg" : "text-ui-fg-muted"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className={`grid min-h-0 flex-1 grid-cols-1 overflow-hidden ${panelActivosAbierto ? "lg:grid-cols-[minmax(0,1fr)_minmax(320px,24rem)]" : "lg:grid-cols-1"}`}>
        <div className={`relative min-h-[54vh] lg:block lg:min-h-0 ${vistaMovil === "mapa" ? "block" : "hidden"}`}>
          {cargando && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-ui-card">
              <p className="font-mono-ruum text-sm text-ui-fg-muted">Cargando traslados…</p>
            </div>
          )}
          {!cargando && traslados.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6">
              <p className="font-display text-lg font-semibold text-ui-fg-muted">Sin traslados activos</p>
              <p className="max-w-md text-center font-body text-sm text-ui-fg-muted">No hay traslados activos obtenidos desde la fuente real en este momento.</p>
            </div>
          )}
          {errorMapa && (
            <div className="absolute left-4 right-4 top-4 z-10"><Aviso tono="danger">{errorMapa}</Aviso></div>
          )}
          <div ref={mapRef} className="h-full min-h-[54vh] lg:min-h-[520px]" />

          <div className="absolute bottom-4 left-4 z-[400] rounded-xl border border-ui-line bg-ui-card px-4 py-3 backdrop-blur-sm">
            <p className="mb-2 font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Leyenda</p>
            <div className="flex flex-col gap-1.5">
              {[
                ["origen", "Origen"],
                ["destino", "Destino"],
                ["vehiculo", "Vehículo"],
                ["incidencia", "Incidencia"],
                ["emergencia", "Emergencia"],
                ["sin_senal", "Sin señal"],
                ["ruta_real", "Ruta real"],
                ["ruta_aproximada", "Ruta aproximada"]
              ].map(([simbolo, label]) => (
                <div key={label} className="flex items-center gap-2">
                  <SimboloLeyenda simbolo={simbolo as SimboloMapa} />
                  <span className="font-body text-xs text-ui-fg-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${vistaMovil === "lista" ? "flex" : "hidden"} min-w-0 flex-col overflow-y-auto border-l border-ui-line ${panelActivosAbierto ? "lg:flex" : "lg:hidden"} lg:w-auto lg:min-w-80 lg:max-w-[24rem]`}>
          {sel && (
            <div className="border-b border-ui-line bg-ui-muted p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Seleccionado</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetalleColapsado((actual) => !actual)}
                    className="rounded-lg border border-ui-line-strong px-2.5 py-1.5 font-body text-xs font-semibold text-ui-fg-muted hover:border-ui-brand/40"
                  >
                    {detalleColapsado ? "Expandir" : "Colapsar"}
                  </button>
                  <button
                    type="button"
                    onClick={cerrarPanelSeleccionado}
                    className="rounded-lg border border-ui-line-strong px-2.5 py-1.5 font-body text-xs font-semibold text-ui-fg-muted hover:border-ui-danger/40"
                    aria-label="Cerrar detalle del traslado seleccionado"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
              <p className="font-display text-sm font-semibold">{sel.vehiculo_marca} {sel.vehiculo_modelo}</p>
              <p className="font-mono-ruum text-xs text-ui-fg-muted">{sel.origen_ciudad} → {sel.destino_ciudad}</p>
              {!detalleColapsado && (
                <>
                  <div className="mt-2"><EstadoBadge estado={sel.estado} /></div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <DatoMapa etiqueta="Conductor" valor={sel.conductor_nombre ?? "Sin conductor"} />
                    <DatoMapa etiqueta="Tiempo desde actualización" valor={calidadSeleccionada?.tiempoTexto ?? "Sin dato"} />
                    <DatoMapa etiqueta="Origen" valor={sel.origen_ciudad ?? "Sin origen"} />
                    <DatoMapa etiqueta="Destino" valor={sel.destino_ciudad ?? "Sin destino"} />
                    <DatoMapa etiqueta="Última posición" valor={calidadSeleccionada?.ultimaPosicion ?? "Sin posición"} />
                    <DatoMapa etiqueta="Fuente" valor={calidadSeleccionada?.fuente ?? "No reportada"} />
                    <DatoMapa etiqueta="Precisión" valor={calidadSeleccionada?.precision ?? "No reportada"} />
                    <DatoMapa etiqueta="Estado de señal" valor={calidadSeleccionada?.estadoTexto ?? "Sin dato"} />
                    <DatoMapa etiqueta="Punto" valor={calidadSeleccionada?.tipoPunto ?? "No confirmado"} />
                    <DatoMapa etiqueta="Último punto válido" valor={calidadSeleccionada?.ultimoPuntoValido ?? "Sin punto válido"} />
                    <DatoMapa etiqueta="Prioridad" valor={ETIQUETA_PRIORIDAD_MAPA[prioridadMapa(sel, ahora)]} />
                  </div>
                  {sel.tiene_incidencia_abierta && (
                    <div className="mt-2 rounded-lg bg-ui-danger-soft px-3 py-2">
                      <p className="font-body text-xs text-ui-danger">Incidencia abierta</p>
                    </div>
                  )}
                  {trasladoSinCoordenadas(sel) && (
                    <div className="mt-2 rounded-lg bg-ui-warning-soft px-3 py-2">
                      <p className="font-body text-xs text-ui-warning">Coordenadas incompletas</p>
                    </div>
                  )}
                </>
              )}
              <Link
                href={`/viajes/${sel.traslado_id}`}
                className="mt-3 block w-full rounded-lg border border-ui-brand/30 bg-ui-brand-soft py-2 text-center font-body text-sm text-ui-brand-soft-fg transition-colors hover:bg-ui-brand hover:text-ui-on-brand"
              >
                Ver pasaporte
              </Link>
            </div>
          )}

          <div className="p-4">
            <p className="mb-3 font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Todos los activos</p>
            <div className="flex flex-col gap-2">
              {trasladosVisibles.map((t) => {
                const calidad = calidadUbicacion(t, ahora);
                const prioridad = prioridadMapa(t, ahora);
                return (
                  <div
                    id={`mapa-lista-${t.traslado_id}`}
                    key={t.traslado_id}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors hover:-translate-y-0.5 ${
                      seleccionado === t.traslado_id
                        ? "border-ui-brand bg-ui-brand-soft"
                        : t.tiene_incidencia_abierta
                        ? "border-ui-danger/30 bg-ui-danger-soft hover:border-ui-danger/60"
                        : calidad.estadoSenal === "antigua" || calidad.estadoSenal === "sin_senal" || calidad.estadoSenal === "sin_ubicacion"
                        ? "border-ui-warning/30 bg-ui-warning-soft hover:border-ui-warning/60"
                        : "border-ui-line bg-ui-card hover:border-ui-brand/30"
                    }`}
                  >
                    <button type="button" onClick={() => seleccionarTraslado(t.traslado_id)} className="w-full text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-display text-sm font-semibold leading-tight">
                            {t.vehiculo_marca} {t.vehiculo_modelo}
                          </p>
                          <p className="font-mono-ruum text-xs text-ui-fg-muted">{t.origen_ciudad} → {t.destino_ciudad}</p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <span className={`rounded-full px-2 py-0.5 font-mono-ruum text-xs ${clasePrioridadMapa(prioridad)}`}>{ETIQUETA_PRIORIDAD_MAPA[prioridad]} · {calidad.tiempoTexto.replace("Actualizada hace ", "")}</span>
                          {t.tiene_incidencia_abierta && (
                            <span className="rounded-full bg-ui-danger-soft px-2 py-0.5 font-mono-ruum text-xs text-ui-danger">INC</span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 font-mono-ruum text-xs ${claseCalidadUbicacion(calidad.estadoSenal)}`}>{calidad.estadoCorto}</span>
                        </div>
                      </div>
                      <div className="mt-2 grid gap-1.5">
                        <p className="font-body text-xs text-ui-fg-muted">{ETIQUETA_ESTADO[t.estado] ?? t.estado}</p>
                        <p className="font-body text-xs text-ui-fg-muted">Conductor: {t.conductor_nombre ?? "Sin conductor"}</p>
                        <p className="font-mono-ruum text-xs text-ui-fg-muted">Última actualización: {calidad.tiempoTexto}</p>
                      </div>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-ui-line pt-3">
                      <Link href={`/viajes/${t.traslado_id}`} className="rounded-lg border border-ui-brand/30 px-3 py-1.5 font-body text-xs font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft">
                        Ver traslado
                      </Link>
                      <button type="button" disabled className="rounded-lg border border-ui-line px-3 py-1.5 font-body text-xs font-semibold text-ui-fg-muted opacity-70">
                        Llamar conductor
                      </button>
                      <button type="button" onClick={() => seleccionarTraslado(t.traslado_id)} className="rounded-lg border border-ui-warning/35 px-3 py-1.5 font-body text-xs font-semibold text-ui-warning hover:bg-ui-warning-soft">
                        Escalar
                      </button>
                    </div>
                  </div>
                );
              })}
              {trasladosVisibles.length === 0 && !cargando && (
                <p className="py-8 text-center font-body text-sm text-ui-fg-muted">Sin traslados activos</p>
              )}
            </div>
          </div>
        </div>

        <div className={`${vistaMovil === "alertas" ? "block" : "hidden"} min-w-0 overflow-y-auto p-4 lg:hidden`}>
          <div className="mb-3">
            <p className="font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Alertas</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ui-fg">Prioridad y confiabilidad GPS</h2>
          </div>
          <div className="grid gap-3">
            {alertasMapa.map((t) => {
              const calidad = calidadUbicacion(t, ahora);
              const alertaGps = trasladoSinCoordenadas(t) || calidad.estadoSenal === "sin_senal" || calidad.estadoSenal === "antigua";
              return (
                <button
                  key={t.traslado_id}
                  type="button"
                  onClick={() => {
                    seleccionarTraslado(t.traslado_id);
                    setVistaMovil("lista");
                  }}
                  className={`rounded-lg border p-3 text-left ${t.tiene_incidencia_abierta ? "border-ui-danger/30 bg-ui-danger-soft" : "border-ui-warning/30 bg-ui-warning-soft"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-body text-sm font-semibold text-ui-fg">{t.vehiculo_marca} {t.vehiculo_modelo}</p>
                    <span className={`rounded-full px-2 py-0.5 font-mono-ruum text-xs ${t.tiene_incidencia_abierta ? "text-ui-danger" : "text-ui-warning"}`}>
                      {t.tiene_incidencia_abierta ? "INC" : "GPS"}
                    </span>
                  </div>
                  <p className="mt-1 font-body text-xs text-ui-fg-muted">{t.origen_ciudad} → {t.destino_ciudad}</p>
                  <p className="mt-1 font-body text-xs text-ui-fg-muted">
                    {t.tiene_incidencia_abierta ? "Incidencia abierta" : alertaGps ? `${calidad.estadoTexto}. ${calidad.tiempoTexto}` : "Sin alerta GPS"}
                  </p>
                </button>
              );
            })}
            {alertasMapa.length === 0 && (
              <div className="rounded-lg border border-ui-line bg-ui-muted p-6 text-center">
                <p className="font-body text-sm text-ui-fg-muted">Sin alertas activas del mapa.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-ui-line px-6 py-2">
        <p className="font-body text-xs text-ui-fg-muted">
          Las rutas se calculan con Mapbox Directions; si el proveedor falla, se usa línea recta como degradación visual. Origen y destino son referencias de ruta. El pin de vehículo solo aparece con GPS real de `ubicaciones_traslado`.
        </p>
      </div>
    </div>
  );
}

function textoEstadoConexionMapa(estado: EstadoConexionMapa) {
  if (estado === "datos_en_vivo") return "Datos en vivo";
  if (estado === "actualizando") return "Actualizando";
  if (estado === "reconectando") return "Reconectando";
  if (estado === "desactualizado") return "Datos posiblemente desactualizados";
  return "Sin conexión";
}

function estadoGpsMapa(estadoConexion: EstadoConexionMapa, sinSenal: number, ubicacionAntigua: number) {
  if (estadoConexion === "sin_conexion" || sinSenal > 0) {
    return { etiqueta: "GPS sin señal", clase: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger" };
  }
  if (estadoConexion === "desactualizado" || ubicacionAntigua > 0) {
    return { etiqueta: "GPS por expirar", clase: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning" };
  }
  return { etiqueta: "GPS activo", clase: "border-ui-success/30 bg-ui-success-soft text-ui-success" };
}

function claseEstadoConexion(estado: EstadoConexionMapa) {
  if (estado === "datos_en_vivo") return "border-ui-success/30 bg-ui-success-soft text-ui-success";
  if (estado === "actualizando" || estado === "reconectando") return "border-ui-brand/30 bg-ui-brand-soft text-ui-brand-soft-fg";
  if (estado === "desactualizado") return "border-ui-warning/35 bg-ui-warning-soft text-ui-warning";
  return "border-ui-danger/30 bg-ui-danger-soft text-ui-danger";
}

function claseTarjetaPrioridadMapa(prioridad: CategoriaPrioridadMapa) {
  if (prioridad === "emergencia" || prioridad === "incidencia_critica") return "border-ui-danger/25 bg-ui-danger-soft";
  if (prioridad === "sla_vencido" || prioridad === "sin_senal" || prioridad === "desviacion" || prioridad === "en_riesgo") return "border-ui-warning/30 bg-ui-warning-soft";
  return "border-ui-success/25 bg-ui-success-soft";
}

function SimboloPrioridad({ categoria }: { categoria: CategoriaPrioridadMapa }) {
  const clase = categoria === "emergencia" || categoria === "incidencia_critica"
    ? "border-ui-danger text-ui-danger"
    : categoria === "normal"
      ? "border-ui-success text-ui-success"
      : "border-ui-warning text-ui-warning";
  return <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-full border-2 ${clase}`}><span className="size-2 rounded-full bg-current" /></span>;
}

function escaparHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function progresoEstimado(traslado: TrasladoMapa) {
  if (traslado.estado === "traslado_en_curso") return "50% estimado por etapa";
  if (traslado.estado === "llegada_a_destino" || traslado.estado === "evidencia_final_en_proceso" || traslado.estado === "evidencia_final_completada") return "85% estimado por etapa";
  if (traslado.estado === "entrega_confirmada" || traslado.estado === "pago_completado") return "100%";
  return "Pendiente de avance GPS";
}

function htmlPopoverVehiculo(traslado: TrasladoMapa, calidad: ReturnType<typeof calidadUbicacion>) {
  const vehiculo = escaparHtml(`${traslado.vehiculo_marca ?? "Vehículo"} ${traslado.vehiculo_modelo ?? ""}`.trim());
  const conductor = escaparHtml(traslado.conductor_nombre ?? "Sin conductor asignado");
  const ruta = escaparHtml(`${traslado.origen_ciudad} → ${traslado.destino_ciudad}`);
  const gps = escaparHtml(`${calidad.estadoTexto}. ${calidad.tiempoTexto}`);
  const progreso = escaparHtml(progresoEstimado(traslado));
  return `
    <div style="min-width:240px;font-family:Inter,system-ui,sans-serif;color:var(--ui-fg);background:var(--ui-card)">
      <p style="margin:0 0 4px;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ui-fg-muted)">Vehículo</p>
      <p style="margin:0;font-weight:700;font-size:.875rem">${vehiculo}</p>
      <p style="margin:8px 0 0;font-size:.875rem">${conductor}</p>
      <p style="margin:6px 0 0;font-size:.75rem;color:var(--ui-fg-muted)">${ruta}</p>
      <p style="margin:6px 0 0;font-size:.75rem;color:var(--ui-fg-muted)">Progreso: ${progreso}</p>
      <p style="margin:6px 0 0;font-size:.75rem;color:var(--ui-fg-muted)">GPS: ${gps}</p>
      <p style="margin:6px 0 0;font-size:.75rem;color:var(--ui-fg-muted)">La línea sólida indica ruta Mapbox; la punteada indica aproximación.</p>
      <div style="display:flex;gap:8px;margin-top:12px">
        <a href="/viajes/${encodeURIComponent(traslado.traslado_id)}" style="border:1px solid var(--ui-brand);border-radius:.375rem;padding:10px 12px;min-height:44px;font-size:.75rem;font-weight:700;text-decoration:none;color:var(--ui-brand)">Ver traslado</a>
        <span title="El mapa aún no recibe teléfono del conductor" style="border:1px solid var(--ui-line);border-radius:.375rem;padding:10px 12px;min-height:44px;font-size:.75rem;font-weight:700;color:var(--ui-fg-muted)">Contactar conductor</span>
      </div>
    </div>
  `;
}

function trasladoSinCoordenadas(traslado: TrasladoMapa) {
  return traslado.origen_lat === null || traslado.origen_lng === null || traslado.destino_lat === null || traslado.destino_lng === null;
}

function trasladoSinSenal(traslado: TrasladoMapa) {
  return calidadUbicacion(traslado, new Date()).estadoSenal === "sin_senal";
}

function calidadUbicacion(traslado: TrasladoMapa, ahora: Date | null) {
  const gpsDisponible = traslado.conductor_lat !== null && traslado.conductor_lng !== null && traslado.gps_actualizado_en !== null;
  const minutos = minutosDesdeActualizacion(traslado.gps_actualizado_en ?? traslado.actualizado_en, ahora);
  const estadoSenal: EstadoSenalMapa = traslado.coordenadas_sensibles_protegidas
    ? "sin_ubicacion"
    : !gpsDisponible
    ? "sin_ubicacion"
    : minutos >= UMBRAL_SIN_SENAL_MIN
    ? "sin_senal"
    : minutos >= UMBRAL_UBICACION_ANTIGUA_MIN
    ? "antigua"
    : "confirmada";
  const ultimaPosicion = traslado.coordenadas_sensibles_protegidas
    ? "Coordenadas protegidas por rol"
    : gpsDisponible
      ? `${traslado.conductor_lat?.toFixed(5)}, ${traslado.conductor_lng?.toFixed(5)}`
      : "Sin GPS real reportado";
  return {
    minutos,
    estadoSenal,
    estadoTexto: etiquetaEstadoSenal(estadoSenal),
    estadoCorto: etiquetaEstadoSenalCorta(estadoSenal),
    tiempoTexto: textoTiempoUbicacion(minutos),
    fuente: traslado.gps_fuente ?? "No reportada",
    precision: traslado.gps_precision_m === null ? "No reportada" : `${Math.round(traslado.gps_precision_m)} m`,
    tipoPunto: gpsDisponible ? "GPS conductor" : traslado.coordenadas_sensibles_protegidas ? "Protegido por rol" : "No confirmado",
    ultimaPosicion,
    ultimoPuntoValido: traslado.gps_actualizado_en ? textoTiempoUbicacion(minutos) : "Sin punto válido"
  };
}

function minutosDesdeActualizacion(iso: string, ahora: Date | null) {
  const referencia = ahora ?? new Date();
  return Math.max(0, Math.floor((referencia.getTime() - new Date(iso).getTime()) / 60000));
}

function textoTiempoUbicacion(minutos: number) {
  if (minutos < 1) return "Actualizada ahora";
  if (minutos < 60) return `Actualizada hace ${minutos} min`;
  return `Actualizada hace ${Math.floor(minutos / 60)} h`;
}

function etiquetaEstadoSenal(estado: EstadoSenalMapa) {
  if (estado === "estimada") return "Ubicación estimada";
  if (estado === "antigua") return "Ubicación antigua";
  if (estado === "sin_senal") return "Sin señal";
  if (estado === "sin_ubicacion") return "Sin ubicación";
  return "Ubicación confirmada";
}

function etiquetaEstadoSenalCorta(estado: EstadoSenalMapa) {
  if (estado === "estimada") return "EST";
  if (estado === "antigua") return "ANT";
  if (estado === "sin_senal") return "SIN";
  if (estado === "sin_ubicacion") return "S/U";
  return "OK";
}

function claseCalidadUbicacion(estado: EstadoSenalMapa) {
  if (estado === "confirmada") return "bg-ui-success-soft text-ui-success";
  if (estado === "estimada") return "bg-ui-warning-soft text-ui-warning";
  if (estado === "antigua" || estado === "sin_senal") return "bg-ui-warning-soft text-ui-warning";
  return "bg-ui-danger-soft text-ui-danger";
}

function prioridadMapa(traslado: TrasladoMapa, ahora: Date | null): CategoriaPrioridadMapa {
  const calidad = calidadUbicacion(traslado, ahora);
  if (esEmergenciaMapa(traslado)) return "emergencia";
  if (traslado.tiene_incidencia_abierta) return "incidencia_critica";
  if (calidad.estadoSenal === "sin_senal" || calidad.estadoSenal === "sin_ubicacion") return "sin_senal";
  if (calidad.estadoSenal === "antigua") return "en_riesgo";
  return "normal";
}

function compararPrioridadMapa(a: TrasladoMapa, b: TrasladoMapa, orden: CategoriaPrioridadMapa[], ahora: Date | null) {
  const prioridadA = prioridadMapa(a, ahora);
  const prioridadB = prioridadMapa(b, ahora);
  const indiceA = orden.indexOf(prioridadA);
  const indiceB = orden.indexOf(prioridadB);
  if (indiceA !== indiceB) return indiceA - indiceB;
  return new Date(a.actualizado_en).getTime() - new Date(b.actualizado_en).getTime();
}

function clasePrioridadMapa(prioridad: CategoriaPrioridadMapa) {
  if (prioridad === "emergencia" || prioridad === "incidencia_critica") return "bg-ui-danger-soft text-ui-danger";
  if (prioridad === "sla_vencido" || prioridad === "sin_senal" || prioridad === "desviacion" || prioridad === "en_riesgo") return "bg-ui-warning-soft text-ui-warning";
  return "bg-ui-success-soft text-ui-success";
}

function esEmergenciaMapa(traslado: TrasladoMapa) {
  return traslado.estado === "incidencia_reportada" && traslado.tiene_incidencia_abierta;
}

function puntoMedio(origen: [number, number], destino: [number, number]): [number, number] {
  return [(origen[0] + destino[0]) / 2, (origen[1] + destino[1]) / 2];
}

function puntoConductor(traslado: TrasladoMapa): [number, number] | null {
  if (traslado.conductor_lat === null || traslado.conductor_lng === null) return null;
  return [traslado.conductor_lng, traslado.conductor_lat];
}

function puntoConOffset(punto: [number, number], offset: number): [number, number] {
  return [punto[0] + offset, punto[1] + offset];
}

function SimboloLeyenda({ simbolo }: { simbolo: SimboloMapa }) {
  if (simbolo === "ruta_real") {
    return <span aria-hidden="true" className="block h-0.5 w-6 rounded-full bg-ui-brand" />;
  }
  if (simbolo === "ruta_aproximada") {
    return <span aria-hidden="true" className="block h-0.5 w-6 border-t-2 border-dashed border-ui-warning" />;
  }
  if (simbolo === "origen") {
    return <span aria-hidden="true" className="size-4 rounded-full border-2 border-ui-fg bg-ui-success" />;
  }
  if (simbolo === "destino") {
    return (
      <span aria-hidden="true" className="grid size-5 place-items-center text-ui-brand">
        <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
          <path d="M7 21V4h9l-1.4 3L16 10H7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (simbolo === "vehiculo") {
    return (
      <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border-2 border-ui-success text-ui-success">
        <svg viewBox="0 0 24 24" width="15" height="15" focusable="false">
          <path d="M5 12l7-7 7 7h-4v7H9v-7H5z" fill="currentColor" />
        </svg>
      </span>
    );
  }
  if (simbolo === "incidencia") {
    return <span aria-hidden="true" className="h-0 w-0 border-x-[9px] border-b-[16px] border-x-transparent border-b-ui-danger" />;
  }
  if (simbolo === "emergencia") {
    return <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border-2 border-ui-danger font-mono-ruum text-xs font-bold text-ui-danger">!</span>;
  }
  return <span aria-hidden="true" className="size-5 rounded-full border-2 border-dashed border-ui-field bg-ui-muted" />;
}

function DatoMapa({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg border border-ui-line bg-ui-card px-3 py-2">
      <p className="font-mono-ruum text-xs uppercase tracking-wide text-ui-fg-muted">{etiqueta}</p>
      <p className="mt-0.5 truncate font-body text-sm text-ui-fg">{valor}</p>
    </div>
  );
}

function textoActualizadoHace(fecha: Date, ahora: Date | null) {
  const referencia = ahora ?? new Date();
  const segundos = Math.max(0, Math.floor((referencia.getTime() - fecha.getTime()) / 1000));
  if (segundos < 60) return `Actualizado hace ${segundos} segundos`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Actualizado hace ${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  return `Actualizado hace ${horas} horas`;
}
