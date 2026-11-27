"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { Badge, Button, Card, EmptyState } from "@ruum/ui/base";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, FileText, MapPinOff, Plus, RefreshCw, TrendingUp, Truck } from "lucide-react";
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
    { etiqueta: "Traslados abiertos", valor: indice("traslados_activos")?.valor ?? 0, detalle: "Incluye los que esperan conductor", href: puedeVerRuta(rolAdmin, "/viajes") ? "/viajes?filtro=activos" : "/alertas-sla", tono: "azul" },
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
    <main className="admin-page-shell">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="font-mono-ruum text-xs font-medium uppercase tracking-widest text-ui-brand">Torre de Control</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ui-fg xl:text-3xl">Buen día</h1>
          <p className="mt-1 text-sm text-ui-fg-muted">Resumen de la operación · <span className="capitalize">{nombreDia}</span></p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge tone={conexionGlobal.tono} dot className="h-8 px-3">
            {conexionGlobal.etiqueta}{actualizacionGlobal ? ` · ${textoActualizadoHace(actualizacionGlobal, ahora)}` : ""}
          </Badge>
          <Button variant="outline" onClick={() => void cargarDashboard(true, true)} disabled={actualizandoManual} aria-label="Actualizar información">
            <RefreshCw className={actualizandoManual ? "motion-safe:animate-spin" : undefined} />
            {actualizandoManual ? "Actualizando…" : "Actualizar"}
          </Button>
          {puedeVerRuta(rolAdmin, "/masivos")
            ? <Button asChild><Link href="/masivos"><Plus />Programar traslados</Link></Button>
            : <Button asChild><Link href="/viajes">Ver traslados <ArrowRight /></Link></Button>}
        </div>
      </header>

      {errorOperacional && <div className="mt-4"><Aviso tono="atencion">{errorOperacional}</Aviso></div>}
      {seccionesDesactualizadas.length > 0 && <div className="mt-4"><Aviso tono="atencion">Datos que podrían estar desactualizados: {seccionesDesactualizadas.join(", ")}.</Aviso></div>}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principales">
        {kpisInicio.map((kpi) => {
          const Icon = ICONO_KPI[kpi.tono];
          return (
            <Card asChild key={kpi.etiqueta} className="group flex flex-col gap-1 p-5 transition-colors hover:border-ui-line-strong hover:bg-ui-muted">
              <Link href={kpi.href}>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ui-fg-muted">{kpi.etiqueta}</span>
                  <span aria-hidden="true" className={`grid size-8 place-items-center rounded-md ${CLASE_TONO_KPI[kpi.tono]}`}><Icon className="size-4" /></span>
                </span>
                <strong className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-ui-fg">{cargando ? "—" : kpi.valor}</strong>
                <span className="text-xs text-ui-fg-muted">{kpi.detalle}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ui-brand group-hover:underline">Ver detalle <ArrowRight className="size-4" aria-hidden="true" /></span>
              </Link>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" aria-label="Vista de operación">
        <Card className="flex min-w-0 flex-col overflow-hidden">
          <EncabezadoPanel titulo="Traslados activos" descripcion="Seguimiento de los servicios en curso" href="/viajes?filtro=activos" accion="Ver todos" />
          {trasladosActivos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ui-muted text-left text-xs text-ui-fg-muted">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-medium">Traslado</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Ruta</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Conductor</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-line">
                  {trasladosActivos.slice(0, 5).map((traslado) => (
                    <tr key={traslado.traslado_id} className="hover:bg-ui-muted">
                      <td className="px-5 py-3">
                        <Link href={`/viajes/${traslado.traslado_id}`} className="font-mono-ruum font-medium text-ui-brand hover:underline">#{traslado.traslado_id.slice(0, 8).toUpperCase()}</Link>
                        {traslado.tiene_incidencia_abierta && <Badge tone="danger" className="ml-2">Incidencia</Badge>}
                      </td>
                      <td className="px-5 py-3 text-ui-fg">{traslado.origen_ciudad || "Origen"}<span aria-hidden="true" className="px-1.5 text-ui-fg-muted">→</span><span className="sr-only"> a </span>{traslado.destino_ciudad || "Destino"}</td>
                      <td className="px-5 py-3 text-ui-fg">{traslado.conductor_nombre ?? <Badge tone="warning">Por asignar</Badge>}</td>
                      <td className="px-5 py-3"><Badge tone="info" className="capitalize">{traslado.estado.replaceAll("_", " ")}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              className="m-5 mt-0 flex-1 justify-center"
              icono={<Truck />}
              titulo={cargando ? "Cargando traslados…" : puedeVerMapa ? "Sin traslados en operación" : "Seguimiento de traslados"}
              descripcion={puedeVerMapa ? "Aquí aparecen los traslados que ya tienen conductor asignado." : "El resumen de ubicación está limitado para tu perfil."}
            />
          )}
        </Card>

        <Card className="flex min-w-0 flex-col overflow-hidden">
          <EncabezadoPanel titulo="Mapa operativo" descripcion={puedeVerMapa ? `${trasladosActivos.length} traslados activos` : "Vista de operación"} href={puedeVerMapa ? "/mapa" : undefined} accion="Abrir" etiquetaAccion="Abrir mapa operativo" />
          {puedeVerMapa ? (
            <Link href="/mapa" className="mx-5 block overflow-hidden rounded-md border border-ui-line" aria-label="Abrir mapa en vivo">
              <svg viewBox="0 0 520 250" role="img" aria-label={rutasMapa.length ? "Resumen de rutas activas" : "Mapa de operación"} className="block h-auto w-full">
                <rect width="520" height="250" className="fill-ui-muted" />
                <g className="fill-none stroke-ui-line-strong" strokeWidth="1.5"><path d="M-15 34 535 34M-15 96 535 96M-15 164 535 164M-15 220 535 220M52-10 52 260M143-10 143 260M248-10 248 260M355-10 355 260M459-10 459 260" /><path d="m-12 72 545 91M69-10l230 270M418-10 205 260" /></g>
                {rutasMapa.map((ruta) => (
                  <g key={ruta.traslado.traslado_id}>
                    <path d={`M${ruta.origen.x} ${ruta.origen.y} L${ruta.destino.x} ${ruta.destino.y}`} className="fill-none stroke-ui-brand" strokeWidth="3" strokeLinecap="round" />
                    <circle cx={ruta.origen.x} cy={ruta.origen.y} r="7" className="fill-ui-brand stroke-ui-card" strokeWidth="3" />
                    <circle cx={ruta.destino.x} cy={ruta.destino.y} r="5" className="fill-ui-card stroke-ui-brand" strokeWidth="3" />
                  </g>
                ))}
                {rutasMapa.length === 0 && <g className="fill-ui-fg-muted"><path d="M260 102c-8 0-14 6-14 14 0 10 14 23 14 23s14-13 14-23c0-8-6-14-14-14Zm0 19a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" /></g>}
              </svg>
            </Link>
          ) : (
            <EmptyState className="m-5 mt-0 flex-1 justify-center" icono={<MapPinOff />} titulo="El mapa no está disponible para este perfil" descripcion="Las ubicaciones se muestran según los permisos operativos." />
          )}
          <div className="mt-auto flex items-center justify-between gap-3 px-5 py-3 text-xs text-ui-fg-muted">
            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-ui-brand" />En curso{rutasMapa.length ? ` · ${rutasMapa.length} rutas` : ""}</span>
            <span>{puedeVerMapa ? "Ubicaciones según permisos" : "Ubicaciones restringidas"}</span>
          </div>
        </Card>
      </section>

      <Card asChild className="mt-6 overflow-hidden">
        <section aria-label="Requiere atención">
          <EncabezadoPanel titulo="Requiere atención" descripcion="Prioridades para mantener la operación en movimiento" href="/incidencias?filtro=abiertas" accion="Ver bandeja" />
          {atenciones.length ? (
            <ul className="grid gap-3 px-5 pb-5 md:grid-cols-2 xl:grid-cols-3">
              {atenciones.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="group flex h-full items-start gap-3 rounded-md border border-ui-line p-4 transition-colors hover:border-ui-line-strong hover:bg-ui-muted">
                    <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-md ${item.tono === "rojo" ? "bg-ui-danger-soft text-ui-danger" : "bg-ui-warning-soft text-ui-warning"}`}>
                      {item.tono === "rojo" ? <AlertTriangle className="size-4" /> : <Clock className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm font-semibold text-ui-fg">{item.titulo}</strong>
                      <small className="block truncate text-xs text-ui-fg-muted">{item.detalle}</small>
                      <Badge tone={item.tono === "rojo" ? "danger" : "warning"} className="mt-2">{item.tono === "rojo" ? "Prioridad alta" : "Seguimiento"}</Badge>
                    </span>
                    <span className="self-center text-sm font-semibold text-ui-brand group-hover:underline">Atender<span aria-hidden="true"> →</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mx-5 mb-5 flex items-center gap-3 rounded-md bg-ui-success-soft p-4 text-ui-success">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
              <div><strong className="block text-sm font-semibold">Todo en orden</strong><p className="text-sm">No hay alertas operativas pendientes para revisar.</p></div>
            </div>
          )}
        </section>
      </Card>

      <footer className="mt-6 flex flex-wrap justify-between gap-2 text-xs text-ui-fg-muted">
        <span>Rol operativo: {configuracionRol.etiqueta} · Turno {turno}</span>
        <span>Última actualización: {actualizacionGlobal ? formatoHoraCorta(actualizacionGlobal) : "Sin datos recientes"}</span>
      </footer>
    </main>
  );
}

const ICONO_KPI = { azul: TrendingUp, ambar: Clock, rojo: AlertTriangle, turquesa: FileText } as const;
const CLASE_TONO_KPI = {
  azul: "bg-ui-brand-soft text-ui-brand-soft-fg",
  ambar: "bg-ui-warning-soft text-ui-warning",
  rojo: "bg-ui-danger-soft text-ui-danger",
  turquesa: "bg-ui-neutral-soft text-ui-neutral",
} as const;

function EncabezadoPanel({ titulo, descripcion, href, accion, etiquetaAccion }: { titulo: string; descripcion: string; href?: string; accion: string; etiquetaAccion?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ui-fg">{titulo}</h2>
        <p className="text-sm text-ui-fg-muted">{descripcion}</p>
      </div>
      {href && <Button asChild variant="ghost" size="sm"><Link href={href} aria-label={etiquetaAccion}>{accion} <ArrowRight /></Link></Button>}
    </div>
  );
}

function estadoConexionGlobal(estado: EstadoConexionDashboard, actualizacion: Date | null, ahora: Date | null) {
  const referencia = ahora ?? new Date();
  const minutos = actualizacion ? Math.floor((referencia.getTime() - actualizacion.getTime()) / 60000) : Number.POSITIVE_INFINITY;
  if (estado === "sin_conexion" || estado === "desactualizado" || minutos >= 5) {
    return {
      etiqueta: estado === "sin_conexion" ? "Sin conexión" : "Revisar conexión",
      tono: "danger" as const
    };
  }
  if (estado === "actualizando" || estado === "reconectando" || minutos >= 3) {
    return {
      etiqueta: estado === "reconectando" ? "Reconectando" : "Sincronizando",
      tono: "warning" as const
    };
  }
  return {
    etiqueta: "Conectado",
    tono: "success" as const
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

