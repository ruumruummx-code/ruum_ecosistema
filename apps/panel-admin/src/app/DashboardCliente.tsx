"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../lib/supabase-browser";
import {
  obtenerIndicadoresAccionablesDashboard,
  listarIncidenciasAdmin,
  listarConductoresAdmin,
  obtenerAlertasEmergenciaAdmin,
  obtenerAdminActual,
  listarTrasladosActivosMapa,
  type TrasladoMapa,
  type IndicadorAccionableDashboard
} from "@ruum/api/services";
import { CONFIG_ROL_ADMIN, normalizarRolAdmin, puedeVerRuta, type RolAdminOperativo } from "../lib/roles-admin";
import type { Database } from "@ruum/shared/types";
import { useHybridRefresh } from "../hooks/useHybridRefresh";

type IncidenciaRow = Database["public"]["Tables"]["incidencias"]["Row"];
type ConductorRow = Database["public"]["Tables"]["conductores"]["Row"];
type AuditoriaRow = Database["public"]["Tables"]["registro_auditoria"]["Row"];
type EstadoConexionDashboard = "datos_en_vivo" | "actualizando" | "reconectando" | "sin_conexion" | "desactualizado";

export type DashboardInitialData = {
  indicadores: IndicadorAccionableDashboard[];
  incidencias: IncidenciaRow[];
  emergencias: AuditoriaRow[];
  conductoresDocVencido: ConductorRow[];
  trasladosActivos: TrasladoMapa[];
  rol: RolAdminOperativo;
  cargadoEn: string;
};

function etiquetaTipoIncidencia(tipo: string) {
  return tipo.replaceAll("_", " ");
}

function iconoKpi(tono: string) {
  if (tono === "azul") return "↗";
  if (tono === "ambar") return "◷";
  if (tono === "rojo") return "!";
  return "▤";
}

function proyectarUbicaciones(traslados: TrasladoMapa[]) {
  const conCoordenadas = traslados.filter((traslado) =>
    traslado.origen_lat !== null && traslado.origen_lng !== null && traslado.destino_lat !== null && traslado.destino_lng !== null
  ).slice(0, 8);
  const valores = conCoordenadas.flatMap((traslado) => [
    { lat: traslado.origen_lat as number, lng: traslado.origen_lng as number },
    { lat: traslado.destino_lat as number, lng: traslado.destino_lng as number },
  ]);
  if (valores.length === 0) return [];
  const minLat = Math.min(...valores.map((punto) => punto.lat));
  const maxLat = Math.max(...valores.map((punto) => punto.lat));
  const minLng = Math.min(...valores.map((punto) => punto.lng));
  const maxLng = Math.max(...valores.map((punto) => punto.lng));
  const proyectar = (lat: number, lng: number) => ({
    x: Math.round(34 + (maxLng === minLng ? 0.5 : (lng - minLng) / (maxLng - minLng)) * 452),
    y: Math.round(28 + (maxLat === minLat ? 0.5 : (maxLat - lat) / (maxLat - minLat)) * 192),
  });
  return conCoordenadas.map((traslado) => ({
    traslado,
    origen: proyectar(traslado.origen_lat as number, traslado.origen_lng as number),
    destino: proyectar(traslado.destino_lat as number, traslado.destino_lng as number),
  }));
}

function gravedadDashboardIncidencia(tipo: string) {
  if (tipo === "dano_previo_relevante" || tipo === "vehiculo_no_enciende") return "grave";
  if (tipo === "contacto_no_localizado" || tipo === "documentacion_incompleta") return "media";
  return "leve";
}

export default function DashboardCliente({ inicial }: { inicial: DashboardInitialData | null }) {
  const [indicadores, setIndicadores] = useState<IndicadorAccionableDashboard[]>(inicial?.indicadores ?? []);
  const [incidencias, setIncidencias] = useState<IncidenciaRow[]>(inicial?.incidencias ?? []);
  const [emergencias, setEmergencias] = useState<AuditoriaRow[]>(inicial?.emergencias ?? []);
  const [conductoresDocVencido, setConductoresDocVencido] = useState<ConductorRow[]>(inicial?.conductoresDocVencido ?? []);
  const [trasladosActivos, setTrasladosActivos] = useState<TrasladoMapa[]>(inicial?.trasladosActivos ?? []);
  const [cargando, setCargando] = useState(!inicial);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<Date | null>(inicial ? new Date(inicial.cargadoEn) : null);
  const [ahora, setAhora] = useState<Date | null>(null);
  const [estadoConexionDatos, setEstadoConexionDatos] = useState<EstadoConexionDashboard>(inicial ? "datos_en_vivo" : "actualizando");
  const [seccionesDesactualizadas, setSeccionesDesactualizadas] = useState<string[]>([]);
  const [actualizandoManual, setActualizandoManual] = useState(false);
  const [rolAdmin, setRolAdmin] = useState<RolAdminOperativo>(inicial?.rol ?? "operador");
  const [errorOperacional, setErrorOperacional] = useState<string | null>(inicial ? null : "No pudimos obtener datos reales del dashboard. Verifica la sesión administrativa y la configuración de Supabase.");
  const ultimaRespuestaExitosaRef = useRef<Date | null>(inicial ? new Date(inicial.cargadoEn) : null);

  async function cargarDashboard(esRefresco = false, manual = false, activo = true) {
      if (!esRefresco) setCargando(true);
      if (manual) setActualizandoManual(true);
      if (!tieneSupabaseConfigurado()) {
        if (!activo) return;
        const teniaRespuestaExitosa = Boolean(ultimaRespuestaExitosaRef.current);
        if (!teniaRespuestaExitosa) {
          setIndicadores([]);
          setIncidencias([]);
          setEmergencias([]);
          setConductoresDocVencido([]);
          setTrasladosActivos([]);
        }
        setEstadoConexionDatos(teniaRespuestaExitosa ? "desactualizado" : "sin_conexion");
        setSeccionesDesactualizadas(["KPIs administrativos", "alertas operativas", "conductores"]);
        setErrorOperacional("Supabase no está configurado. El dashboard final no muestra datos demo; requiere una fuente administrativa real.");
        setCargando(false);
        setActualizandoManual(false);
        return;
      }

      try {
        if (esRefresco) setEstadoConexionDatos(ultimaRespuestaExitosaRef.current ? "reconectando" : "actualizando");
        const cliente = crearClienteNavegador();
        const [adminActual, indicadoresReales, incidenciasReales, conductoresReales, emergenciasReales] = await Promise.all([
          obtenerAdminActual(cliente),
          obtenerIndicadoresAccionablesDashboard(cliente),
          listarIncidenciasAdmin(cliente),
          listarConductoresAdmin(cliente),
          obtenerAlertasEmergenciaAdmin(cliente)
        ]);
        if (!activo) return;
        setIndicadores(indicadoresReales);
        setIncidencias(incidenciasReales.filter((i) => !i.resuelta));
        setEmergencias(emergenciasReales);
        setConductoresDocVencido(conductoresReales.filter((c) => !c.documentos_vigentes));
        const rolActual = normalizarRolAdmin(adminActual?.rol_operativo);
        setRolAdmin(rolActual);
        let trasladosMapa: TrasladoMapa[] = [];
        if (puedeVerRuta(rolActual, "/mapa")) {
          try { trasladosMapa = await listarTrasladosActivosMapa(cliente); }
          catch (errorMapa) { console.warn("[dashboard] resumen del mapa no disponible", errorMapa); }
        }
        setTrasladosActivos(trasladosMapa);
        const fecha = new Date();
        ultimaRespuestaExitosaRef.current = fecha;
        setUltimaSincronizacion(fecha);
        setEstadoConexionDatos("datos_en_vivo");
        setSeccionesDesactualizadas([]);
        setErrorOperacional(null);
      } catch (error) {
        const teniaRespuestaExitosa = Boolean(ultimaRespuestaExitosaRef.current);
        if (!activo) return;
        if (!teniaRespuestaExitosa) {
          setIndicadores([]);
          setIncidencias([]);
          setEmergencias([]);
          setConductoresDocVencido([]);
          setTrasladosActivos([]);
        }
        setEstadoConexionDatos(teniaRespuestaExitosa ? "desactualizado" : "sin_conexion");
        setSeccionesDesactualizadas(["KPIs administrativos", "alertas operativas", "conductores"]);
        setErrorOperacional(error instanceof Error ? error.message : "No pudimos obtener datos reales del dashboard.");
      } finally {
        if (activo) setCargando(false);
        if (activo) setActualizandoManual(false);
      }
  }

  useEffect(() => {
    let activo = true;
    if (!inicial) void cargarDashboard(false, false, activo);
    return () => { activo = false; };
  }, [inicial]);

  const refrescarHibrido = useCallback(() => cargarDashboard(true, false, true), []);
  useHybridRefresh({ refrescar: refrescarHibrido, intervaloRespaldoMs: 180_000 });

  useEffect(() => {
    setAhora(new Date());
    const intervalo = window.setInterval(() => setAhora(new Date()), 30000);
    return () => window.clearInterval(intervalo);
  }, []);

  const turno = useMemo(() => {
    if (!ahora) return "Turno pendiente";
    const hora = ahora.getHours();
    if (hora >= 6 && hora < 14) return "Matutino";
    if (hora >= 14 && hora < 22) return "Vespertino";
    return "Nocturno";
  }, [ahora]);

  const configuracionRol = CONFIG_ROL_ADMIN[rolAdmin];
  const indicadoresVisibles = useMemo(() => {
    const orden = new Map(configuracionRol.indicadores.map((clave, indice) => [clave, indice]));
    return indicadores
      .filter((indicador) => orden.has(indicador.clave))
      .sort((a, b) => (orden.get(a.clave) ?? 99) - (orden.get(b.clave) ?? 99));
  }, [configuracionRol.indicadores, indicadores]);
  const actualizacionGlobal = useMemo(() => {
    const cortes = indicadores
      .map((indicador) => new Date(indicador.actualizadoEn))
      .filter((fecha) => Number.isFinite(fecha.getTime()));
    if (ultimaSincronizacion) cortes.push(ultimaSincronizacion);
    if (cortes.length === 0) return null;
    return new Date(Math.max(...cortes.map((fecha) => fecha.getTime())));
  }, [indicadores, ultimaSincronizacion]);
  const conexionGlobal = estadoConexionGlobal(estadoConexionDatos, actualizacionGlobal, ahora);
  const indice = (clave: IndicadorAccionableDashboard["clave"]) => indicadoresVisibles.find((item) => item.clave === clave);
  const kpisInicio = [
    { etiqueta: "Traslados en curso", valor: indice("traslados_activos")?.valor ?? 0, detalle: "Servicios activos", href: puedeVerRuta(rolAdmin, "/viajes") ? "/viajes?filtro=activos" : "/alertas-sla", tono: "azul" },
    { etiqueta: "Pendientes de asignación", valor: indice("sin_asignacion")?.valor ?? 0, detalle: "Sin conductor asignado", href: puedeVerRuta(rolAdmin, "/viajes") ? "/viajes?filtro=sin_asignacion" : "/incidencias", tono: "ambar" },
    { etiqueta: "Incidencias abiertas", valor: incidencias.length, detalle: "Requieren seguimiento", href: "/incidencias?filtro=abiertas", tono: "rojo" },
    { etiqueta: "Documentos por revisar", valor: conductoresDocVencido.length, detalle: "Vencidos o incompletos", href: "/conductores", tono: "turquesa" },
  ] as const;
  const atenciones = [
    ...emergencias.map((evento) => ({ id: `emergencia-${evento.id}`, titulo: "Emergencia activada", detalle: `Traslado ${evento.traslado_id?.slice(0, 8).toUpperCase() ?? "sin folio"} · ${formatoHoraCorta(new Date(evento.timestamp))}`, href: evento.traslado_id && puedeVerRuta(rolAdmin, "/viajes") ? `/viajes/${evento.traslado_id}` : "/incidencias", tono: "rojo" })),
    ...incidencias.map((incidencia) => ({ id: `incidencia-${incidencia.id}`, titulo: "Incidencia sin resolver", detalle: incidencia.descripcion || etiquetaTipoIncidencia(incidencia.tipo), href: puedeVerRuta(rolAdmin, "/viajes") ? `/viajes/${incidencia.traslado_id}` : "/incidencias", tono: gravedadDashboardIncidencia(incidencia.tipo) === "grave" ? "rojo" : "ambar" })),
    ...conductoresDocVencido.map((conductor) => ({ id: `documento-${conductor.id}`, titulo: "Documentación por revisar", detalle: conductor.nombre, href: "/conductores", tono: "ambar" })),
  ].slice(0, 5);
  const puedeVerMapa = puedeVerRuta(rolAdmin, "/mapa");
  const rutasMapa = proyectarUbicaciones(trasladosActivos);
  const nombreDia = (ahora ?? new Date()).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City" });

  return (
    <main className="admin-page-shell dashboard-home">
      <header className="dashboard-home__header">
        <div><p className="dashboard-home__eyebrow">Torre de Control</p><h1>Buen día</h1><p className="dashboard-home__subline">Resumen de la operación · <span className="capitalize">{nombreDia}</span></p></div>
        <div className="dashboard-home__header-actions"><span className={`dashboard-home__live ${conexionGlobal.clase}`}><i className={conexionGlobal.punto} />{conexionGlobal.etiqueta}{actualizacionGlobal ? ` · ${textoActualizadoHace(actualizacionGlobal, ahora)}` : ""}</span><button type="button" className="dashboard-home__refresh" onClick={() => void cargarDashboard(true, true)} disabled={actualizandoManual} aria-label="Actualizar información">{actualizandoManual ? "Actualizando…" : "↻ Actualizar"}</button>{puedeVerRuta(rolAdmin, "/masivos") ? <Link href="/masivos" className="dashboard-home__primary">＋ Programar traslados</Link> : <Link href="/viajes" className="dashboard-home__primary">Ver traslados <span aria-hidden="true">→</span></Link>}</div>
      </header>

      {errorOperacional && <div className="dashboard-home__notice"><Aviso tono="atencion">{errorOperacional}</Aviso></div>}
      {seccionesDesactualizadas.length > 0 && <div className="dashboard-home__notice"><Aviso tono="atencion">Datos que podrían estar desactualizados: {seccionesDesactualizadas.join(", ")}.</Aviso></div>}

      <section className="dashboard-home__kpis" aria-label="Indicadores principales">
        {kpisInicio.map((kpi) => <Link key={kpi.etiqueta} href={kpi.href} className={`dashboard-home__kpi dashboard-home__kpi--${kpi.tono}`}><span className="dashboard-home__kpi-icon" aria-hidden="true">{iconoKpi(kpi.tono)}</span><span className="dashboard-home__kpi-title">{kpi.etiqueta}</span><strong>{cargando ? "—" : kpi.valor}</strong><small>{kpi.detalle}</small><span className="dashboard-home__kpi-link">Ver detalle <span aria-hidden="true">→</span></span></Link>)}
      </section>

      <section className="dashboard-home__workarea" aria-label="Vista de operación">
        <div className="dashboard-home__panel dashboard-home__trips">
          <div className="dashboard-home__panel-heading"><div><h2>Traslados activos</h2><p>Seguimiento de los servicios en curso</p></div><Link href="/viajes?filtro=activos">Ver todos <span aria-hidden="true">→</span></Link></div>
          {trasladosActivos.length > 0 ? <div className="dashboard-home__table-wrap"><table className="dashboard-home__table"><thead><tr><th>Traslado</th><th>Ruta</th><th>Conductor</th><th>Estado</th></tr></thead><tbody>{trasladosActivos.slice(0, 5).map((traslado) => <tr key={traslado.traslado_id}><td><Link href={`/viajes/${traslado.traslado_id}`}>#{traslado.traslado_id.slice(0, 8).toUpperCase()}</Link>{traslado.tiene_incidencia_abierta && <span className="dashboard-home__incident-flag">Incidencia</span>}</td><td>{traslado.origen_ciudad || "Origen"}<span className="dashboard-home__route-arrow">→</span>{traslado.destino_ciudad || "Destino"}</td><td>{traslado.conductor_nombre ?? "Por asignar"}</td><td><span className="dashboard-home__status">{traslado.estado.replaceAll("_", " ")}</span></td></tr>)}</tbody></table></div> : <div className="dashboard-home__empty"><span aria-hidden="true">↗</span><strong>{cargando ? "Cargando traslados…" : puedeVerMapa ? "Sin traslados activos" : "Seguimiento de traslados"}</strong><p>{puedeVerMapa ? "Cuando haya servicios en curso, aparecerán aquí." : "El resumen de ubicación está limitado para tu perfil."}</p></div>}
        </div>

        <div className="dashboard-home__panel dashboard-home__map-panel">
          <div className="dashboard-home__panel-heading"><div><h2>Mapa operativo</h2><p>{puedeVerMapa ? `${trasladosActivos.length} traslados activos` : "Vista de operación"}</p></div>{puedeVerMapa && <Link href="/mapa" aria-label="Abrir mapa operativo">Abrir <span aria-hidden="true">↗</span></Link>}</div>
          {puedeVerMapa ? <Link href="/mapa" className="dashboard-home__map" aria-label="Abrir mapa en vivo">
            <svg viewBox="0 0 520 250" role="img" aria-label={rutasMapa.length ? "Resumen de rutas activas" : "Mapa de operación"}>
              <rect width="520" height="250" fill="#edf4f3"/><g className="dashboard-home__map-streets"><path d="M-15 34 535 34M-15 96 535 96M-15 164 535 164M-15 220 535 220M52-10 52 260M143-10 143 260M248-10 248 260M355-10 355 260M459-10 459 260"/><path d="m-12 72 545 91M69-10l230 270M418-10 205 260"/></g>
              {rutasMapa.map((ruta) => <g key={ruta.traslado.traslado_id}><path d={`M${ruta.origen.x} ${ruta.origen.y} L${ruta.destino.x} ${ruta.destino.y}`} className="dashboard-home__map-route"/><circle cx={ruta.origen.x} cy={ruta.origen.y} r="7" className="dashboard-home__map-pin"/><circle cx={ruta.destino.x} cy={ruta.destino.y} r="5" className="dashboard-home__map-destination"/></g>)}
              {rutasMapa.length === 0 && <g className="dashboard-home__map-empty-mark"><circle cx="260" cy="116" r="25"/><path d="M260 102c-8 0-14 6-14 14 0 10 14 23 14 23s14-13 14-23c0-8-6-14-14-14Zm0 19a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></g>}
              <rect x="18" y="18" width="104" height="28" rx="14" className="dashboard-home__map-badge"/><circle cx="34" cy="32" r="4"/><text x="45" y="36">{rutasMapa.length ? `${rutasMapa.length} rutas` : "Vista operativa"}</text>
            </svg>
          </Link> : <div className="dashboard-home__map dashboard-home__map--restricted"><span aria-hidden="true">⌖</span><strong>El mapa no está disponible para este perfil</strong><small>Las ubicaciones se muestran según los permisos operativos.</small></div>}
          <div className="dashboard-home__map-footer"><span><i /> En curso</span><span>{puedeVerMapa ? "Ubicaciones según permisos" : "Ubicaciones restringidas"}</span></div>
        </div>
      </section>

      <section className="dashboard-home__attention" aria-label="Requiere atención">
        <div className="dashboard-home__panel-heading"><div><h2>Requiere atención</h2><p>Prioridades para mantener la operación en movimiento</p></div><Link href="/incidencias?filtro=abiertas">Ver bandeja <span aria-hidden="true">→</span></Link></div>
        {atenciones.length ? <div className="dashboard-home__attention-grid">{atenciones.map((item) => <Link key={item.id} href={item.href} className={`dashboard-home__attention-card dashboard-home__attention-card--${item.tono}`}><span className="dashboard-home__attention-icon" aria-hidden="true">{item.tono === "rojo" ? "!" : "◷"}</span><span className="dashboard-home__attention-copy"><strong>{item.titulo}</strong><small>{item.detalle}</small><em>Atender <span aria-hidden="true">→</span></em></span></Link>)}</div> : <div className="dashboard-home__all-clear"><span aria-hidden="true">✓</span><div><strong>Todo en orden</strong><p>No hay alertas operativas pendientes para revisar.</p></div></div>}
      </section>

      <footer className="dashboard-home__footer"><span>Rol operativo: {configuracionRol.etiqueta} · Turno {turno}</span><span>Última actualización: {actualizacionGlobal ? formatoHoraCorta(actualizacionGlobal) : "Sin datos recientes"}</span></footer>
    </main>
  );
}

function estadoConexionGlobal(estado: EstadoConexionDashboard, actualizacion: Date | null, ahora: Date | null) {
  const referencia = ahora ?? new Date();
  const minutos = actualizacion ? Math.floor((referencia.getTime() - actualizacion.getTime()) / 60000) : Number.POSITIVE_INFINITY;
  if (estado === "sin_conexion" || estado === "desactualizado" || minutos >= 5) {
    return {
      etiqueta: estado === "sin_conexion" ? "Sin conexión" : "Revisar conexión",
      clase: "border-status-error/30 bg-status-error-soft text-status-error",
      punto: "bg-status-error"
    };
  }
  if (estado === "actualizando" || estado === "reconectando" || minutos >= 3) {
    return {
      etiqueta: estado === "reconectando" ? "Reconectando" : "Sincronizando",
      clase: "border-status-warning/35 bg-status-warning-soft text-status-warning",
      punto: "bg-status-warning"
    };
  }
  return {
    etiqueta: "Conectado",
    clase: "border-status-success/30 bg-status-success-soft text-status-success",
    punto: "bg-status-success"
  };
}

function textoActualizadoHace(fecha: Date, ahora: Date | null) {
  const referencia = ahora ?? new Date();
  const segundos = Math.max(0, Math.floor((referencia.getTime() - fecha.getTime()) / 1000));
  if (segundos < 60) return `Hace ${segundos} segundos`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Hace ${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  return `Hace ${horas} horas`;
}

function formatoHoraCorta(valor: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City"
  }).format(valor);
}

