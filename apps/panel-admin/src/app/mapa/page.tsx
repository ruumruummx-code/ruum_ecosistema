"use client";

/**
 * PRD §10.3 — Mapa operativo. Muestra todos los traslados activos con pin
 * de origen (azul trazabilidad) y pin de destino (amarillo ruta), línea punteada de
 * ruta calculada, y panel lateral de selección. Usa Mapbox GL JS y Directions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Aviso } from "@ruum/ui";
import { listarTrasladosActivosMapa, type TrasladoMapa } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import {
  ETIQUETA_ESTADO,
  type EstadoConexionMapa,
  type VistaMapaMovil,
  type FiltroMapa,
  type SimboloMapa,
  type CategoriaPrioridadMapa,
  UMBRAL_SIN_SENAL_MIN,
  FRECUENCIA_GPS_ESPERADA_SEG,
  ORDEN_PRIORIDAD_MAPA,
  textoEstadoConexionMapa,
  estadoGpsMapa,
  claseEstadoConexion,
  trasladoSinCoordenadas,
  calidadUbicacion,
  compararPrioridadMapa,
  puntoMedio,
  textoActualizadoHace
} from "./MapaTipos";
import { SimboloLeyenda, PanelPrioridad } from "./MapaComponentes";
import { MapaPanelLateral } from "./MapaPanelLateral";
import { useMapboxOperativo } from "./useMapboxOperativo";

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
  const focoPrevioPanelRef = useRef<HTMLElement | null>(null);
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
  }, [ultimaRespuestaExitosa]);

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

  const { mapaRef, errorMapa } = useMapboxOperativo({
    mapRef,
    cargando,
    trasladosVisibles,
    ahora,
    onSeleccionarTraslado: seleccionarTraslado
  });

  useEffect(() => {
    if (vistaMovil === "mapa") window.setTimeout(() => mapaRef.current?.resize(), 0);
  }, [vistaMovil, mapaRef]);

  useEffect(() => {
    if (!seleccionado) return;
    document.getElementById(`mapa-lista-${seleccionado}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const traslado = traslados.find((t) => t.traslado_id === seleccionado);
    if (!traslado || trasladoSinCoordenadas(traslado)) return;
    const centro = puntoMedio([traslado.origen_lng!, traslado.origen_lat!], [traslado.destino_lng!, traslado.destino_lat!]);
    mapaRef.current?.flyTo({ center: centro, zoom: Math.max(mapaRef.current.getZoom(), 7), duration: 650, essential: true });
  }, [seleccionado, traslados, mapaRef]);

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
        <PanelPrioridad
          ordenPrioridad={ordenPrioridad}
          onMoverPrioridad={moverPrioridad}
          onRestablecerPrioridad={restablecerPrioridad}
        />
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

        <MapaPanelLateral
          sel={sel}
          trasladosVisibles={trasladosVisibles}
          alertasMapa={alertasMapa}
          cargando={cargando}
          seleccionado={seleccionado}
          detalleColapsado={detalleColapsado}
          panelActivosAbierto={panelActivosAbierto}
          vistaMovil={vistaMovil}
          ahora={ahora}
          onSeleccionarTraslado={seleccionarTraslado}
          onCerrarSeleccionado={cerrarPanelSeleccionado}
          onToggleDetalleColapsado={() => setDetalleColapsado((act) => !act)}
          onCambiarVistaMovil={setVistaMovil}
        />
      </div>

      <div className="border-t border-ui-line px-6 py-2">
        <p className="font-body text-xs text-ui-fg-muted">
          Las rutas se calculan con Mapbox Directions; si el proveedor falla, se usa línea recta como degradación visual. Origen y destino son referencias de ruta. El pin de vehículo solo aparece con GPS real de `ubicaciones_traslado`.
        </p>
      </div>
    </div>
  );
}
