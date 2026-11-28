"use client";

import type { ReactNode, RefObject } from "react";
import Link from "next/link";
import { EstadoBadge } from "@ruum/ui";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { TrazabilidadMasivaTraslado } from "@ruum/api/services";
import type { PasaporteRow, EstadoTraslado } from "./ViajesTipos";
import {
  formatoFechaAbsoluta,
  textoRelativo,
  estadoSla,
  responsableOperativo,
  sinCoordenadas,
  obtenerInicioProgramado,
  obtenerUltimaActualizacion,
  folioCorto
} from "./ViajesTipos";

export function FechaOperativa({ fechaIso, compacta = false }: { fechaIso: string | null | undefined; compacta?: boolean }) {
  if (!fechaIso) return <span className="font-body text-xs text-ui-fg-muted">Sin programar</span>;
  return (
    <div className="grid gap-0.5">
      <span className="font-mono-ruum text-xs font-semibold text-ui-fg">{formatoFechaAbsoluta(fechaIso)}</span>
      {!compacta && <span className="font-body text-xs text-ui-fg-muted">{textoRelativo(fechaIso)}</span>}
    </div>
  );
}

export function VehiculoOperativo({ traslado }: { traslado: PasaporteRow }) {
  const modelo = [traslado.vehiculo_marca, traslado.vehiculo_modelo].filter(Boolean).join(" ");
  return (
    <div className="grid gap-0.5">
      <span className="font-body text-sm font-semibold text-ui-fg">{modelo || "Sin unidad"}</span>
      <span className="font-body text-xs text-ui-fg-muted">
        {traslado.vehiculo_tipo ? ETIQUETA_TIPO_VEHICULO[traslado.vehiculo_tipo] : "Tipo no definido"}
        {traslado.vehiculo_placas ? ` · ${traslado.vehiculo_placas}` : ""}
      </span>
    </div>
  );
}

export function KpiOperativo({
  etiqueta,
  valor,
  detalle,
  tono,
  onClick
}: {
  etiqueta: string;
  valor: number;
  detalle: string;
  tono: "riesgo" | "atencion" | "info" | "critico";
  onClick: () => void;
}) {
  const clasesTono = {
    riesgo: "border-ui-danger/30 bg-ui-card hover:border-ui-danger/60",
    atencion: "border-ui-warning/35 bg-ui-card hover:border-ui-warning/60",
    info: "border-ui-brand/35 bg-ui-card hover:border-ui-brand/60",
    critico: "border-ui-danger/35 bg-ui-card hover:border-ui-danger/60"
  }[tono];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-colors shadow-ui-sm ${clasesTono}`}
    >
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{etiqueta}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ui-fg">{valor.toLocaleString("es-MX")}</p>
      <p className="mt-1 font-body text-xs text-ui-fg-muted">{detalle}</p>
    </button>
  );
}

export function FiltroInteligente({ activo, etiqueta, conteo, onClick }: { activo: boolean; etiqueta: string; conteo: number; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 font-body text-xs font-semibold transition ${
        activo ? "bg-ui-card text-ui-fg shadow-ui-sm" : "text-ui-fg-muted hover:text-ui-fg"
      }`}
    >
      <span>{etiqueta}</span>
      <span className="rounded-full border border-current/20 px-1.5 py-0.5 font-mono-ruum text-xs">{conteo}</span>
    </button>
  );
}

export function SlaOperativo({ traslado }: { traslado: PasaporteRow }) {
  const sla = estadoSla(traslado);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-xs font-semibold ${sla.clases}`}>
      <span aria-hidden="true">{sla.icono}</span>
      <span>{sla.etiqueta}</span>
    </span>
  );
}

export function EstadoOperativo({ estado }: { estado: EstadoTraslado | null }) {
  if (!estado) return <span className="font-body text-xs text-ui-fg-muted">Sin estado</span>;
  return (
    <div className="flex items-center gap-2">
      <EstadoBadge estado={estado} />
    </div>
  );
}

export function IncidenciaOperativa({ traslado }: { traslado: PasaporteRow }) {
  const tieneIncidencias = Boolean(traslado.tiene_incidencia_abierta) || Number(traslado.incidencias_abiertas ?? 0) > 0;
  if (!tieneIncidencias) {
    return <span className="font-body text-xs text-ui-fg-muted">Sin incidencia</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ui-danger/30 bg-ui-danger-soft px-2.5 py-1 font-body text-xs font-semibold text-ui-danger">
      <span className="size-1.5 rounded-full bg-ui-danger" aria-hidden="true" />
      {traslado.incidencias_abiertas ?? 1} abierta{Number(traslado.incidencias_abiertas ?? 1) === 1 ? "" : "s"}
    </span>
  );
}

export function DetalleRapidoTraslado({
  traslado,
  trazabilidad,
  botonCerrarRef,
  onCerrar,
  onAsignar
}: {
  traslado: PasaporteRow;
  trazabilidad: TrazabilidadMasivaTraslado | null;
  botonCerrarRef: RefObject<HTMLButtonElement | null>;
  onCerrar: () => void;
  onAsignar: () => void;
}) {
  const sla = estadoSla(traslado);
  const folio = folioCorto(traslado);
  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-ui-line bg-ui-card shadow-ui-md" role="dialog" aria-modal="true" aria-labelledby="detalle-rapido-titulo">
      <div className="flex items-start justify-between gap-4 border-b border-ui-line p-5">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Detalle rápido</p>
          <h2 id="detalle-rapido-titulo" className="mt-1 font-display text-xl font-semibold text-ui-fg">{folio}</h2>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">Revisión sin abandonar el listado</p>
        </div>
        <button ref={botonCerrarRef} type="button" onClick={onCerrar} className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm font-semibold text-ui-fg-muted">
          Cerrar
        </button>
      </div>
      <div className="grid flex-1 gap-4 overflow-auto p-5">
        <DetalleSeccion titulo="Resumen">
          <DatoRapido etiqueta="Folio" valor={folio} />
          <DatoRapido etiqueta="Inicio" valor={formatoFechaAbsoluta(obtenerInicioProgramado(traslado))} />
          <DatoRapido etiqueta="Última actualización" valor={formatoFechaAbsoluta(obtenerUltimaActualizacion(traslado))} />
        </DetalleSeccion>
        <DetalleSeccion titulo="Estado y SLA">
          <EstadoOperativo estado={traslado.estado} />
          <span className={`mt-2 inline-flex w-fit rounded-full border px-3 py-1 font-body text-sm font-semibold ${sla.clases}`}>{sla.icono} {sla.etiqueta} · {sla.detalle}</span>
        </DetalleSeccion>
        <DetalleSeccion titulo="Conductor">
          <DatoRapido etiqueta="Asignado" valor={traslado.conductor_nombre ?? "Sin conductor"} />
          <DatoRapido etiqueta="Responsable" valor={responsableOperativo(traslado)} />
        </DetalleSeccion>
        <DetalleSeccion titulo="Vehículo">
          <DatoRapido etiqueta="Unidad" valor={[traslado.vehiculo_marca, traslado.vehiculo_modelo].filter(Boolean).join(" ") || "Sin dato"} />
          <DatoRapido etiqueta="Tipo" valor={traslado.vehiculo_tipo ? ETIQUETA_TIPO_VEHICULO[traslado.vehiculo_tipo] : "Sin tipo"} />
          <DatoRapido etiqueta="Placas" valor={traslado.vehiculo_placas ?? "Sin placas"} />
        </DetalleSeccion>
        <DetalleSeccion titulo="Ruta">
          <DatoRapido etiqueta="Origen" valor={traslado.origen_direccion ?? traslado.origen_ciudad ?? "Sin origen"} />
          <DatoRapido etiqueta="Destino" valor={traslado.destino_direccion ?? traslado.destino_ciudad ?? "Sin destino"} />
          <DatoRapido etiqueta="Última ubicación" valor={sinCoordenadas(traslado) ? "Sin coordenadas completas" : `${traslado.origen_lat}, ${traslado.origen_lng}`} />
        </DetalleSeccion>
        <DetalleSeccion titulo="Incidencias y evidencia">
          <DatoRapido etiqueta="Incidencias" valor={Number(traslado.incidencias_abiertas ?? 0) > 0 || traslado.tiene_incidencia_abierta ? `${traslado.incidencias_abiertas ?? 1} abiertas` : "Sin incidencia abierta"} />
          <DatoRapido etiqueta="Evidencia" valor={sinCoordenadas(traslado) ? "Ubicación pendiente" : "Ubicación disponible"} />
        </DetalleSeccion>
        <DetalleSeccion titulo="Historial reciente">
          <DatoRapido etiqueta="Creación" valor={formatoFechaAbsoluta(traslado.creado_en)} />
          <DatoRapido etiqueta="Lote" valor={trazabilidad?.carga.nombre_archivo ?? "Individual"} />
          <DatoRapido etiqueta="Referencia" valor={trazabilidad?.fila.referencia_externa ?? "Sin referencia externa"} />
        </DetalleSeccion>
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-t border-ui-line p-5">
        <button type="button" onClick={onAsignar} className="rounded-lg border border-ui-brand/40 bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg">
          Asignar conductor
        </button>
        <Link href={traslado.traslado_id ? `/viajes/${traslado.traslado_id}` : "/viajes"} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold text-ui-fg-muted">
          Expediente completo
        </Link>
      </div>
    </aside>
  );
}

export function DetalleSeccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-ui-line bg-ui-muted p-4">
      <h3 className="font-body text-sm font-semibold uppercase tracking-wide text-ui-fg-muted">{titulo}</h3>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
  );
}

export function DatoRapido({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{etiqueta}</dt>
      <dd className="font-body text-sm text-ui-fg">{valor}</dd>
    </div>
  );
}

export function CampoFiltro({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 font-body text-sm text-ui-fg-muted">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{etiqueta}</span>
      {children}
    </label>
  );
}

export function ChipFiltro({ etiqueta, onRemove }: { etiqueta: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-ui-line bg-ui-muted px-3 py-1.5 font-body text-sm text-ui-fg-muted">
      {etiqueta}
      <button type="button" onClick={onRemove} className="font-bold text-ui-fg-muted hover:text-ui-danger" aria-label={`Quitar filtro ${etiqueta}`}>
        ×
      </button>
    </span>
  );
}
