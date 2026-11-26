"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Aviso, PassportCard } from "@ruum/ui";
import {
  aprobarSolicitudConductorAdmin,
  crearNotaInternaSolicitudConductorAdmin,
  obtenerDetalleSolicitudConductorAdmin,
  rechazarSolicitudConductorAdmin,
  revisarDocumentoConductorAdmin,
  type DetalleSolicitudConductorAdmin,
  type EstadoDocumentoConductor
} from "@ruum/api/services";
import { obtenerUrlDocumentoConductor } from "@ruum/api/drivers";
import { AdminButton } from "../../admin-components";
import { AdminPageHeader } from "../../admin-ui";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import {
  type DocumentoRow,
  DOCUMENTOS_REQUERIDOS,
  CONSENTIMIENTOS_REQUERIDOS,
  textoJson,
  diasParaVencer
} from "./ConductorDetalleTipos";
import {
  BadgeEstadoSolicitud,
  Dato,
  IndicadorChecklist,
  VigenciaLicencia,
  QuickActionsBar,
  SeccionAcordeon,
  ConsentimientosAcordeon,
  HistorialAcordeon,
  ChatInternoDrawer
} from "./ConductorDetalleComponentes";
import {
  DesempenoScore,
  DomicilioContactoEditable
} from "./ConductorDetalleOperacion";
import {
  FilaDocumento,
  VisorDocumento
} from "./ConductorDetalleDocumentos";

export default function PaginaDetalleSolicitudConductorAdmin() {
  const { id } = useParams<{ id: string }>();
  const [detalle, setDetalle] = useState<DetalleSolicitudConductorAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [accion, setAccion] = useState<"aprobar" | "rechazar" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  const [documentoSeleccionadoId, setDocumentoSeleccionadoId] = useState<string | null>(null);
  const [urlsDocumento, setUrlsDocumento] = useState<Record<string, string>>({});
  const [visorCerrado, setVisorCerrado] = useState(false);
  const [chatInternoAbierto, setChatInternoAbierto] = useState(false);
  const [correoAuth, setCorreoAuth] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!tieneSupabaseConfigurado()) {
      setCargando(false);
      return;
    }
    try {
      setDetalle(await obtenerDetalleSolicitudConductorAdmin(crearClienteNavegador(), id));
    } catch (err) {
      setAviso({
        tono: "danger",
        texto: err instanceof Error ? err.message : "No pudimos cargar el Pasaporte digital CONCER."
      });
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    setCorreoAuth(null);
    const timer = setTimeout(() => {
      void cargar();
    }, 0);
    return () => clearTimeout(timer);
  }, [cargar]);

  useEffect(() => {
    if (!detalle) return;
    const correoEnSolicitud = textoJson(detalle.solicitud.datos_personales, "email", "correo", "correo_electronico");
    if (correoEnSolicitud || correoAuth) return;
    const solicitudId = detalle.solicitud.id;
    const controller = new AbortController();
    async function cargarCorreoAuth() {
      try {
        const respuesta = await fetch(`/api/admin-auth/correo-conductor?solicitud=${encodeURIComponent(solicitudId)}`, {
          cache: "no-store",
          signal: controller.signal
        });
        if (!respuesta.ok) return;
        const payload = (await respuesta.json()) as { correo?: string | null };
        setCorreoAuth(payload.correo ?? null);
      } catch {
        if (!controller.signal.aborted) setCorreoAuth(null);
      }
    }
    void cargarCorreoAuth();
    return () => controller.abort();
  }, [detalle, correoAuth]);

  const consentimientosActuales = useMemo(() => {
    const porTipo = new Map<string, DetalleSolicitudConductorAdmin["consentimientos"][number]>();
    for (const consentimiento of detalle?.consentimientos ?? []) {
      if (!porTipo.has(consentimiento.tipo_documento)) porTipo.set(consentimiento.tipo_documento, consentimiento);
    }
    return [...porTipo.values()];
  }, [detalle]);

  const documentoSeleccionado = useMemo(() => {
    if (visorCerrado) return null;
    if (!detalle?.documentos.length) return null;
    return detalle.documentos.find((documento) => documento.id === documentoSeleccionadoId) ?? detalle.documentos[0] ?? null;
  }, [detalle?.documentos, documentoSeleccionadoId, visorCerrado]);

  const seleccionarDocumento = useCallback(
    async (documento: DocumentoRow) => {
      setVisorCerrado(false);
      setDocumentoSeleccionadoId(documento.id);
      if (urlsDocumento[documento.id]) return;
      const urlFirmada = await obtenerUrlDocumentoConductor(crearClienteNavegador(), documento.url, 60 * 30);
      setUrlsDocumento((actuales) => ({ ...actuales, [documento.id]: urlFirmada }));
    },
    [urlsDocumento]
  );

  useEffect(() => {
    if (!documentoSeleccionado) return;
    if (urlsDocumento[documentoSeleccionado.id]) return;
    void seleccionarDocumento(documentoSeleccionado);
  }, [documentoSeleccionado, seleccionarDocumento, urlsDocumento]);

  async function revisarDocumento(documentoId: string, estado: EstadoDocumentoConductor, notas?: string) {
    await revisarDocumentoConductorAdmin(crearClienteNavegador(), documentoId, estado, notas);
    await cargar();
  }

  async function enviarNotaInterna(mensaje: string) {
    if (!detalle) return;
    const nota = await crearNotaInternaSolicitudConductorAdmin(crearClienteNavegador(), detalle.solicitud.id, mensaje);
    setDetalle((actual) => (actual ? { ...actual, notasInternas: [...actual.notasInternas, nota] } : actual));
  }

  async function aprobarTodosDocumentos(documentos: DocumentoRow[]) {
    setProcesando(true);
    setAviso(null);
    try {
      for (const documento of documentos) {
        await revisarDocumentoConductorAdmin(crearClienteNavegador(), documento.id, "aprobado");
      }
      setAviso({ tono: "info", texto: "Documentos requeridos aprobados por lote." });
      await cargar();
    } catch (err) {
      setAviso({
        tono: "danger",
        texto: err instanceof Error ? err.message : "No pudimos aprobar los documentos por lote."
      });
    } finally {
      setProcesando(false);
    }
  }

  async function decidir() {
    if (!detalle || !accion) return;
    setProcesando(true);
    setAviso(null);
    try {
      if (accion === "aprobar") {
        await aprobarSolicitudConductorAdmin(crearClienteNavegador(), detalle.solicitud.id, motivo);
        setAviso({ tono: "info", texto: "Solicitud aprobada y conductor activado." });
      } else {
        await rechazarSolicitudConductorAdmin(crearClienteNavegador(), detalle.solicitud.id, motivo);
        setAviso({ tono: "info", texto: "Solicitud rechazada con decisión registrada." });
      }
      setAccion(null);
      setMotivo("");
      await cargar();
    } catch (err) {
      setAviso({
        tono: "danger",
        texto: err instanceof Error ? err.message : "No pudimos registrar la decisión."
      });
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <main className="admin-page-shell">
        <p className="font-body text-sm text-ui-fg-muted">Cargando...</p>
      </main>
    );
  }

  if (!detalle) {
    return (
      <main className="admin-page-shell">
        <AdminPageHeader
          titulo="No encontramos esa solicitud"
          descripcion="La solicitud no está disponible o tu sesión no tiene permisos para revisarla."
          breadcrumb={[{ label: "Conductores", href: "/conductores" }, { label: "Revisión" }]}
        />
        {aviso && (
          <div className="mt-4">
            <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
          </div>
        )}
        <Link href="/conductores" className="mt-4 inline-block font-body text-sm text-ui-brand-soft-fg hover:underline">
          Volver a la bandeja
        </Link>
      </main>
    );
  }

  const { solicitud, conductor, documentos, historial } = detalle;
  const nombre = textoJson(solicitud.datos_personales, "nombre") ?? conductor?.nombre ?? "Conductor sin nombre";
  const correoContacto = textoJson(solicitud.datos_personales, "email", "correo", "correo_electronico");
  const correo = correoContacto ?? correoAuth ?? "-";
  const telefonoContacto = solicitud.telefono_normalizado ?? conductor?.telefono ?? null;
  const vigenciaLicencia = textoJson(solicitud.licencia, "vigencia") ?? conductor?.licencia_vigencia ?? null;
  const diasVigencia = diasParaVencer(vigenciaLicencia);
  const documentosRequeridos = documentos.filter((documento) =>
    DOCUMENTOS_REQUERIDOS.includes(documento.tipo as (typeof DOCUMENTOS_REQUERIDOS)[number])
  );
  const documentosAprobadosCount = DOCUMENTOS_REQUERIDOS.filter((tipo) =>
    documentos.some((documento) => documento.tipo === tipo && documento.estado === "aprobado")
  ).length;
  const documentosAprobados = documentosAprobadosCount === DOCUMENTOS_REQUERIDOS.length;
  const tiposConsentidos = new Set(consentimientosActuales.map((consentimiento) => consentimiento.tipo_documento));
  const consentimientosRegistradosCount = CONSENTIMIENTOS_REQUERIDOS.filter((tipo) => tiposConsentidos.has(tipo)).length;
  const consentimientosCompletos = consentimientosRegistradosCount === CONSENTIMIENTOS_REQUERIDOS.length;
  const puedeAprobar = solicitud.estado === "en_revision" && documentosAprobados && consentimientosCompletos;
  const documentosLote = documentosRequeridos.filter((documento) => documento.estado === "en_revision");
  const anomalíasVisibles = documentosRequeridos.some(
    (documento) => documento.estado === "rechazado" || documento.estado === "vencido" || Boolean(documento.motivo_rechazo)
  );
  const puedeAprobarLote =
    solicitud.estado === "en_revision" &&
    documentosRequeridos.length === DOCUMENTOS_REQUERIDOS.length &&
    documentosLote.length > 0 &&
    !anomalíasVisibles;
  const ciudadSede = textoJson(solicitud.domicilio, "ciudad_municipio", "ciudad") ?? conductor?.ciudad_municipio ?? "-";
  const tipoLicencia = textoJson(solicitud.licencia, "tipo", "tipo_licencia") ?? conductor?.licencia_tipo ?? "-";
  const datosHeader = `Folio ${solicitud.id.slice(0, 8)} · ${solicitud.curp_normalizada ?? conductor?.curp ?? "CURP no registrada"} · ${telefonoContacto ?? "Sin teléfono"} · ${correo}`;

  return (
    <main className="admin-page-shell pb-24">
      <AdminPageHeader
        etiqueta="Pasaporte digital CONCER"
        titulo={nombre}
        descripcion={datosHeader}
        tipoDatos="administrativos"
        accion={
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href="/conductores"
              className="inline-flex min-h-10 items-center rounded-lg border border-ui-brand bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand shadow-sm hover:bg-ui-brand/90"
            >
              Regresar
            </Link>
            <AdminButton
              variant="secondary"
              className={
                puedeAprobarLote
                  ? "border-ui-success bg-ui-success text-ui-on-brand hover:bg-ui-success/90"
                  : "border-ui-line bg-ui-card text-ui-fg-muted"
              }
              loading={procesando && !accion}
              disabled={!puedeAprobarLote || procesando}
              onClick={() => void aprobarTodosDocumentos(documentosLote)}
              title={
                !puedeAprobarLote
                  ? "Disponible cuando los documentos requeridos están en revisión y no hay anomalías visibles."
                  : undefined
              }
            >
              Aprobar todos los documentos
            </AdminButton>
          </div>
        }
      />

      {aviso && (
        <div className="mt-4">
          <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
      )}
      {chatInternoAbierto && (
        <ChatInternoDrawer
          nombre={nombre}
          notas={detalle.notasInternas}
          onEnviar={enviarNotaInterna}
          onClose={() => setChatInternoAbierto(false)}
        />
      )}

      <div className="mt-5 grid gap-6 xl:h-[calc(100vh-10rem)] xl:grid-cols-[minmax(340px,0.35fr)_minmax(560px,0.65fr)] xl:overflow-hidden">
        <aside className="space-y-5 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
          <section className="rounded-lg border border-ui-line bg-ui-card p-4 shadow-ui-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-ui-fg-muted">Ficha rápida</p>
                <QuickActionsBar
                  nombre={nombre}
                  telefono={telefonoContacto}
                  correo={correo}
                  onChat={() => setChatInternoAbierto(true)}
                />
              </div>
              <BadgeEstadoSolicitud estado={solicitud.estado} />
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Dato etiqueta="Licencia" valor={solicitud.licencia_normalizada ?? conductor?.licencia_numero ?? "-"} destacado />
              <Dato etiqueta="Vigencia" valor={<VigenciaLicencia fechaIso={vigenciaLicencia} dias={diasVigencia} />} destacado />
              <Dato etiqueta="Tipo" valor={tipoLicencia} destacado />
              <Dato etiqueta="Ciudad sede" valor={ciudadSede} />
            </dl>
          </section>

          <DesempenoScore
            conductor={conductor}
            documentosAprobados={documentosAprobados}
            diasVigencia={diasVigencia}
            onActualizado={cargar}
            onAviso={setAviso}
          />

          <DomicilioContactoEditable solicitud={solicitud} conductor={conductor} correo={correo} onGuardado={cargar} />

          <PassportCard>
            <h2 className="font-display text-lg font-semibold">Checklist de requisitos</h2>
            <div className="mt-4 space-y-3">
              <IndicadorChecklist etiqueta="Documentos aprobados" valor={`${documentosAprobadosCount}/3`} completo={documentosAprobados} />
              <IndicadorChecklist
                etiqueta="Consentimientos registrados"
                valor={`${consentimientosRegistradosCount}/4`}
                completo={consentimientosCompletos}
              />
            </div>
            <div className="mt-5">
              <ConsentimientosAcordeon consentimientos={consentimientosActuales} />
            </div>
          </PassportCard>

          <SeccionAcordeon
            titulo="Documentos vigentes"
            distintivo={<span className="font-body text-xs text-ui-fg-muted">{documentos.length} documento(s)</span>}
          >
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {documentos.length === 0 ? (
                <p className="font-body text-sm text-ui-fg-muted">No hay documentos vigentes.</p>
              ) : (
                documentos.map((documento) => (
                  <FilaDocumento
                    key={documento.id}
                    documento={documento}
                    seleccionado={documentoSeleccionado?.id === documento.id}
                    onSeleccionar={seleccionarDocumento}
                    onRevisado={revisarDocumento}
                  />
                ))
              )}
            </div>
          </SeccionAcordeon>

          <section className="sticky bottom-4 z-20 rounded-lg border border-ui-line bg-ui-card p-4 shadow-ui-md">
            <h2 className="font-display text-lg font-semibold">Decisión administrativa</h2>
            {solicitud.estado === "en_revision" ? (
              <>
                <div className="mt-4 grid gap-2">
                  <AdminButton onClick={() => setAccion("aprobar")} disabled={!puedeAprobar || procesando}>
                    Aprobar solicitud
                  </AdminButton>
                  <AdminButton variant="danger" onClick={() => setAccion("rechazar")} disabled={procesando}>
                    Rechazar solicitud
                  </AdminButton>
                </div>
                {!puedeAprobar && (
                  <div className="mt-3 space-y-2">
                    <IndicadorChecklist etiqueta="Documentos aprobados" valor={`${documentosAprobadosCount}/3`} completo={documentosAprobados} />
                    <IndicadorChecklist
                      etiqueta="Consentimientos registrados"
                      valor={`${consentimientosRegistradosCount}/4`}
                      completo={consentimientosCompletos}
                    />
                    <p className="font-body text-xs text-ui-fg-muted">
                      Aprobar solicitud se habilita cuando los documentos requeridos y consentimientos estén completos.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 font-body text-sm text-ui-fg-muted">La solicitud no admite una decisión final en su estado actual.</p>
            )}
            {accion && (
              <div className="mt-4 rounded-lg border border-ui-line bg-ui-muted p-4">
                <label className="font-body text-sm font-medium" htmlFor="motivo-decision">
                  Motivo de la decisión {accion === "rechazar" && <span className="text-ui-danger">*</span>}
                </label>
                <textarea
                  id="motivo-decision"
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  maxLength={800}
                  placeholder={accion === "aprobar" ? "Opcional: observaciones de la aprobación." : "Explica el motivo del rechazo."}
                  className="mt-2 min-h-24 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <AdminButton
                    variant={accion === "rechazar" ? "danger" : "primary"}
                    onClick={decidir}
                    loading={procesando}
                    disabled={accion === "rechazar" && motivo.trim().length < 5}
                  >
                    Confirmar decisión
                  </AdminButton>
                  <AdminButton
                    variant="quiet"
                    onClick={() => {
                      setAccion(null);
                      setMotivo("");
                    }}
                    disabled={procesando}
                  >
                    Cancelar
                  </AdminButton>
                </div>
              </div>
            )}
          </section>

          <HistorialAcordeon historial={historial} />

          <div className="flex justify-end">
            <span className="inline-flex min-h-10 items-center rounded-lg border border-ui-line bg-ui-brand/[0.04] px-4 py-2 font-body text-sm font-semibold text-ui-fg-muted">
              Detalle operativo centralizado en este expediente
            </span>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col xl:min-h-0">
          <VisorDocumento
            documento={documentoSeleccionado}
            url={documentoSeleccionado ? urlsDocumento[documentoSeleccionado.id] ?? null : null}
            onCerrar={() => {
              setVisorCerrado(true);
              setDocumentoSeleccionadoId(null);
            }}
            onRevisado={revisarDocumento}
          />
        </section>
      </div>
    </main>
  );
}
