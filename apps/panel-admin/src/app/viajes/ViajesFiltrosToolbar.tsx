"use client";

import type { Dispatch, SetStateAction } from "react";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type {
  FiltrosAvanzados,
  FiltroSla,
  FiltroFecha,
  FiltroKpi,
  AccionOperativa,
  VistaGuardada,
  AlcanceVistaGuardada,
  ModoVistaOperativa
} from "./ViajesTipos";
import {
  CLASE_CONTROL_FILTRO,
  ETIQUETA_FILTRO_KPI,
  ETIQUETA_ACCION_OPERATIVA,
  VISTAS_PREDEFINIDAS
} from "./ViajesTipos";
import {
  KpiOperativo,
  FiltroInteligente,
  CampoFiltro,
  ChipFiltro
} from "./ViajesComponentes";

export function ViajesFiltrosToolbar({
  busqueda,
  setBusqueda,
  sugerenciasBusqueda,
  filtros,
  setFiltros,
  filtrosAvanzadosAbiertos,
  setFiltrosAvanzadosAbiertos,
  filtroKpi,
  setFiltroKpi,
  accionOperativa,
  setAccionOperativa,
  chips,
  hayFiltrosActivos,
  limpiarFiltrosVista,
  metricasOperativas,
  opcionesFiltros,
  vistasDisponibles,
  nombreVista,
  setNombreVista,
  alcanceVista,
  setAlcanceVista,
  guardarVistaActual,
  aplicarVista,
  establecerPredeterminada,
  modoVista,
  setModoVista
}: {
  busqueda: string;
  setBusqueda: (valor: string) => void;
  sugerenciasBusqueda: string[];
  filtros: FiltrosAvanzados;
  setFiltros: Dispatch<SetStateAction<FiltrosAvanzados>>;
  filtrosAvanzadosAbiertos: boolean;
  setFiltrosAvanzadosAbiertos: Dispatch<SetStateAction<boolean>>;
  filtroKpi: FiltroKpi | null;
  setFiltroKpi: Dispatch<SetStateAction<FiltroKpi | null>>;
  accionOperativa: AccionOperativa | null;
  setAccionOperativa: Dispatch<SetStateAction<AccionOperativa | null>>;
  chips: Array<{ id: string; label: string; onRemove: () => void }>;
  hayFiltrosActivos: boolean;
  limpiarFiltrosVista: () => void;
  metricasOperativas: {
    total: number;
    riesgo: number;
    vencidos: number;
    sinConductor: number;
    inician60: number;
    incidencia: number;
    sinUbicacion: number;
  };
  opcionesFiltros: {
    empresas: [string, string][];
    conductores: string[];
    vehiculos: string[];
  };
  vistasDisponibles: VistaGuardada[];
  nombreVista: string;
  setNombreVista: (valor: string) => void;
  alcanceVista: AlcanceVistaGuardada;
  setAlcanceVista: (valor: AlcanceVistaGuardada) => void;
  guardarVistaActual: (esPredeterminada?: boolean) => void;
  aplicarVista: (vista: VistaGuardada) => void;
  establecerPredeterminada: (vistaId: string) => void;
  modoVista: ModoVistaOperativa;
  setModoVista: (modo: ModoVistaOperativa) => void;
}) {
  return (
    <>
      <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Resumen operativo de traslados">
        <KpiOperativo etiqueta="En riesgo" valor={metricasOperativas.riesgo} detalle={`${metricasOperativas.vencidos} vencidos`} tono="riesgo" onClick={() => setFiltros((actual) => ({ ...actual, sla: "en_riesgo" }))} />
        <KpiOperativo etiqueta="Sin conductor" valor={metricasOperativas.sinConductor} detalle="Requieren asignación" tono="atencion" onClick={() => setFiltros((actual) => ({ ...actual, sinAsignacion: true }))} />
        <KpiOperativo etiqueta="Inician 60 min" valor={metricasOperativas.inician60} detalle="Ventana inmediata" tono="info" onClick={() => setFiltros((actual) => ({ ...actual, proximos: true }))} />
        <KpiOperativo etiqueta="Con incidencia" valor={metricasOperativas.incidencia} detalle={`${metricasOperativas.sinUbicacion} sin ubicación completa`} tono="critico" onClick={() => setFiltros((actual) => ({ ...actual, incidencia: true }))} />
      </section>

      <section className="mt-4 rounded-lg border border-ui-line bg-ui-card p-3 shadow-ui-sm" aria-label="Filtros de traslados">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="min-w-72 flex-1">
            <CampoFiltro etiqueta="Buscar traslado">
              <input
                id="buscar-traslados"
                type="search"
                list="sugerencias-busqueda-traslados"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Folio, vehículo, placa, origen o destino"
                className={CLASE_CONTROL_FILTRO}
              />
            </CampoFiltro>
            {sugerenciasBusqueda.length > 0 && (
              <datalist id="sugerencias-busqueda-traslados">
                {sugerenciasBusqueda.map((sugerencia) => <option key={sugerencia} value={sugerencia} />)}
              </datalist>
            )}
          </div>

          <div className="min-w-0 flex-[1.4]">
            <p className="mb-1 font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Filtros inteligentes</p>
            <div className="flex overflow-x-auto rounded-full border border-ui-line bg-ui-muted p-1">
              <FiltroInteligente activo={filtros.sla === "en_riesgo"} etiqueta="En riesgo" conteo={metricasOperativas.riesgo} onClick={() => setFiltros((actual) => ({ ...actual, sla: actual.sla === "en_riesgo" ? "todos" : "en_riesgo" }))} />
              <FiltroInteligente activo={filtros.sinAsignacion} etiqueta="Sin conductor" conteo={metricasOperativas.sinConductor} onClick={() => setFiltros((actual) => ({ ...actual, sinAsignacion: !actual.sinAsignacion }))} />
              <FiltroInteligente activo={filtros.proximos} etiqueta="Inician 60" conteo={metricasOperativas.inician60} onClick={() => setFiltros((actual) => ({ ...actual, proximos: !actual.proximos }))} />
              <FiltroInteligente activo={filtros.incidencia} etiqueta="Incidencia" conteo={metricasOperativas.incidencia} onClick={() => setFiltros((actual) => ({ ...actual, incidencia: !actual.incidencia }))} />
              <FiltroInteligente activo={filtros.sinCoordenadas} etiqueta="Sin ubicación" conteo={metricasOperativas.sinUbicacion} onClick={() => setFiltros((actual) => ({ ...actual, sinCoordenadas: !actual.sinCoordenadas }))} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltrosAvanzadosAbiertos((abierto) => !abierto)}
              className="rounded-full border border-ui-line bg-ui-muted px-3 py-2 font-body text-sm font-semibold text-ui-fg hover:border-ui-brand/40"
              aria-expanded={filtrosAvanzadosAbiertos}
              aria-controls="filtros-avanzados-Traslados"
            >
              {filtrosAvanzadosAbiertos ? "Ocultar filtros" : "Más filtros"}
            </button>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(window.location.href)}
              className="rounded-full border border-ui-brand/30 px-3 py-1.5 font-body text-sm font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft"
            >
              Copiar enlace
            </button>
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltrosVista}
                className="rounded-full border border-ui-line-strong px-3 py-1.5 font-body text-sm font-semibold text-ui-fg-muted hover:border-ui-danger/40 hover:text-ui-danger"
              >
                Limpiar todos
              </button>
            )}
          </div>
        </div>

        {filtrosAvanzadosAbiertos && (
          <div id="filtros-avanzados-Traslados" className="mt-3 grid gap-3 border-t border-ui-line pt-3 md:grid-cols-2 xl:grid-cols-4">
            <CampoFiltro etiqueta="SLA">
              <select value={filtros.sla} onChange={(e) => setFiltros((actual) => ({ ...actual, sla: e.target.value as FiltroSla }))} className={CLASE_CONTROL_FILTRO}>
                <option value="todos">Todos</option>
                <option value="en_riesgo">En riesgo</option>
                <option value="vencido">Vencido</option>
              </select>
            </CampoFiltro>
            <CampoFiltro etiqueta="Fecha">
              <select value={filtros.fecha} onChange={(e) => setFiltros((actual) => ({ ...actual, fecha: e.target.value as FiltroFecha }))} className={CLASE_CONTROL_FILTRO}>
                <option value="todos">Todas</option>
                <option value="hoy">Hoy</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>
            </CampoFiltro>
            <CampoFiltro etiqueta="Empresa">
              <select value={filtros.empresa} onChange={(e) => setFiltros((actual) => ({ ...actual, empresa: e.target.value }))} className={CLASE_CONTROL_FILTRO}>
                <option value="">Todas</option>
                {opcionesFiltros.empresas.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </CampoFiltro>
            <CampoFiltro etiqueta="Conductor">
              <select value={filtros.conductor} onChange={(e) => setFiltros((actual) => ({ ...actual, conductor: e.target.value }))} className={CLASE_CONTROL_FILTRO}>
                <option value="">Todos</option>
                {opcionesFiltros.conductores.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
              </select>
            </CampoFiltro>
            <CampoFiltro etiqueta="Tipo de vehículo">
              <select value={filtros.vehiculo} onChange={(e) => setFiltros((actual) => ({ ...actual, vehiculo: e.target.value }))} className={CLASE_CONTROL_FILTRO}>
                <option value="">Todos</option>
                {opcionesFiltros.vehiculos.map((tipo) => <option key={tipo} value={tipo}>{ETIQUETA_TIPO_VEHICULO[tipo as keyof typeof ETIQUETA_TIPO_VEHICULO] ?? tipo}</option>)}
              </select>
            </CampoFiltro>
            <CampoFiltro etiqueta="Origen">
              <input value={filtros.origen} onChange={(e) => setFiltros((actual) => ({ ...actual, origen: e.target.value }))} placeholder="Ciudad o dirección" className={CLASE_CONTROL_FILTRO} />
            </CampoFiltro>
            <CampoFiltro etiqueta="Destino">
              <input value={filtros.destino} onChange={(e) => setFiltros((actual) => ({ ...actual, destino: e.target.value }))} placeholder="Ciudad o dirección" className={CLASE_CONTROL_FILTRO} />
            </CampoFiltro>
          </div>
        )}

        {hayFiltrosActivos && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtros activos">
            {filtroKpi && <ChipFiltro etiqueta={`Indicador: ${ETIQUETA_FILTRO_KPI[filtroKpi]}`} onRemove={() => setFiltroKpi(null)} />}
            {accionOperativa && <ChipFiltro etiqueta={`Acción: ${ETIQUETA_ACCION_OPERATIVA[accionOperativa]}`} onRemove={() => setAccionOperativa(null)} />}
            {chips.map((chip) => <ChipFiltro key={chip.id} etiqueta={chip.label} onRemove={chip.onRemove} />)}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-lg border border-ui-line bg-ui-card p-4" aria-label="Vistas guardadas de traslados">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Vistas guardadas</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ui-fg">Filtros, columnas y orden</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={nombreVista}
              onChange={(event) => setNombreVista(event.target.value)}
              placeholder="Nombre de la vista"
              className="min-h-10 rounded-lg border border-ui-line-strong bg-ui-card px-3 font-body text-sm"
            />
            <select value={alcanceVista} onChange={(event) => setAlcanceVista(event.target.value as AlcanceVistaGuardada)} className="min-h-10 rounded-lg border border-ui-line-strong bg-ui-card px-3 font-body text-sm">
              <option value="privada">Privada</option>
              <option value="compartida">Compartida</option>
            </select>
            <button type="button" onClick={() => guardarVistaActual(false)} className="rounded-lg border border-ui-brand/40 px-3 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-brand-soft">
              Guardar vista
            </button>
            <button type="button" onClick={() => guardarVistaActual(true)} className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm font-semibold text-ui-fg-muted hover:border-ui-brand/40">
              Guardar como predeterminada
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {vistasDisponibles.map((vista) => (
            <span key={vista.id} className="inline-flex items-center gap-2 rounded-full border border-ui-line bg-ui-muted px-3 py-1.5">
              <button type="button" onClick={() => aplicarVista(vista)} className="font-body text-sm font-semibold text-ui-fg-muted hover:text-ui-fg">
                {vista.nombre}
              </button>
              <span className="font-body text-xs text-ui-fg-muted">{vista.alcance}{vista.esPredeterminada ? " · predeterminada" : ""}</span>
              {!VISTAS_PREDEFINIDAS.some((predefinida) => predefinida.id === vista.id) && (
                <button type="button" onClick={() => establecerPredeterminada(vista.id)} className="font-body text-xs font-semibold text-ui-brand-soft-fg hover:underline">
                  Pred.
                </button>
              )}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ui-line bg-ui-card px-4 py-3" aria-label="Modo de visualización">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Vista operativa</p>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">Alterna entre tabla densa, tablero de atención y acceso al mapa operativo real.</p>
        </div>
        <div className="inline-flex rounded-full border border-ui-line bg-ui-muted p-1">
          {([
            ["lista", "Lista"],
            ["kanban", "Kanban"],
            ["mapa", "Mapa"]
          ] as Array<[ModoVistaOperativa, string]>).map(([modo, etiqueta]) => (
            <button
              key={modo}
              type="button"
              onClick={() => setModoVista(modo)}
              className={`rounded-full px-4 py-2 font-body text-sm font-semibold transition ${modoVista === modo ? "bg-ui-card text-ui-fg shadow-ui-sm" : "text-ui-fg-muted hover:text-ui-fg"}`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
