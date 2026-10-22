"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, Aviso, LogoMarca } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import {
  iniciarVerificacionDidit,
  registrarEventoRegistroConductor,
  subirDocumentoConductor,
  subirDocumentoSolicitudConductor,
  type EventoRegistroConductor,
  type TipoDocumentoConductor
} from "@ruum/api/services";
import { enmascararNombreArchivo } from "../cuenta/datos-sensibles";
import { DiditVerificationModal } from "../registro/DiditVerificationModal";

type DocumentoConductorRow = Database["public"]["Tables"]["documentos_conductor"]["Row"];

// CSS / Estructura: height: 100dvh; overflow: hidden;

const ESTADO_DOCUMENTO: Record<string, { texto: string; clase: string }> = {
  pendiente: { texto: "Pendiente de carga", clase: "border-border bg-surface-elevated text-text-tertiary/80" },
  en_revision: { texto: "En revisión", clase: "border-warning/30 bg-warning/10 text-warning" },
  aprobado: { texto: "Aprobado", clase: "border-success bg-control-soft text-success" },
  rechazado: { texto: "Rechazado", clase: "border-danger-action bg-danger-soft text-danger-action" },
  reemplazado: { texto: "Reemplazado", clase: "border-border bg-surface-elevated text-text-tertiary/80" },
  vencido: { texto: "Vencido", clase: "border-danger-action bg-danger-soft text-danger-action" },
};

const TIPOS_DOCUMENTO: { valor: TipoDocumentoConductor; etiqueta: string }[] = [
  { valor: "licencia_frente", etiqueta: "Licencia - frente" },
  { valor: "licencia_reverso", etiqueta: "Licencia - reverso" },
  { valor: "identificacion_oficial", etiqueta: "Identificación oficial" }
];

const DOCUMENTO_FISCAL: { valor: TipoDocumentoConductor; etiqueta: string } = {
  valor: "documento_operativo",
  etiqueta: "Documento fiscal"
};

const ETIQUETA_EXPEDIENTE: Record<Database["public"]["Enums"]["estado_expediente_conductor"], string> = {
  borrador: "Borrador", correo_pendiente: "Correo pendiente", datos_incompletos: "Datos incompletos",
  documentos_pendientes: "Documentos pendientes", listo_para_enviar: "Listo para enviar", en_revision: "En revisión",
  requiere_correccion: "Requiere corrección", aprobado: "Aprobado", rechazado: "Rechazado", suspendido: "Suspendido"
};

interface Props {
  conductorId?: string;
  solicitudId?: string;
  nombre: string;
  documentosIniciales: DocumentoConductorRow[];
  estadoExpediente: Database["public"]["Enums"]["estado_expediente_conductor"];
  enviadoEn?: string | null;
  onSalir: () => void;
}

interface DocumentoSeleccionado {
  tipo: TipoDocumentoConductor | "cuenta";
  etiqueta: string;
  doc?: DocumentoConductorRow;
}

export function EstadoRevisionConductor({ conductorId, solicitudId, nombre, documentosIniciales, estadoExpediente, enviadoEn, onSalir }: Props) {
  const [documentos, setDocumentos] = useState(documentosIniciales);
  const [estadoActual, setEstadoActual] = useState(estadoExpediente);
  const [subiendo, setSubiendo] = useState<TipoDocumentoConductor | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoSeleccionado | null>(null);
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  // Telemetría Didit
  const sesionTelemetriaRef = useRef("");
  const inicioTelemetriaRef = useRef(0);

  const registrarTelemetriaDidit = useCallback((evento: EventoRegistroConductor) => {
    if (!tieneSupabaseConfigurado() || !sesionTelemetriaRef.current) return;
    const duracionMs = inicioTelemetriaRef.current ? Math.max(0, Date.now() - inicioTelemetriaRef.current) : undefined;
    void registrarEventoRegistroConductor(crearClienteNavegador(), {
      sesionId: sesionTelemetriaRef.current,
      evento,
      duracionMs
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (sesionTelemetriaRef.current) return;
    sesionTelemetriaRef.current = crypto.randomUUID();
    inicioTelemetriaRef.current = Date.now();
  }, []);

  // Modal verificación Didit
  const [mostrarVerificacionDidit, setMostrarVerificacionDidit] = useState(false);
  const [urlVerificacionDidit, setUrlVerificacionDidit] = useState<string | null>(null);
  const [errorVerificacionDidit, setErrorVerificacionDidit] = useState<string | null>(null);

  function cerrarVerificacionDidit() {
    setMostrarVerificacionDidit(false);
    setUrlVerificacionDidit(null);
    setErrorVerificacionDidit(null);
    registrarTelemetriaDidit("didit_completado");
  }

  function finalizarVerificacionDidit() {
    setMostrarVerificacionDidit(false);
    setUrlVerificacionDidit(null);
    setErrorVerificacionDidit(null);
    registrarTelemetriaDidit("didit_completado");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ruum:recargar-panel"));
      window.location.reload();
    }
  }

  function reintentarVerificacionDidit() {
    setErrorVerificacionDidit(null);
    setVerificando(true);
    registrarTelemetriaDidit("didit_iniciado");
    (async () => {
      try {
        const cliente = crearClienteNavegador();
        const { url } = await iniciarVerificacionDidit(cliente, solicitudId!);
        setUrlVerificacionDidit(url);
        setMostrarVerificacionDidit(true);
      } catch (err) {
        setErrorVerificacionDidit(traducirErrorOperativo(err, "No pudimos reintentar la verificación."));
      } finally {
        setVerificando(false);
      }
    })();
  }

  function documentoDe(tipo: TipoDocumentoConductor) {
    return documentos
      .filter((d) => d.tipo === tipo && d.es_actual)
      .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())[0];
  }

  async function reemplazar(tipo: TipoDocumentoConductor, archivo: File) {
    setSubiendo(tipo);
    setError(null);
    setMensaje(null);
    try {
      const cliente = crearClienteNavegador();
      const documentoAnteriorId = documentoDe(tipo)?.id;
      if (solicitudId) await subirDocumentoSolicitudConductor(cliente, solicitudId, tipo, archivo, documentoAnteriorId);
      else if (conductorId) await subirDocumentoConductor(cliente, conductorId, tipo, archivo, documentoAnteriorId);
      else throw new Error("No encontramos el expediente asociado.");
      if (estadoActual === "requiere_correccion") setEstadoActual("documentos_pendientes");
      setDocumentos((prev) => [
        {
          id: `temp-${Date.now()}`,
          conductor_id: conductorId ?? null,
          solicitud_id: solicitudId ?? null,
          tipo,
          nombre_archivo: archivo.name,
          url: "",
          estado: "en_revision",
          notas_admin: null,
          version: (documentoDe(tipo)?.version ?? 0) + 1,
          documento_anterior_id: documentoAnteriorId ?? null,
          es_actual: true,
          expira_en: null,
          reemplazado_en: null,
          revisado_por: null,
          revisado_en: null,
          motivo_rechazo: null,
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        },
        ...prev.map((documento) => documento.id === documentoAnteriorId ? {
          ...documento, estado: "reemplazado", es_actual: false, reemplazado_en: new Date().toISOString(), actualizado_en: new Date().toISOString()
        } : documento)
      ]);
      setMensaje("Documento actualizado. Volvió a revisión y te avisaremos cuando cambie el estado.");
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos registrar el documento corregido. Intenta nuevamente."));
    } finally {
      setSubiendo(null);
    }
  }

  async function iniciarVerificacion() {
    if (!solicitudId) return;
    setVerificando(true);
    setError(null);
    setMensaje(null);
    registrarTelemetriaDidit("didit_iniciado");
    try {
      const cliente = crearClienteNavegador();
      const { url } = await iniciarVerificacionDidit(cliente, solicitudId);
      setUrlVerificacionDidit(url);
      setMostrarVerificacionDidit(true);
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos iniciar la verificación. Intenta de nuevo."));
      registrarTelemetriaDidit("didit_error");
    } finally {
      setVerificando(false);
    }
  }

  const todosAprobados = TIPOS_DOCUMENTO.every((t) => documentoDe(t.valor)?.estado === "aprobado");
  const documentoFiscal = documentoDe(DOCUMENTO_FISCAL.valor);
  const documentosRequeridos = documentoFiscal ? [...TIPOS_DOCUMENTO, DOCUMENTO_FISCAL] : TIPOS_DOCUMENTO;
  const actuales = TIPOS_DOCUMENTO.map((tipo) => documentoDe(tipo.valor)).filter(Boolean);
  const documentosActuales = [...actuales, documentoFiscal].filter(Boolean);
  const rechazados = documentosActuales.filter((documento) => documento?.estado === "rechazado" || documento?.estado === "vencido").length;
  const pendientes = TIPOS_DOCUMENTO.filter((tipo) => !documentoDe(tipo.valor)).length;
  const cuentaAprobada = !["borrador", "correo_pendiente"].includes(estadoActual);
  const documentosAprobados = documentosRequeridos.filter((tipo) => documentoDe(tipo.valor)?.estado === "aprobado").length;
  const totalRequisitos = documentosRequeridos.length + 1;
  const requisitosListos = documentosAprobados + (cuentaAprobada ? 1 : 0);
  const porcentaje = Math.round((requisitosListos / totalRequisitos) * 100);

  const seleccionadoDoc = documentoSeleccionado?.tipo && documentoSeleccionado.tipo !== "cuenta"
    ? documentoDe(documentoSeleccionado.tipo as TipoDocumentoConductor)
    : undefined;

  return (
    <div
      className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-[var(--ruum-navy)] text-white"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* App Bar minimalista */}
      <header className="flex shrink-0 items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <LogoMarca tamano={28} color="signal" />
          <span className="font-display text-lg font-extrabold tracking-tight text-white">
            Ruum
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/cuenta/soporte"
            aria-label="Soporte"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
              <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
            </svg>
          </Link>
          <Link
            href="/cuenta"
            aria-label="Perfil"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
        {/* Status Header */}
        <section className="shrink-0 rounded-2xl bg-white/95 p-4 text-slate-900 shadow-lg" aria-labelledby="titulo-estado-revision">
          <p className="font-body text-sm font-semibold text-slate-900">¡Hola, {nombre}! 👋</p>
          <p className="mt-1 font-display text-lg font-bold text-slate-900">🟡 Tu solicitud está en revisión</p>
          <p className="mt-1 font-body text-xs text-slate-500">Tiempo est: 24-48 hrs hábiles</p>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden>
              <div className="h-full rounded-full bg-signal transition-all duration-300" style={{ width: `${porcentaje}%` }} />
            </div>
            <p className="mt-1 font-body text-xs font-medium text-slate-600">{requisitosListos}/{totalRequisitos} listos</p>
          </div>
        </section>

        {/* Acción crítica */}
        {estadoActual === "en_revision" && solicitudId && (
          <Button className="w-full shrink-0" onClick={iniciarVerificacion} disabled={verificando}>
            {verificando ? "Abriendo verificación…" : "📸 Verificar identidad ahora"}
          </Button>
        )}

        {error && (
          <output className="shrink-0" aria-live="polite" aria-atomic="true">
            <Aviso tono="danger">{error}</Aviso>
          </output>
        )}
        {mensaje && (
          <output className="shrink-0" aria-live="polite" aria-atomic="true">
            <Aviso tono="info">{mensaje}</Aviso>
          </output>
        )}

        {/* Lista densa de requisitos */}
        <section className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-white/95 p-3 text-slate-900 shadow-lg" aria-label="Estado documental">
          <ul className="flex flex-col gap-2 overflow-hidden">
            <li>
              <button
                type="button"
                onClick={() => setDocumentoSeleccionado({ tipo: "cuenta", etiqueta: "Cuenta" })}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 font-body text-sm font-semibold text-slate-900">
                  <span aria-hidden>👤</span>
                  Cuenta
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 font-body text-xs font-medium ${cuentaAprobada ? "border-success bg-control-soft text-success" : "border-border bg-surface-elevated text-text-tertiary/80"}`}>
                  {cuentaAprobada ? "Correo confirmado" : "Pendiente"}
                </span>
              </button>
            </li>
            {documentosRequeridos.map((t) => {
              const doc = documentoDe(t.valor);
              const estadoInfo = ESTADO_DOCUMENTO[doc?.estado ?? "pendiente"];
              return (
                <li key={t.valor}>
                  <button
                    type="button"
                    onClick={() => setDocumentoSeleccionado({ tipo: t.valor, etiqueta: t.etiqueta, doc })}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2 font-body text-sm font-semibold text-slate-900">
                      <span aria-hidden>📄</span>
                      {t.etiqueta}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 font-body text-xs font-medium ${estadoInfo.clase}`}>
                      {estadoInfo.texto}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Switch minimalista de notificaciones WhatsApp */}
        <label className="flex shrink-0 items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/90">
          <span>Activar notificaciones por WhatsApp</span>
          <input
            type="checkbox"
            checked={notificacionesActivas}
            onChange={(e) => setNotificacionesActivas(e.target.checked)}
            className="size-4 accent-route"
          />
        </label>
      </main>

      {/* BottomSheet / Bottom Sheet de revisión de documento (slide-up) */}
      {documentoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="titulo-sheet-documento">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setDocumentoSeleccionado(null)} aria-label="Cerrar panel" />
          <div className="relative w-full max-w-md rounded-t-2xl border-t border-border/40 bg-surface-elevated p-5 shadow-2xl animate-slideUp" data-animation="slide-up">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="titulo-sheet-documento" className="font-display text-base font-bold text-text-primary">
                {documentoSeleccionado.etiqueta}
              </h2>
              <button type="button" onClick={() => setDocumentoSeleccionado(null)} className="min-h-9 min-w-9 rounded-full border border-border bg-surface text-text-secondary" aria-label="Cerrar">
                ✕
              </button>
            </div>

            {documentoSeleccionado.tipo !== "cuenta" && seleccionadoDoc?.url && (
              <div className="mb-3 overflow-hidden rounded-xl border border-border bg-surface">
                <Image
                  src={seleccionadoDoc.url}
                  alt={`Vista previa de ${documentoSeleccionado.etiqueta}`}
                  width={400}
                  height={200}
                  unoptimized
                  className="max-h-48 w-full object-contain"
                />
              </div>
            )}
            {documentoSeleccionado.tipo !== "cuenta" && !seleccionadoDoc?.url && (
              <p className="mb-3 font-body text-xs text-text-tertiary">Sin vista previa disponible.</p>
            )}

            {documentoSeleccionado.tipo !== "cuenta" && (seleccionadoDoc?.motivo_rechazo || seleccionadoDoc?.notas_admin) && (
              <p className="mb-3 rounded-lg bg-warn-soft px-3 py-2 font-body text-sm text-warning">
                Motivo: {seleccionadoDoc?.motivo_rechazo ?? seleccionadoDoc?.notas_admin}
              </p>
            )}

            {documentoSeleccionado.tipo !== "cuenta" && (
              <>
                <input
                  ref={(el) => { inputsRef.current[documentoSeleccionado.tipo as TipoDocumentoConductor] = el; }}
                  type="file"
                  accept="image/*,.pdf"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const archivo = e.target.files?.[0];
                    if (archivo) void reemplazar(documentoSeleccionado.tipo as TipoDocumentoConductor, archivo);
                    e.target.value = "";
                  }}
                />
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => inputsRef.current[documentoSeleccionado.tipo as TipoDocumentoConductor]?.click()}
                  disabled={subiendo === documentoSeleccionado.tipo}
                >
                  {subiendo === documentoSeleccionado.tipo ? "Subiendo…" : "Reemplazar documento"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Didit */}
      {mostrarVerificacionDidit && (
        <DiditVerificationModal
          isOpen={mostrarVerificacionDidit}
          url={urlVerificacionDidit}
          cargando={verificando}
          error={errorVerificacionDidit}
          onCerrar={cerrarVerificacionDidit}
          onReintentar={reintentarVerificacionDidit}
          onFinalizar={finalizarVerificacionDidit}
        />
      )}
    </div>
  );
}