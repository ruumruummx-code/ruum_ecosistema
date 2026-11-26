"use client";

import { useEffect, useState } from "react";
import { Aviso, Button } from "@ruum/ui";
import { AdminButton } from "../../admin-components";
import type {
  DocumentoRow,
  EstadoDocumentoConductor
} from "./ConductorDetalleTipos";
import {
  ETIQUETA_DOCUMENTO,
  ESTADO_DOCUMENTO,
  esDocumentoVisible
} from "./ConductorDetalleTipos";

export function FilaDocumento({
  documento,
  seleccionado,
  onSeleccionar,
  onRevisado
}: {
  documento: DocumentoRow;
  seleccionado: boolean;
  onSeleccionar: (documento: DocumentoRow) => Promise<void>;
  onRevisado: (id: string, estado: EstadoDocumentoConductor, notas?: string) => Promise<void>;
}) {
  const [procesando, setProcesando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [rechazando, setRechazando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const estado = ESTADO_DOCUMENTO[documento.estado] ?? ESTADO_DOCUMENTO.en_revision;

  async function seleccionar() {
    setProcesando(true);
    setError(null);
    try {
      await onSeleccionar(documento);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos abrir el documento.");
    } finally {
      setProcesando(false);
    }
  }

  async function decidir(nuevoEstado: EstadoDocumentoConductor, notas?: string) {
    setProcesando(true);
    setError(null);
    try {
      await onRevisado(documento.id, nuevoEstado, notas);
      setRechazando(false);
      setMotivo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos registrar la decisión.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <article className={`rounded-lg border p-4 transition ${seleccionado ? "border-2 border-ui-brand bg-ui-brand-soft shadow-ui-md" : "border-ui-line bg-ui-card"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={seleccionar} className="min-w-0 text-left" disabled={procesando}>
          <p className="font-body text-sm font-semibold text-ui-fg">{ETIQUETA_DOCUMENTO[documento.tipo] ?? documento.tipo}</p>
          <p className="mt-0.5 truncate font-body text-xs text-ui-fg-muted">Versión {documento.version} · {documento.nombre_archivo}</p>
        </button>
        <span className={`rounded-full border px-2.5 py-1 font-body text-xs font-semibold ${estado.clase}`}>{estado.texto}</span>
      </div>
      {(documento.motivo_rechazo || documento.notas_admin) && (
        <p className="mt-3 rounded-lg bg-ui-warning-soft px-3 py-2 font-body text-xs text-ui-warning">{documento.motivo_rechazo ?? documento.notas_admin}</p>
      )}
      {error && <div className="mt-3"><Aviso tono="danger">{error}</Aviso></div>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="quiet" onClick={seleccionar} disabled={procesando}>{procesando ? "Cargando..." : "Abrir en visor"}</Button>
        {documento.estado === "en_revision" && !rechazando && (
          <>
            <Button onClick={() => decidir("aprobado")} disabled={procesando}>Aprobar</Button>
            <Button variant="danger" onClick={() => setRechazando(true)} disabled={procesando}>Solicitar corrección</Button>
          </>
        )}
      </div>
      {rechazando && (
        <div className="mt-3 rounded-lg border border-ui-warning/30 bg-ui-warning-soft p-3">
          <label className="font-body text-xs font-semibold text-ui-fg" htmlFor={`motivo-${documento.id}`}>Motivo para el conductor</label>
          <textarea
            id={`motivo-${documento.id}`}
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            maxLength={500}
            className="mt-2 min-h-20 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none"
            placeholder="Indica exactamente qué debe corregir."
          />
          <div className="mt-2 flex gap-2">
            <Button variant="danger" onClick={() => decidir("rechazado", motivo)} disabled={procesando || motivo.trim().length < 5}>Confirmar</Button>
            <Button variant="quiet" onClick={() => { setRechazando(false); setMotivo(""); }} disabled={procesando}>Cancelar</Button>
          </div>
        </div>
      )}
    </article>
  );
}

export function VisorDocumento({
  documento,
  url,
  onCerrar,
  onRevisado
}: {
  documento: DocumentoRow | null;
  url: string | null;
  onCerrar: () => void;
  onRevisado: (id: string, estado: EstadoDocumentoConductor, notas?: string) => Promise<void>;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotacion, setRotacion] = useState(0);
  const [procesando, setProcesando] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setZoom(1);
    setRotacion(0);
    setRechazando(false);
    setMotivo("");
    setError(null);
  }, [documento?.id]);

  async function decidir(estado: EstadoDocumentoConductor, notas?: string) {
    if (!documento) return;
    setProcesando(true);
    setError(null);
    try {
      await onRevisado(documento.id, estado, notas);
      setRechazando(false);
      setMotivo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos registrar la decisión.");
    } finally {
      setProcesando(false);
    }
  }

  if (!documento) {
    return (
      <div className="flex min-h-[420px] flex-1 items-center justify-center rounded-lg border border-dashed border-ui-line bg-ui-muted px-6 text-center xl:min-h-0">
        <p className="font-body text-sm text-ui-fg-muted">Selecciona un documento para validarlo.</p>
      </div>
    );
  }

  const esImagen = /\.(png|jpe?g|webp|gif)$/i.test(documento.nombre_archivo) || /\.(png|jpe?g|webp|gif)$/i.test(documento.url);
  const transformacion = `scale(${zoom}) rotate(${rotacion}deg)`;

  return (
    <div className="flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-lg border border-ui-line bg-ui-card xl:min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ui-line px-4 py-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-ui-fg">{ETIQUETA_DOCUMENTO[documento.tipo] ?? documento.tipo}</p>
          <p className="truncate font-body text-xs text-ui-fg-muted">{documento.nombre_archivo}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setZoom((valor) => Math.min(2.5, Number((valor + 0.15).toFixed(2))))} className="rounded-lg border border-ui-line px-3 py-1.5 font-body text-xs font-semibold text-ui-fg-muted hover:bg-ui-muted">Zoom +</button>
          <button type="button" onClick={() => setZoom((valor) => Math.max(0.5, Number((valor - 0.15).toFixed(2))))} className="rounded-lg border border-ui-line px-3 py-1.5 font-body text-xs font-semibold text-ui-fg-muted hover:bg-ui-muted">Zoom -</button>
          <button type="button" onClick={() => setRotacion((valor) => (valor + 90) % 360)} className="rounded-lg border border-ui-line px-3 py-1.5 font-body text-xs font-semibold text-ui-fg-muted hover:bg-ui-muted">Rotar</button>
          {url && <a href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-ui-line px-3 py-1.5 font-body text-xs font-semibold text-ui-brand-soft-fg hover:bg-ui-muted">Abrir</a>}
          <button type="button" onClick={onCerrar} className="rounded-lg border border-ui-line px-3 py-1.5 font-body text-xs font-semibold text-ui-fg-muted hover:bg-ui-muted">Cerrar</button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-ui-muted p-4">
        {url ? (
          esDocumentoVisible(documento) ? (
            esImagen ? (
              <div
                aria-label={`Vista previa de ${ETIQUETA_DOCUMENTO[documento.tipo] ?? documento.tipo}`}
                role="img"
                className="h-full min-h-[420px] w-full origin-center bg-contain bg-center bg-no-repeat transition-transform xl:min-h-0"
                style={{ backgroundImage: `url("${url}")`, transform: transformacion }}
              />
            ) : (
              <iframe
                title={`Visor de ${ETIQUETA_DOCUMENTO[documento.tipo] ?? documento.tipo}`}
                src={url}
                className="h-full min-h-[420px] w-full origin-center bg-ui-muted transition-transform xl:min-h-0"
                style={{ transform: transformacion }}
              />
            )
          ) : (
            <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
              <p className="font-body text-sm text-ui-fg-muted">Este formato no se puede previsualizar aquí. Usa “Abrir” para revisarlo.</p>
            </div>
          )
        ) : (
          <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
            <p className="font-body text-sm text-ui-fg-muted">Generando URL segura de lectura...</p>
          </div>
        )}
      </div>
      <div className="border-t border-ui-line bg-ui-card px-4 py-3">
        {error && <div className="mb-3"><Aviso tono="danger">{error}</Aviso></div>}
        {documento.estado === "en_revision" ? (
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton onClick={() => void decidir("aprobado")} loading={procesando}>Aprobar documento</AdminButton>
            <AdminButton variant="danger" onClick={() => setRechazando(true)} disabled={procesando}>Solicitar corrección</AdminButton>
          </div>
        ) : (
          <p className="font-body text-sm text-ui-fg-muted">Este documento ya tiene decisión administrativa.</p>
        )}
        {rechazando && (
          <div className="mt-3 rounded-lg border border-ui-warning/30 bg-ui-warning-soft p-3">
            <label className="font-body text-xs font-semibold text-ui-fg" htmlFor={`motivo-visor-${documento.id}`}>Motivo para el conductor</label>
            <textarea
              id={`motivo-visor-${documento.id}`}
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              maxLength={500}
              className="mt-2 min-h-20 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none"
              placeholder="Indica exactamente qué debe corregir."
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <AdminButton variant="danger" onClick={() => void decidir("rechazado", motivo)} disabled={procesando || motivo.trim().length < 5}>Confirmar corrección</AdminButton>
              <AdminButton variant="quiet" onClick={() => { setRechazando(false); setMotivo(""); }} disabled={procesando}>Cancelar</AdminButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
