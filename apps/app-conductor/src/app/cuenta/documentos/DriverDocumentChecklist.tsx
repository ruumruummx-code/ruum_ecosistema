"use client";

import { ChangeEvent, useRef, useState } from "react";
import type { Database } from "@ruum/shared/types";
import {
  estadoVigenciaLicencia,
  vencimientoDocumentoDesdeLicencia,
} from "@ruum/shared/validacion";
import type { TipoDocumentoConductor } from "@ruum/api/services";
import { fechaCuenta, type ConductorCuenta } from "../cuenta-utils";
import { enmascararNombreArchivo } from "../datos-sensibles";
import { MobileRow } from "@ruum/ui";

type Documento = Database["public"]["Tables"]["documentos_conductor"]["Row"];

type EstadoChecklist = "falta" | "cargado" | "en_revision" | "aprobado" | "rechazado" | "por_vencer" | "vencido";

type DocumentoRequerido = {
  tipo: TipoDocumentoConductor;
  etiqueta: string;
  descripcion: string;
  bloqueante: boolean;
};

const DOCUMENTOS_REQUERIDOS: DocumentoRequerido[] = [
  { tipo: "licencia_frente", etiqueta: "Licencia - Frente", descripcion: "Fotografía clara del frente de tu licencia vigente.", bloqueante: true },
  { tipo: "licencia_reverso", etiqueta: "Licencia - Reverso", descripcion: "Fotografía clara del reverso de tu licencia vigente.", bloqueante: true },
  { tipo: "identificacion_oficial", etiqueta: "Identificación Oficial (INE / Pasaporte)", descripcion: "Identificación oficial vigente por ambos lados o pasaporte.", bloqueante: true },
  { tipo: "constancia_situacion_fiscal", etiqueta: "Constancia de Situación Fiscal (SAT)", descripcion: "Constancia actualizada del SAT en archivo PDF o imagen legible.", bloqueante: true },
  { tipo: "documento_operativo", etiqueta: "Comprobante de domicilio", descripcion: "Recibo reciente (luz, agua, predial) que acredite tu domicilio registrado.", bloqueante: true },
];

const ESTILO_ESTADO: Record<EstadoChecklist, { texto: string; tonoIcono: "rojo" | "azul" | "ambar" | "verde" | "neutro"; icono: string }> = {
  falta: { texto: "Falta documento", tonoIcono: "rojo", icono: "⚠️" },
  cargado: { texto: "Cargado", tonoIcono: "azul", icono: "⏳" },
  en_revision: { texto: "En revisión", tonoIcono: "ambar", icono: "🔍" },
  aprobado: { texto: "Aprobado", tonoIcono: "verde", icono: "✓" },
  rechazado: { texto: "Rechazado", tonoIcono: "rojo", icono: "❌" },
  por_vencer: { texto: "Por vencer", tonoIcono: "ambar", icono: "⏰" },
  vencido: { texto: "Vencido", tonoIcono: "rojo", icono: "🚨" },
};

function documentoActual(documentos: Documento[], tipo: TipoDocumentoConductor) {
  return documentos
    .filter((documento) => documento.tipo === tipo && documento.es_actual)
    .sort((a, b) => b.version - a.version || new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())[0] ?? null;
}

function vencimientoDocumento(conductor: ConductorCuenta | null, tipo: TipoDocumentoConductor) {
  return vencimientoDocumentoDesdeLicencia(tipo, conductor?.licencia_vigencia);
}

function estadoDocumento(documento: Documento | null, vencimiento: string | null): EstadoChecklist {
  const estadoVigencia = estadoVigenciaLicencia(vencimiento);
  if (estadoVigencia === "vencida") return "vencido";
  if (documento?.estado === "rechazado") return "rechazado";
  if (documento?.estado === "aprobado" && estadoVigencia === "por_vencer") return "por_vencer";
  if (documento?.estado === "aprobado") return "aprobado";
  if (documento?.estado === "en_revision") return "en_revision";
  if (documento) return "cargado";
  return "falta";
}

export function DriverDocumentChecklist({
  conductor,
  documentos,
  subiendo,
  onUpload,
}: {
  conductor: ConductorCuenta | null;
  documentos: Documento[];
  subiendo: TipoDocumentoConductor | null;
  onUpload: (tipo: TipoDocumentoConductor, file: File, documentoAnteriorId?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subidaPendiente, setSubidaPendiente] = useState<{ tipo: TipoDocumentoConductor; documentoAnteriorId?: string } | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<TipoDocumentoConductor | null>(null);

  const items = DOCUMENTOS_REQUERIDOS.map((requerido) => {
    const documento = documentoActual(documentos, requerido.tipo);
    const vencimiento = vencimientoDocumento(conductor, requerido.tipo);
    const estado = estadoDocumento(documento, vencimiento);
    return { requerido, documento, vencimiento, estado };
  });

  const pendientes = items.filter((i) => i.estado !== "aprobado");
  const aprobados = items.filter((i) => i.estado === "aprobado");

  function abrirSelectorArchivo(tipo: TipoDocumentoConductor, documentoAnteriorId?: string) {
    setSubidaPendiente({ tipo, documentoAnteriorId });
    inputRef.current?.click();
  }

  function manejarSeleccionArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (archivo && subidaPendiente) {
      onUpload(subidaPendiente.tipo, archivo, subidaPendiente.documentoAnteriorId);
      setSubidaPendiente(null);
    }
    e.target.value = "";
  }

  function abrirMenu(tipo: TipoDocumentoConductor) {
    setMenuAbierto(menuAbierto === tipo ? null : tipo);
  }

  function cerrarMenu() {
    setMenuAbierto(null);
  }

  return (
    <>
      {/* Input nativo oculto — dispara selector de archivos del OS (cámara/galería/archivos) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        hidden
        onChange={manejarSeleccionArchivo}
      />

      {/* 1. Sección: Documentos pendientes o requeridos de atención (ListTiles compactos) */}
      <section className="grid gap-2" aria-label="Documentos pendientes de atención">
        <div className="flex items-center justify-between px-4">
          <h2 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-500">
              {pendientes.length}
            </span>
            Atención requerida y pendientes
          </h2>
          {pendientes.some((i) => i.requerido.bloqueante && ["falta", "rechazado", "vencido"].includes(i.estado)) && (
            <span className="rounded-full bg-red-500/15 border border-red-500/30 px-3 py-1 font-body text-xs font-bold text-red-500">
              🚨 Bloquea traslados
            </span>
          )}
        </div>

        <div className="grid gap-2 px-4">
          {pendientes.map(({ requerido, documento, vencimiento, estado }) => {
            const visual = ESTILO_ESTADO[estado];
            const esBloqueanteAccion = requerido.bloqueante && ["falta", "rechazado", "vencido"].includes(estado);
            const estaSubiendo = subiendo === requerido.tipo;
            const nombreArchivo = documento?.nombre_archivo ? enmascararNombreArchivo(documento.nombre_archivo) : "Sin registrar";

            return (
              <MobileRow
                key={requerido.tipo}
                titulo={requerido.etiqueta}
                subtitulo={estado !== "falta" ? `${visual.texto} · ${nombreArchivo}` : nombreArchivo}
                icono={visual.icono}
                tonoIcono={visual.tonoIcono}
                derecha={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirSelectorArchivo(requerido.tipo, documento?.id);
                    }}
                    disabled={estaSubiendo}
                    className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 py-1 font-display text-xs font-bold transition ${estaSubiendo
                      ? "border-sky-500/40 bg-sky-500/10 text-sky-600"
                      : esBloqueanteAccion
                        ? "border-red-500/40 bg-red-500/5 text-red-500 hover:bg-red-500/10"
                        : "border-border bg-surface text-text-primary hover:bg-surface-elevated"}`}
                  >
                    {estaSubiendo ? "⏳" : "Subir"}
                  </button>
                }
                onClick={() => {
                  if (estado === "falta" || esBloqueanteAccion) abrirSelectorArchivo(requerido.tipo, documento?.id);
                }}
              />
            );
          })}
        </div>
      </section>

      {/* 2. Sección: Documentos Aprobados (ListTiles de alta densidad con menú ⋮) */}
      {aprobados.length > 0 && (
        <section className="grid gap-2 pt-3 border-t border-border/40 px-4" aria-label="Documentos aprobados">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-500">
                ✓
              </span>
              Documentos Aprobados ({aprobados.length})
            </h2>
          </div>

          <div className="grid gap-2">
            {aprobados.map(({ requerido, documento, vencimiento }) => {
              const estaSubiendo = subiendo === requerido.tipo;
              const menuEstaAbierto = menuAbierto === requerido.tipo;
              const fechaVenc = vencimiento ? fechaCuenta(vencimiento) : "Sin vencimiento";

              return (
                <div key={requerido.tipo} className="relative">
                  <MobileRow
                    titulo={requerido.etiqueta}
                    subtitulo={`Vence: ${fechaVenc}`}
                    icono="✓"
                    tonoIcono="verde"
                    derecha={
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirMenu(requerido.tipo);
                          }}
                          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 text-text-tertiary hover:bg-surface-elevated focus-visible:outline-none"
                          aria-label="Más opciones"
                        >
                          ⋮
                        </button>

                        {menuEstaAbierto && (
                          <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-border bg-surface-elevated shadow-lg z-20 py-1.5 animate-in fade-in slide-in-from-top-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                cerrarMenu();
                                abrirSelectorArchivo(requerido.tipo, documento?.id);
                              }}
                              disabled={estaSubiendo}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-display text-text-primary hover:bg-surface/50 transition focus-visible:outline-none"
                            >
                              {estaSubiendo ? "⏳ Registrando…" : "Actualizar / Reemplazar"}
                            </button>
                          </div>
                        )}
                      </>
                    }
                  />

                  {/* Cerrar menú al hacer clic fuera */}
                  {menuEstaAbierto && (
                    <button
                      type="button"
                      className="fixed inset-0 z-10"
                      onClick={cerrarMenu}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
