"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TicketsSoporte } from "./TicketsSoporte";
import { ColaVerificacionesRepuve } from "./ColaVerificacionesRepuve";
import { Aviso } from "@ruum/ui";
import { listarIncidenciasTorre } from "@ruum/api/incidents";
import { crearClienteNavegador, puedeUsarDatosDemo, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { AdminPageHeader, AdminPanel, limpiarParamsFiltroUrl } from "../admin-ui";
import { AdminButton, AdminErrorState, AdminLoadingState, AdminTooltip } from "../admin-components";
import {
  type Incidencia,
  type EstadoConexionVista,
  type FiltroTipo,
  type FiltroOrigen,
  type FiltroResponsable,
  type FiltroGravedad,
  type FiltroEstadoReal,
  type FiltroSeveridadReal,
  TIPOS,
  FILTROS_TIPO,
  FILTROS_ORIGEN,
  FILTROS_RESPONSABLE,
  FILTROS_GRAVEDAD,
  FILTROS_ESTADO_REAL,
  FILTROS_SEVERIDAD_REAL,
  INCIDENCIAS_DEMO,
  etiquetaResponsable,
  etiquetaOrigen,
  origenInferido,
  responsableSugerido,
  gravedadIncidencia,
  horasTranscurridas,
  formatoDuracion,
  vencimientoSlaMs,
  slaIncidencia,
  fechaCompacta,
  fechaCompleta
} from "./IncidenciasTipos";
import {
  KpiIncidencia,
  ChipFiltroIncidencia,
  EmptyIncidencias,
  FiltroSelect
} from "./IncidenciasComponentes";
import { IncidenciaCard } from "./IncidenciaCard";

export default function PaginaIncidenciasAdmin() {
  const [tipo, setTipo] = useState<FiltroTipo>("abiertas");
  const [origen, setOrigen] = useState<FiltroOrigen>("todos");
  const [responsableFiltro, setResponsableFiltro] = useState<FiltroResponsable>("todos");
  const [gravedadFiltro, setGravedadFiltro] = useState<FiltroGravedad>("todos");
  const [estadoRealFiltro, setEstadoRealFiltro] = useState<FiltroEstadoReal>("todos");
  const [severidadFiltro, setSeveridadFiltro] = useState<FiltroSeveridadReal>("todos");
  const [responsables, setResponsables] = useState<Record<string, Exclude<FiltroResponsable, "todos"> | "">>({});
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>(INCIDENCIAS_DEMO);
  const [esDemo, setEsDemo] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [actualizandoManual, setActualizandoManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexionVista>("actualizando");
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const ahora = useMemo(() => ultimaActualizacion ?? new Date(), [ultimaActualizacion]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filtroUrl = params.get("filtro");
    const tipoUrl = params.get("tipo");
    const gravedadUrl = params.get("gravedad");
    if (filtroUrl === "abiertas") setTipo("abiertas");
    if (filtroUrl === "historial") setTipo("todos");
    if (FILTROS_TIPO.some((item) => item.valor === tipoUrl)) setTipo(tipoUrl as FiltroTipo);
    if (FILTROS_GRAVEDAD.some((item) => item.valor === gravedadUrl)) setGravedadFiltro(gravedadUrl as FiltroGravedad);
  }, []);

  const cargar = useCallback(async (manual = false) => {
    if (manual) setActualizandoManual(true);
    else setCargando(true);

    if (!tieneSupabaseConfigurado()) {
      setIncidencias(INCIDENCIAS_DEMO);
      setEsDemo(true);
      setError(null);
      setEstadoConexion("demo");
      setUltimaActualizacion(new Date());
      setCargando(false);
      setActualizandoManual(false);
      return;
    }

    try {
      setError(null);
      setIncidencias(await listarIncidenciasTorre(crearClienteNavegador()));
      setEsDemo(false);
      setEstadoConexion("datos_en_vivo");
      setUltimaActualizacion(new Date());
    } catch {
      if (puedeUsarDatosDemo()) {
        setIncidencias(INCIDENCIAS_DEMO);
        setEsDemo(true);
        setError(null);
        setEstadoConexion("demo");
        setUltimaActualizacion(new Date());
      } else {
        setIncidencias([]);
        setEsDemo(false);
        setError("No pudimos cargar las incidencias.");
        setEstadoConexion("sin_conexion");
      }
    } finally {
      setCargando(false);
      setActualizandoManual(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const conteosTipo = useMemo(() => {
    const conteos = Object.fromEntries(FILTROS_TIPO.map((item) => [item.valor, 0])) as Record<FiltroTipo, number>;
    conteos.todos = incidencias.length;
    conteos.abiertas = incidencias.filter((incidencia) => !incidencia.resuelta).length;
    for (const incidencia of incidencias) {
      if (TIPOS.includes(incidencia.tipo as Exclude<FiltroTipo, "todos" | "abiertas">)) {
        conteos[incidencia.tipo as Exclude<FiltroTipo, "todos" | "abiertas">] += 1;
      }
    }
    return conteos;
  }, [incidencias]);

  const visibles = useMemo(() => incidencias.filter((incidencia) => {
    const responsableActual = responsables[incidencia.id] || responsableSugerido(incidencia);
    const coincideTipo = tipo === "todos" || (tipo === "abiertas" ? !incidencia.resuelta : incidencia.tipo === tipo);
    const coincideOrigen = origen === "todos" || origenInferido(incidencia) === origen;
    const coincideResponsable = responsableFiltro === "todos" || responsableActual === responsableFiltro;
    const coincideGravedad = gravedadFiltro === "todos" || gravedadIncidencia(incidencia) === gravedadFiltro;
    const coincideEstadoReal = estadoRealFiltro === "todos" || (incidencia.estado ?? "abierta") === estadoRealFiltro;
    const coincideSeveridad = severidadFiltro === "todos" || (incidencia.severidad ?? "medium") === severidadFiltro;
    return coincideTipo && coincideOrigen && coincideResponsable && coincideGravedad && coincideEstadoReal && coincideSeveridad;
  }).sort((a, b) => {
    if (a.resuelta !== b.resuelta) return a.resuelta ? 1 : -1;
    return vencimientoSlaMs(a) - vencimientoSlaMs(b);
  }), [estadoRealFiltro, gravedadFiltro, incidencias, origen, responsableFiltro, responsables, severidadFiltro, tipo]);

  const kpis = useMemo(() => {
    const abiertas = incidencias.filter((incidencia) => !incidencia.resuelta);
    const promedioHoras = abiertas.length
      ? abiertas.reduce((total, incidencia) => total + horasTranscurridas(incidencia.creada_en, ahora), 0) / abiertas.length
      : 0;
    const hoy = ahora.toISOString().slice(0, 10);
    return {
      abiertas: abiertas.length,
      promedio: formatoDuracion(promedioHoras),
      enRiesgo: abiertas.filter((incidencia) => slaIncidencia(incidencia, ahora).enRiesgo).length,
      sinAsignar: abiertas.filter((incidencia) => !incidencia.responsable_admin_id).length,
      resueltasHoy: incidencias.filter((incidencia) => incidencia.resuelta_en?.startsWith(hoy)).length
    };
  }, [ahora, incidencias]);

  function limpiarFiltros() {
    setTipo("abiertas");
    setOrigen("todos");
    setResponsableFiltro("todos");
    setGravedadFiltro("todos");
    setEstadoRealFiltro("todos");
    setSeveridadFiltro("todos");
    limpiarParamsFiltroUrl();
  }

  function verHistorialCompleto() {
    setTipo("todos");
    setOrigen("todos");
    setResponsableFiltro("todos");
    setGravedadFiltro("todos");
    setEstadoRealFiltro("todos");
    setSeveridadFiltro("todos");
    limpiarParamsFiltroUrl();
  }

  function contextoFiltro() {
    if (tipo === "abiertas" && origen === "todos" && responsableFiltro === "todos") {
      return "Las incidencias abiertas accionables son aquellas que requieren intervención inmediata del equipo operativo.";
    }
    const partes = [
      tipo === "todos" ? "historial completo" : FILTROS_TIPO.find((item) => item.valor === tipo)?.etiqueta,
      origen !== "todos" ? `origen ${etiquetaOrigen(origen).toLowerCase()}` : null,
      responsableFiltro !== "todos" ? `responsable ${etiquetaResponsable(responsableFiltro).toLowerCase()}` : null,
      gravedadFiltro !== "todos" ? `gravedad ${gravedadFiltro}` : null
    ].filter(Boolean);
    return `Vista filtrada por ${partes.join(", ")}.`;
  }

  return (
    <main className="admin-page-shell">
      <AdminPageHeader
        etiqueta="Riesgos y cumplimiento"
        titulo="Incidencias"
        descripcion="Bandeja operativa para priorizar casos abiertos, SLA, responsables internos y origen del riesgo."
        estadoConexion={estadoConexion}
        tipoDatos="administrativos"
        contadorResultados={visibles.length}
        accion={(
          <div className="flex flex-wrap items-center gap-2">
            {ultimaActualizacion && (
              <AdminTooltip label={fechaCompleta(ultimaActualizacion)}>
                <span className="inline-flex min-h-10 items-center rounded-lg border border-ui-line bg-ui-card px-3 py-2 font-body text-xs font-semibold text-ui-fg-muted">
                  Actualizado: {fechaCompacta(ultimaActualizacion)}
                </span>
              </AdminTooltip>
            )}
            <AdminButton variant="secondary" loading={actualizandoManual} onClick={() => void cargar(true)}>
              Actualizar
            </AdminButton>
          </div>
        )}
      />

      <TicketsSoporte />
      <ColaVerificacionesRepuve />
      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiIncidencia etiqueta="Abiertas / activas" valor={kpis.abiertas} detalle={`Promedio transcurrido: ${kpis.promedio}`} />
        <KpiIncidencia etiqueta="En riesgo de SLA" valor={kpis.enRiesgo} detalle="Requieren atencion prioritaria" tono={kpis.enRiesgo > 0 ? "alerta" : "neutral"} />
        <KpiIncidencia etiqueta="Sin asignar" valor={kpis.sinAsignar} detalle="Casos abiertos sin responsable confirmado" tono={kpis.sinAsignar > 0 ? "alerta" : "neutral"} />
        <KpiIncidencia etiqueta="Resueltas hoy" valor={kpis.resueltasHoy} detalle="Cierres registrados durante el dia" tono="exito" />
      </section>

      <div className="mt-4">
        <Aviso tono={esDemo ? "info" : "atencion"}>
          {esDemo ? "Vista con datos de ejemplo para operación administrativa." : "Incidencias reales de la operación."}
        </Aviso>
      </div>

      {mensajeAccion && (
        <div className="mt-4">
          <Aviso tono="info">{mensajeAccion}</Aviso>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <AdminErrorState
            description={error}
            action={(
              <AdminButton variant="secondary" onClick={() => void cargar(true)}>
                Reintentar
              </AdminButton>
            )}
          />
        </div>
      )}

      <section className="mt-6">
        <AdminPanel className="p-5">
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Bandeja de casos</p>
              <p className="mt-1 font-body text-sm text-ui-fg-muted">{contextoFiltro()}</p>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros por tipo de incidencia">
              {FILTROS_TIPO.map((item) => (
                <ChipFiltroIncidencia
                  key={item.valor}
                  activo={tipo === item.valor}
                  etiqueta={item.etiqueta}
                  contador={conteosTipo[item.valor]}
                  onClick={() => setTipo(item.valor)}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <FiltroSelect label="Origen" value={origen} opciones={FILTROS_ORIGEN} onChange={setOrigen} />
              <FiltroSelect label="Responsable" value={responsableFiltro} opciones={FILTROS_RESPONSABLE} onChange={setResponsableFiltro} />
              <FiltroSelect label="Gravedad" value={gravedadFiltro} opciones={FILTROS_GRAVEDAD} onChange={setGravedadFiltro} />
              <FiltroSelect label="Estado" value={estadoRealFiltro} opciones={FILTROS_ESTADO_REAL} onChange={setEstadoRealFiltro} />
              <FiltroSelect label="Severidad" value={severidadFiltro} opciones={FILTROS_SEVERIDAD_REAL} onChange={setSeveridadFiltro} />
            </div>
          </div>
        </AdminPanel>
      </section>

      <section className="mt-6" aria-label="Resultados de incidencias">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-ui-fg">Casos priorizados por vencimiento de SLA</h2>
          <span className="font-body text-sm font-medium text-ui-fg-muted" aria-live="polite">{visibles.length} caso{visibles.length === 1 ? "" : "s"} en esta vista</span>
        </div>
        <div className="grid gap-4">
        {cargando && <AdminLoadingState label="Cargando incidencias" />}
        {!cargando && visibles.length === 0 && <EmptyIncidencias onLimpiar={limpiarFiltros} onHistorial={verHistorialCompleto} />}
        {!cargando && visibles.map((incidencia) => (
          <IncidenciaCard
            key={incidencia.id}
            incidencia={incidencia}
            ahora={ahora}
            responsable={responsables[incidencia.id] ?? ""}
            onResponsable={(value) => {
              setResponsables((actuales) => ({ ...actuales, [incidencia.id]: value }));
              setMensajeAccion(`Responsable seleccionado: ${etiquetaResponsable(value)}`);
            }}
            onAccion={(accion) => setMensajeAccion(accion)}
            onCambio={() => void cargar(true)}
            esDemo={esDemo}
          />
        ))}
        </div>
      </section>
    </main>
  );
}
