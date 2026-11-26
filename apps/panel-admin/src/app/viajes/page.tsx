"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminFiltroActivo, AdminPageHeader, limpiarParamsFiltroUrl } from "../admin-ui";
import { AdminDataTable, type AdminDataTableSortState } from "../AdminDataTable";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import {
  listarCargasTrasladosMasivosAdmin,
  listarTrasladosAdminPaginados,
  type TrazabilidadMasivaTraslado
} from "@ruum/api/services";
import type {
  PasaporteRow,
  EstadoConexionVista,
  ModoVistaOperativa,
  AuditoriaOperacionMasiva
} from "./ViajesTipos";
import {
  PESTANAS,
  ETIQUETA_FILTRO_KPI,
  ETIQUETA_ACCION_OPERATIVA,
  COLUMNAS_OPERATIVAS_INICIALES,
  ACCIONES_MASIVAS,
  formatoFechaAbsoluta,
  idTrasladoOperativo
} from "./ViajesTipos";
import { DetalleRapidoTraslado } from "./ViajesComponentes";
import { VistaKanbanTraslados, VistaMapaTraslados, AccionMasivaDialog } from "./ViajesVistas";
import { ViajesFiltrosToolbar } from "./ViajesFiltrosToolbar";
import { useViajesFiltros } from "./useViajesFiltros";
import { useViajesAccionesMasivas } from "./useViajesAccionesMasivas";
import { useViajesVistasGuardadas } from "./useViajesVistasGuardadas";
import { useColumnasTraslados } from "./ViajesColumnas";

export default function PaginaTrasladosAdmin() {
  const [pestana, setPestana] = useState("todos");
  const [traslados, setTraslados] = useState<PasaporteRow[]>([]);
  const [trazabilidadPorTraslado, setTrazabilidadPorTraslado] = useState<Map<string, TrazabilidadMasivaTraslado>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexionVista>("actualizando");
  const [ultimaRespuestaExitosa, setUltimaRespuestaExitosa] = useState<Date | null>(null);
  const [seccionesDesactualizadas, setSeccionesDesactualizadas] = useState<string[]>([]);
  const [actualizandoManual, setActualizandoManual] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [columnasVisibles, setColumnasVisibles] = useState<Set<string>>(() => new Set(COLUMNAS_OPERATIVAS_INICIALES));
  const [ordenTabla, setOrdenTabla] = useState<AdminDataTableSortState>({ columnId: "sla", direction: "desc" });
  const [auditoriaMasiva, setAuditoriaMasiva] = useState<AuditoriaOperacionMasiva[]>([]);
  const [modoVista, setModoVista] = useState<ModoVistaOperativa>("lista");
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(25);
  const [totalResultados, setTotalResultados] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const paginaRef = useRef(1);
  const botonCerrarDetalleRef = useRef<HTMLButtonElement | null>(null);
  const focoAntesDetalleRef = useRef<HTMLElement | null>(null);

  const filtroActual = PESTANAS.find((p) => p.id === pestana)!.filtro;

  const {
    busqueda,
    setBusqueda,
    filtroKpi,
    setFiltroKpi,
    accionOperativa,
    setAccionOperativa,
    filtros,
    setFiltros,
    filtrosAvanzadosAbiertos,
    setFiltrosAvanzadosAbiertos,
    detalleAbiertoId,
    setDetalleAbiertoId,
    trasladosFiltrados,
    opcionesFiltros,
    sugerenciasBusqueda,
    chips,
    hayFiltrosActivos,
    metricasOperativas,
    columnasKanban,
    limpiarFiltrosVista
  } = useViajesFiltros({
    traslados,
    pestana,
    setPestana,
    trazabilidadPorTraslado,
    limpiarParamsFiltroUrl
  });

  const trasladosSeleccionados = useMemo(
    () => trasladosFiltrados.filter((traslado) => seleccionados.has(idTrasladoOperativo(traslado))),
    [seleccionados, trasladosFiltrados]
  );

  const {
    accionMasiva,
    setAccionMasiva,
    estadoAccionMasiva,
    resultadosAccionMasiva,
    confirmacionMasiva,
    setConfirmacionMasiva,
    responsableMasivo,
    setResponsableMasivo,
    prioridadMasiva,
    setPrioridadMasiva,
    etiquetaMasiva,
    setEtiquetaMasiva,
    procesandoMasiva,
    abrirAccionMasiva,
    ejecutarAccionMasiva
  } = useViajesAccionesMasivas({
    trasladosSeleccionados,
    setAuditoriaMasiva: (updater) => setAuditoriaMasiva(updater)
  });

  const {
    vistasDisponibles,
    nombreVista,
    setNombreVista,
    alcanceVista,
    setAlcanceVista,
    guardarVistaActual,
    aplicarVista,
    establecerPredeterminada
  } = useViajesVistasGuardadas({
    filtros,
    setFiltros,
    busqueda,
    setBusqueda,
    columnasVisibles,
    setColumnasVisibles,
    ordenTabla,
    setOrdenTabla,
    setPestana,
    setAuditoriaMasiva: (updater) => setAuditoriaMasiva(updater)
  });

  const columnasTraslados = useColumnasTraslados(trazabilidadPorTraslado);

  useEffect(() => {
    if (!detalleAbiertoId) return;
    focoAntesDetalleRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cerrarDetalleRapido();
    };
    document.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => botonCerrarDetalleRef.current?.focus(), 0);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detalleAbiertoId]);

  const cargar = useCallback(
    async (esRefresco = false, paginaRequerida?: number) => {
      if (!esRefresco) setCargando(true);
      if (esRefresco) setActualizandoManual(true);
      if (!tieneSupabaseConfigurado()) {
        setTraslados([]);
        setEstadoConexion("sin_conexion");
        setUltimaRespuestaExitosa(null);
        setSeccionesDesactualizadas([]);
        setCargando(false);
        setActualizandoManual(false);
        return;
      }

      try {
        const cliente = crearClienteNavegador();
        const pag = paginaRequerida ?? paginaRef.current;
        if (esRefresco) {
          setEstadoConexion((prev) => (prev === "datos_en_vivo" ? "reconectando" : "actualizando"));
        }
        const [resultado, masivos] = await Promise.all([
          listarTrasladosAdminPaginados(cliente, pag, tamanoPagina, filtroActual, busqueda || undefined, "creado_en", "desc"),
          listarCargasTrasladosMasivosAdmin(cliente).catch(() => ({ cargas: [], filas: [] }))
        ]);
        const trasladosResultado = Array.isArray(resultado.data) ? resultado.data : [];
        const paginacionResultado = resultado.paginacion ?? {
          pagina: pag,
          tamano: tamanoPagina,
          total: trasladosResultado.length,
          total_paginas: trasladosResultado.length > 0 ? 1 : 0
        };
        const cargasPorId = new Map((masivos.cargas ?? []).map((carga) => [carga.id, carga]));
        setTrazabilidadPorTraslado(
          new Map(
            (masivos.filas ?? [])
              .filter((fila) => fila.traslado_id)
              .flatMap((fila) => {
                const carga = cargasPorId.get(fila.carga_id);
                return carga && fila.traslado_id
                  ? [[fila.traslado_id, { carga, fila } as TrazabilidadMasivaTraslado]]
                  : [];
              })
          )
        );
        setTraslados(trasladosResultado);
        setTotalResultados(paginacionResultado.total);
        setTotalPaginas(paginacionResultado.total_paginas);
        setEstadoConexion("datos_en_vivo");
        setUltimaRespuestaExitosa(new Date());
        setSeccionesDesactualizadas([]);
      } catch {
        setEstadoConexion("sin_conexion");
        setSeccionesDesactualizadas(["traslados_operativos"]);
      } finally {
        setCargando(false);
        setActualizandoManual(false);
      }
    },
    [busqueda, filtroActual, tamanoPagina]
  );

  useEffect(() => {
    paginaRef.current = 1;
    setPagina(1);
    const timer = setTimeout(() => void cargar(), 0);
    return () => clearTimeout(timer);
  }, [cargar]);

  const trasladoDetalle = useMemo(
    () => traslados.find((t) => t.traslado_id === detalleAbiertoId) ?? null,
    [detalleAbiertoId, traslados]
  );

  function abrirDetalleRapido(traslado: PasaporteRow) {
    if (!traslado.traslado_id) return;
    setDetalleAbiertoId(traslado.traslado_id);
  }

  function cerrarDetalleRapido() {
    setDetalleAbiertoId(null);
    window.setTimeout(() => focoAntesDetalleRef.current?.focus(), 0);
  }

  return (
    <main className="admin-page-shell">
      <AdminPageHeader
        etiqueta="Operación"
        titulo={accionOperativa ? ETIQUETA_ACCION_OPERATIVA[accionOperativa] : filtroKpi ? ETIQUETA_FILTRO_KPI[filtroKpi] : "Traslados"}
        descripcion={
          accionOperativa
            ? "Selecciona el traslado operativo correspondiente."
            : filtroKpi
            ? "Vista filtrada desde indicadores accionables del dashboard."
            : "Bandeja operativa para revisar folios, conductor asignado, monto autorizado y estado actual."
        }
        estadoConexion={estadoConexion}
        ultimaActualizacion={ultimaRespuestaExitosa}
        tipoDatos="administrativos"
        seccionesDesactualizadas={seccionesDesactualizadas}
        contadorResultados={trasladosFiltrados.length}
        accion={
          <button
            type="button"
            onClick={() => void cargar(true)}
            disabled={actualizandoManual}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ui-brand bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg shadow-ui-sm transition-colors hover:bg-ui-brand-hover disabled:cursor-wait disabled:opacity-70"
          >
            <span aria-hidden="true">↻</span>
            {actualizandoManual ? "Reconectando" : "Actualizar"}
          </button>
        }
      />

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-ui-line" role="group" aria-label="Filtrar traslados por estado">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={pestana === p.id}
            aria-label={`Ver traslados: ${p.etiqueta}`}
            onClick={() => {
              setPestana(p.id);
              setFiltros((actual) => ({ ...actual, estado: p.filtro }));
            }}
            className={[
              "inline-flex min-h-11 shrink-0 items-center gap-2 px-4 py-2.5 font-body text-sm font-semibold transition-colors",
              pestana === p.id ? "border-b-2 border-ui-brand bg-ui-brand-soft text-ui-fg" : "text-ui-fg-muted hover:bg-ui-muted hover:text-ui-fg"
            ].join(" ")}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {filtroKpi && (
        <AdminFiltroActivo
          etiqueta={ETIQUETA_FILTRO_KPI[filtroKpi]}
          onLimpiar={() => {
            setFiltroKpi(null);
            setAccionOperativa(null);
            limpiarParamsFiltroUrl();
          }}
        />
      )}

      {accionOperativa && (
        <div className="mt-4 rounded-lg border border-ui-brand/35 bg-ui-brand-soft px-4 py-3">
          <p className="font-body text-sm font-semibold text-ui-fg">{ETIQUETA_ACCION_OPERATIVA[accionOperativa]}</p>
          <p className="mt-1 font-body text-xs text-ui-fg-muted">
            {accionOperativa === "asignar_conductor"
              ? "Abre el folio sin conductor y usa el bloque de asignación del pasaporte."
              : "Abre el folio activo y registra la incidencia desde su seguimiento operativo."}
          </p>
        </div>
      )}

      <ViajesFiltrosToolbar
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        sugerenciasBusqueda={sugerenciasBusqueda}
        filtros={filtros}
        setFiltros={setFiltros}
        filtrosAvanzadosAbiertos={filtrosAvanzadosAbiertos}
        setFiltrosAvanzadosAbiertos={setFiltrosAvanzadosAbiertos}
        filtroKpi={filtroKpi}
        setFiltroKpi={setFiltroKpi}
        accionOperativa={accionOperativa}
        setAccionOperativa={setAccionOperativa}
        chips={chips}
        hayFiltrosActivos={hayFiltrosActivos}
        limpiarFiltrosVista={limpiarFiltrosVista}
        metricasOperativas={metricasOperativas}
        opcionesFiltros={opcionesFiltros}
        vistasDisponibles={vistasDisponibles}
        nombreVista={nombreVista}
        setNombreVista={setNombreVista}
        alcanceVista={alcanceVista}
        setAlcanceVista={setAlcanceVista}
        guardarVistaActual={guardarVistaActual}
        aplicarVista={aplicarVista}
        establecerPredeterminada={establecerPredeterminada}
        modoVista={modoVista}
        setModoVista={setModoVista}
      />

      {modoVista === "lista" && (
        <AdminDataTable
          caption="Lista de traslados operativos"
          rows={trasladosFiltrados}
          columns={columnasTraslados}
          getRowId={(v) => v.traslado_id ?? `sin-folio-${v.creado_en ?? ""}-${v.vehiculo_modelo ?? ""}`}
          loading={cargando}
          emptyMessage="No se encontraron traslados con los filtros aplicados."
          emptyAction={
            <button
              type="button"
              onClick={limpiarFiltrosVista}
              className="mx-auto rounded-lg border border-ui-brand/35 px-3 py-2 font-body text-sm font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft"
            >
              Limpiar filtros
            </button>
          }
          partialError={seccionesDesactualizadas.length > 0 ? `Error parcial: ${seccionesDesactualizadas.join(", ")}.` : null}
          selectedIds={seleccionados}
          onSelectionChange={setSeleccionados}
          sortState={ordenTabla}
          onSortChange={setOrdenTabla}
          visibleColumnIds={columnasVisibles}
          onVisibleColumnIdsChange={setColumnasVisibles}
          pageSizeOptions={[tamanoPagina]}
          rowActions={[
            { label: "Vista rápida", onClick: abrirDetalleRapido },
            { label: "Abrir expediente", href: (v) => (v.traslado_id ? `/viajes/${v.traslado_id}` : "/viajes") },
            {
              label: "Asignar conductor",
              href: (v) => (v.traslado_id ? `/viajes/${v.traslado_id}#asignar-conductor` : "/viajes?filtro=sin_asignacion")
            }
          ]}
          bulkActions={ACCIONES_MASIVAS.map((accion) => ({
            label: accion.etiqueta,
            destructive: accion.destructiva,
            requiresConfirmation: accion.requiereConfirmacion,
            onClick: () => abrirAccionMasiva(accion)
          }))}
          hidePagination
        />
      )}

      {modoVista === "kanban" && <VistaKanbanTraslados columnas={columnasKanban} onAbrirDetalle={abrirDetalleRapido} />}

      {modoVista === "mapa" && <VistaMapaTraslados traslados={trasladosFiltrados} onAbrirDetalle={abrirDetalleRapido} />}

      {modoVista === "lista" && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ui-line bg-ui-card px-4 py-3">
          <label className="font-body text-sm text-ui-fg-muted">
            Filas por página
            <select
              className="ml-2 rounded-lg border border-ui-line bg-ui-muted px-2 py-1 text-ui-fg"
              value={tamanoPagina}
              onChange={(e) => {
                setTamanoPagina(Number(e.target.value));
                paginaRef.current = 1;
                setPagina(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-ui-line bg-ui-muted px-3 py-1.5 text-sm text-ui-fg disabled:opacity-50"
              disabled={pagina <= 1 || cargando}
              onClick={() => {
                const sig = Math.max(1, pagina - 1);
                paginaRef.current = sig;
                setPagina(sig);
                void cargar(false, sig);
              }}
            >
              Anterior
            </button>
            <span className="font-body text-sm text-ui-fg-muted">
              Página {totalResultados > 0 ? pagina : 1} de {Math.max(1, totalPaginas)} · {totalResultados.toLocaleString("es-MX")}{" "}
              resultados
            </span>
            <button
              type="button"
              className="rounded-lg border border-ui-line bg-ui-muted px-3 py-1.5 text-sm text-ui-fg disabled:opacity-50"
              disabled={totalPaginas <= 1 || pagina >= totalPaginas || cargando}
              onClick={() => {
                const sig = Math.min(totalPaginas, pagina + 1);
                paginaRef.current = sig;
                setPagina(sig);
                void cargar(false, sig);
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {auditoriaMasiva.length > 0 && (
        <section className="mt-4 rounded-lg border border-ui-line bg-ui-card p-4" aria-label="Auditoría de acciones masivas">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Auditoría operativa</p>
              <h2 className="mt-1 font-display text-lg font-semibold text-ui-fg">Últimas acciones masivas</h2>
            </div>
            <span className="font-body text-sm text-ui-fg-muted">{auditoriaMasiva.length} registros</span>
          </div>
          <div className="mt-3 grid gap-2">
            {auditoriaMasiva.slice(0, 5).map((evento) => (
              <div key={evento.id} className="rounded-lg border border-ui-line bg-ui-muted p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body text-sm font-semibold text-ui-fg">{evento.accion}</p>
                  <span className="font-body text-xs text-ui-fg-muted">{formatoFechaAbsoluta(evento.timestamp)}</span>
                </div>
                <p className="mt-1 font-body text-xs text-ui-fg-muted">
                  {evento.afectados} afectados · {evento.exitosos} aplicados · {evento.omitidos} omitidos · {evento.bloqueados} bloqueados
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {accionMasiva && (
        <AccionMasivaDialog
          accion={accionMasiva}
          total={trasladosSeleccionados.length}
          estado={estadoAccionMasiva}
          resultados={resultadosAccionMasiva}
          confirmacion={confirmacionMasiva}
          onConfirmacionChange={setConfirmacionMasiva}
          responsable={responsableMasivo}
          onResponsableChange={setResponsableMasivo}
          prioridad={prioridadMasiva}
          onPrioridadChange={setPrioridadMasiva}
          etiqueta={etiquetaMasiva}
          onEtiquetaChange={setEtiquetaMasiva}
          procesando={procesandoMasiva}
          onCerrar={() => setAccionMasiva(null)}
          onEjecutar={() => void ejecutarAccionMasiva()}
        />
      )}

      {trasladoDetalle && (
        <DetalleRapidoTraslado
          traslado={trasladoDetalle}
          trazabilidad={trasladoDetalle.traslado_id ? trazabilidadPorTraslado.get(trasladoDetalle.traslado_id) ?? null : null}
          botonCerrarRef={botonCerrarDetalleRef}
          onCerrar={cerrarDetalleRapido}
          onAsignar={() => {
            cerrarDetalleRapido();
            window.location.href = trasladoDetalle.traslado_id
              ? `/viajes/${trasladoDetalle.traslado_id}#asignar-conductor`
              : "/viajes?filtro=sin_asignacion";
          }}
        />
      )}
    </main>
  );
}
