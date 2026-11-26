"use client";

import Link from "next/link";
import { Aviso } from "@ruum/ui";
import type {
  PasaporteRow,
  AccionMasivaConfig,
  EstadoAccionMasiva,
  ResultadoAccionMasiva,
  PrioridadOperativa
} from "./ViajesTipos";
import {
  idTrasladoOperativo,
  folioCorto,
  responsableOperativo,
  sinCoordenadas
} from "./ViajesTipos";
import {
  SlaOperativo,
  CampoFiltro
} from "./ViajesComponentes";

export function VistaKanbanTraslados({
  columnas,
  onAbrirDetalle
}: {
  columnas: Array<{ id: string; titulo: string; descripcion: string; filas: PasaporteRow[] }>;
  onAbrirDetalle: (traslado: PasaporteRow) => void;
}) {
  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-4" aria-label="Vista Kanban de traslados">
      {columnas.map((columna) => (
        <div key={columna.id} className="min-h-96 rounded-lg border border-ui-line bg-ui-card">
          <header className="border-b border-ui-line px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-ui-fg">{columna.titulo}</h2>
              <span className="rounded-full border border-ui-line bg-ui-muted px-2 py-0.5 font-mono-ruum text-xs text-ui-fg-muted">
                {columna.filas.length}
              </span>
            </div>
            <p className="mt-1 font-body text-xs text-ui-fg-muted">{columna.descripcion}</p>
          </header>
          <div className="grid max-h-[68vh] gap-3 overflow-auto p-3">
            {columna.filas.slice(0, 30).map((traslado) => (
              <button
                key={idTrasladoOperativo(traslado)}
                type="button"
                onClick={() => onAbrirDetalle(traslado)}
                className="rounded-lg border border-ui-line bg-ui-muted p-3 text-left transition hover:border-ui-brand/35 hover:bg-ui-brand-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono-ruum text-xs font-semibold text-ui-brand-soft-fg">{folioCorto(traslado)}</span>
                  <SlaOperativo traslado={traslado} />
                </div>
                <p className="mt-2 font-body text-sm font-semibold text-ui-fg">
                  {traslado.origen_ciudad ?? "Origen"} → {traslado.destino_ciudad ?? "Destino"}
                </p>
                <p className="mt-1 font-body text-xs text-ui-fg-muted">
                  {traslado.conductor_nombre ?? "Sin conductor"} · {responsableOperativo(traslado)}
                </p>
              </button>
            ))}
            {columna.filas.length === 0 && (
              <p className="px-2 py-6 text-center font-body text-sm text-ui-fg-muted">Sin traslados en esta columna.</p>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export function VistaMapaTraslados({
  traslados,
  onAbrirDetalle
}: {
  traslados: PasaporteRow[];
  onAbrirDetalle: (traslado: PasaporteRow) => void;
}) {
  const conCoordenadas = traslados.filter((traslado) => !sinCoordenadas(traslado));
  const sinUbicacion = traslados.length - conCoordenadas.length;
  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]" aria-label="Vista mapa de traslados">
      <div className="grid min-h-[460px] place-items-center rounded-lg border border-ui-line bg-ui-card p-6 text-ui-fg">
        <div className="max-w-xl text-center">
          <p className="font-mono-ruum text-xs uppercase tracking-wide text-ui-brand">Mapa operativo real</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Usar módulo Mapa para GPS y tráfico</h2>
          <p className="mt-2 font-body text-sm text-ui-fg">
            Esta bandeja no inventa posiciones. {conCoordenadas.length.toLocaleString("es-MX")} traslados tienen coordenadas
            completas y {sinUbicacion.toLocaleString("es-MX")} requieren completar ubicación.
          </p>
          <Link
            href="/mapa"
            className="mt-5 inline-flex rounded-lg border border-ui-brand bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-brand-hover"
          >
            Abrir mapa operativo
          </Link>
        </div>
      </div>
      <aside className="rounded-lg border border-ui-line bg-ui-card p-4">
        <h2 className="font-display text-base font-semibold text-ui-fg">Traslados georreferenciables</h2>
        <div className="mt-3 grid max-h-[430px] gap-2 overflow-auto">
          {conCoordenadas.slice(0, 25).map((traslado) => (
            <button
              key={idTrasladoOperativo(traslado)}
              type="button"
              onClick={() => onAbrirDetalle(traslado)}
              className="rounded-lg border border-ui-line bg-ui-muted p-3 text-left hover:border-ui-brand/35"
            >
              <p className="font-mono-ruum text-xs font-semibold text-ui-brand-soft-fg">{folioCorto(traslado)}</p>
              <p className="mt-1 font-body text-sm text-ui-fg">
                {traslado.origen_ciudad} → {traslado.destino_ciudad}
              </p>
              <p className="mt-1 font-body text-xs text-ui-fg-muted">{traslado.conductor_nombre ?? "Sin conductor"}</p>
            </button>
          ))}
          {conCoordenadas.length === 0 && (
            <p className="font-body text-sm text-ui-fg-muted">
              No hay traslados con coordenadas completas en esta selección.
            </p>
          )}
        </div>
      </aside>
    </section>
  );
}

export function AccionMasivaDialog({
  accion,
  total,
  estado,
  resultados,
  confirmacion,
  onConfirmacionChange,
  responsable,
  onResponsableChange,
  prioridad,
  onPrioridadChange,
  etiqueta,
  onEtiquetaChange,
  procesando,
  onCerrar,
  onEjecutar
}: {
  accion: AccionMasivaConfig;
  total: number;
  estado: EstadoAccionMasiva;
  resultados: ResultadoAccionMasiva[];
  confirmacion: boolean;
  onConfirmacionChange: (value: boolean) => void;
  responsable: string;
  onResponsableChange: (value: string) => void;
  prioridad: PrioridadOperativa;
  onPrioridadChange: (value: PrioridadOperativa) => void;
  etiqueta: string;
  onEtiquetaChange: (value: string) => void;
  procesando?: boolean;
  onCerrar: () => void;
  onEjecutar: () => void;
}) {
  const requiereConfirmacion = Boolean(accion.requiereConfirmacion || accion.destructiva);
  const puedeEjecutar = total > 0 && (!requiereConfirmacion || confirmacion);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ui-brand p-4" role="dialog" aria-modal="true" aria-labelledby="accion-masiva-titulo">
      <section className="w-full max-w-2xl rounded-lg border border-ui-line bg-ui-card shadow-ui-md">
        <div className="border-b border-ui-line p-4">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Acción masiva</p>
          <h2 id="accion-masiva-titulo" className="mt-1 font-display text-xl font-semibold text-ui-fg">{accion.etiqueta}</h2>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">{accion.descripcion}</p>
        </div>
        <div className="grid gap-4 p-4">
          <Aviso tono={accion.destructiva ? "atencion" : "info"}>
            Esta operación afectará {total.toLocaleString("es-MX")} registro{total === 1 ? "" : "s"}. Los resultados parciales se reportarán por folio y quedarán en auditoría.
          </Aviso>
          {accion.id === "asignar_responsable" && (
            <CampoFiltro etiqueta="Responsable">
              <select value={responsable} onChange={(event) => onResponsableChange(event.target.value)} className="w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm">
                <option>Asignación</option>
                <option>Supervisor</option>
                <option>Incidencias</option>
                <option>Monitoreo</option>
                <option>Compliance</option>
              </select>
            </CampoFiltro>
          )}
          {accion.id === "cambiar_prioridad" && (
            <CampoFiltro etiqueta="Prioridad">
              <select value={prioridad} onChange={(event) => onPrioridadChange(event.target.value as PrioridadOperativa)} className="w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </CampoFiltro>
          )}
          {accion.id === "etiquetar" && (
            <CampoFiltro etiqueta="Etiqueta">
              <input value={etiqueta} onChange={(event) => onEtiquetaChange(event.target.value)} className="w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm" />
            </CampoFiltro>
          )}
          {requiereConfirmacion && (
            <label className="flex items-start gap-3 rounded-lg border border-ui-warning/25 bg-ui-warning-soft p-3 font-body text-sm text-ui-warning">
              <input type="checkbox" checked={confirmacion} onChange={(event) => onConfirmacionChange(event.target.checked)} className="mt-1" />
              Confirmo que revisé la selección y entiendo que la operación puede cambiar la prioridad operativa o escalar atención.
            </label>
          )}
          {resultados.length > 0 && (
            <div className="max-h-72 overflow-auto rounded-lg border border-ui-line">
              <div className="border-b border-ui-line bg-ui-muted px-3 py-2 font-body text-sm font-semibold text-ui-fg">
                Resultado {estado}: {resultados.filter((item) => item.estado === "aplicado").length} aplicados, {resultados.filter((item) => item.estado === "omitido").length} omitidos, {resultados.filter((item) => item.estado === "bloqueado").length} bloqueados
              </div>
              {resultados.map((resultado) => (
                <div key={`${resultado.trasladoId}-${resultado.detalle}`} className="grid gap-1 border-b border-ui-line px-3 py-2 last:border-b-0">
                  <span className="font-mono-ruum text-xs font-semibold text-ui-fg">{resultado.folio}</span>
                  <span className={resultado.estado === "aplicado" ? "font-body text-sm text-ui-success" : resultado.estado === "bloqueado" ? "font-body text-sm text-ui-danger" : "font-body text-sm text-ui-warning"}>
                    {resultado.estado}: {resultado.detalle}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-ui-line p-4">
          <button type="button" onClick={onCerrar} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold text-ui-fg-muted">Cerrar</button>
          <button type="button" disabled={!puedeEjecutar || procesando} onClick={onEjecutar} className="rounded-lg border border-ui-brand/40 bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg disabled:opacity-50">
            {procesando ? "Procesando..." : "Ejecutar"}
          </button>
        </div>
      </section>
    </div>
  );
}
