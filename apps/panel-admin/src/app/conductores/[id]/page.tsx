"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Aviso, Button, PassportCard } from "@ruum/ui";
import type { Database, Json } from "@ruum/shared/types";
import {
  actualizarConductorAdmin,
  aprobarSolicitudConductorAdmin,
  crearNotaInternaSolicitudConductorAdmin,
  obtenerDetalleSolicitudConductorAdmin,
  rechazarSolicitudConductorAdmin,
  revisarDocumentoConductorAdmin,
  solicitarAprobacionAdmin,
  type DetalleSolicitudConductorAdmin,
  type EstadoDocumentoConductor
} from "@ruum/api/services";
import { obtenerUrlDocumentoConductor } from "@ruum/api/drivers";
import { AdminBadge, AdminButton } from "../../admin-components";
import { AdminPageHeader } from "../../admin-ui";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";

type DocumentoRow = Database["public"]["Tables"]["documentos_conductor"]["Row"];
type ConductorRow = Database["public"]["Tables"]["conductores"]["Row"];
type EstadoSolicitud = Database["public"]["Enums"]["estado_expediente_conductor"];

const DOCUMENTOS_REQUERIDOS = ["licencia_frente", "licencia_reverso", "identificacion_oficial"] as const;
const CONSENTIMIENTOS_REQUERIDOS = ["terminos_servicio", "aviso_privacidad", "autorizacion_antecedentes", "declaracion_suspensiones"] as const;

const MOTIVOS_SUSPENSION = [
  "Documentación vencida o inconsistente",
  "Incidencia operativa grave en revisión",
  "No presentación o cancelación sin justificación",
  "Contacto o datos críticos no verificados",
  "Solicitud de Torre de Control"
];

const MOTIVOS_BAJA = [
  "Reincidencia en faltas operativas graves",
  "Documentación falsa o no verificable",
  "Uso indebido de la plataforma",
  "Riesgo de seguridad confirmado",
  "Solicitud formal del conductor"
];

const ETIQUETA_DOCUMENTO: Record<string, string> = {
  licencia_frente: "Licencia frente",
  licencia_reverso: "Licencia reverso",
  identificacion_oficial: "Identificación oficial",
  documento_operativo: "Documento operativo adicional"
};

const ETIQUETA_CONSENTIMIENTO: Record<string, string> = {
  terminos_servicio: "Términos de servicio",
  aviso_privacidad: "Aviso de privacidad",
  autorizacion_antecedentes: "Autorización de antecedentes",
  declaracion_suspensiones: "Declaración de no suspensión"
};

const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  borrador: "Borrador",
  correo_pendiente: "Correo pendiente",
  datos_incompletos: "Datos incompletos",
  documentos_pendientes: "Documentos pendientes",
  listo_para_enviar: "Lista para enviar",
  en_revision: "En revisión",
  requiere_correccion: "Requiere corrección",
  aprobado: "Aprobada",
  rechazado: "Rechazada",
  suspendido: "Suspendida"
};

const ETIQUETA_DECISION: Record<string, string> = {
  registro_inicial: "Estado inicial",
  cambio_estado: "Cambio de estado",
  aprobar_documento: "Documento aprobado",
  rechazar_documento: "Documento rechazado",
  vencer_documento: "Documento vencido",
  solicitar_correccion: "Corrección solicitada",
  aprobar_solicitud: "Solicitud aprobada",
  rechazar_solicitud: "Solicitud rechazada"
};

const ESTADO_DOCUMENTO: Record<string, { texto: string; clase: string }> = {
  en_revision: { texto: "En revisión", clase: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning" },
  aprobado: { texto: "Aprobado", clase: "border-ui-success/30 bg-ui-success-soft text-ui-success" },
  rechazado: { texto: "Solicitar corrección", clase: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger" },
  vencido: { texto: "Vencido", clase: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger" }
};

const ESTADO_SOLICITUD_CLASE: Record<EstadoSolicitud, string> = {
  borrador: "border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted",
  correo_pendiente: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
  datos_incompletos: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
  documentos_pendientes: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
  listo_para_enviar: "border-ui-brand/30 bg-ui-brand-soft text-ui-brand-soft-fg",
  en_revision: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
  requiere_correccion: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger",
  aprobado: "border-ui-success/30 bg-ui-success-soft text-ui-success",
  rechazado: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger",
  suspendido: "border-ui-line-strong bg-ui-muted text-ui-fg-muted"
};

function textoJson(valor: Json, ...llaves: string[]) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  for (const llave of llaves) {
    const dato = valor[llave];
    if (typeof dato === "string" && dato.trim()) return dato.trim();
    if (typeof dato === "number") return String(dato);
  }
  return null;
}

function fecha(valor: string | null) {
  return valor ? new Date(valor).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "-";
}

function truncarHash(hash: string) {
  return hash.length <= 14 ? hash : `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function diasParaVencer(fechaIso: string | null) {
  if (!fechaIso) return null;
  const fechaValor = new Date(fechaIso);
  if (Number.isNaN(fechaValor.getTime())) return null;
  const hoy = new Date();
  return Math.ceil((fechaValor.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function estadoVigencia(dias: number | null) {
  if (dias === null) {
    return {
      clase: "border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted",
      punto: "bg-ui-fg-muted",
      etiqueta: "Sin fecha"
    };
  }
  if (dias < 0) {
    return {
      clase: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger",
      punto: "bg-ui-danger",
      etiqueta: "Vencida"
    };
  }
  if (dias <= 30) {
    return {
      clase: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
      punto: "bg-ui-warning",
      etiqueta: "Por vencer"
    };
  }
  if (dias > 180) {
    return {
      clase: "border-ui-success/30 bg-ui-success-soft text-ui-success",
      punto: "bg-ui-success",
      etiqueta: "Vigente"
    };
  }
  return {
    clase: "border-ui-brand/30 bg-ui-brand-soft text-ui-brand-soft-fg",
    punto: "bg-ui-brand",
    etiqueta: "Vigente"
  };
}

function limpiarTelefono(valor: string | null) {
  if (!valor) return null;
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 10 ? digitos : null;
}

function telefonoLlamada(valor: string | null | undefined) {
  const digitos = limpiarTelefono(valor ?? null);
  return digitos ? `tel:${digitos}` : null;
}

function textoEstadoConductor(valor: string | null | undefined) {
  return valor ? valor.replace(/_/g, " ") : "sin alta operativa";
}

function urlMapaDomicilio(datos: {
  calle: string;
  numero: string;
  colonia: string;
  codigo_postal: string;
  ciudad_municipio: string;
  estado_residencia: string;
}) {
  const calleNumero = [datos.calle, datos.numero].filter(Boolean).join(" ");
  const direccion = [
    calleNumero,
    datos.colonia,
    datos.codigo_postal,
    datos.ciudad_municipio,
    datos.estado_residencia
  ].filter(Boolean).join(", ");
  return direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}` : null;
}

function telefonoWhatsapp(valor: string | null) {
  const digitos = limpiarTelefono(valor);
  if (!digitos) return null;
  if (digitos.startsWith("52")) return digitos;
  return digitos.length === 10 ? `52${digitos}` : digitos;
}

function formatoPorcentaje(valor: number | null) {
  if (valor === null || Number.isNaN(valor)) return "Sin historial";
  return `${Math.round(valor)}%`;
}

function etiquetaNivel(valor: string | null | undefined) {
  if (!valor) return "Por asignar";
  return valor.replace(/_/g, " ");
}

function evaluarElegibilidad({
  conductor,
  documentosAprobados,
  diasVigencia
}: {
  conductor: ConductorRow | null;
  documentosAprobados: boolean;
  diasVigencia: number | null;
}) {
  if (!conductor) {
    return { elegible: false, tono: "warning" as const, texto: "En revisión", detalle: "Pendiente de aprobación administrativa." };
  }
  if (conductor.suspensiones_activas > 0) {
    return { elegible: false, tono: "danger" as const, texto: "No elegible", detalle: `Bloqueado por ${conductor.suspensiones_activas} penalización(es) activa(s).` };
  }
  if (conductor.estado !== "activo" && conductor.estado !== "modo_prueba_supervisada") {
    return { elegible: false, tono: "danger" as const, texto: "No elegible", detalle: `Estatus operativo: ${conductor.estado.replace(/_/g, " ")}.` };
  }
  if (!documentosAprobados || !conductor.documentos_vigentes) {
    return { elegible: false, tono: "warning" as const, texto: "No elegible", detalle: "Documentos requeridos incompletos o no vigentes." };
  }
  if (diasVigencia !== null && diasVigencia < 0) {
    return { elegible: false, tono: "danger" as const, texto: "No elegible", detalle: "Licencia vencida." };
  }
  if (diasVigencia !== null && diasVigencia <= 30) {
    return { elegible: false, tono: "warning" as const, texto: "No elegible", detalle: `Licencia por vencer en ${diasVigencia} día(s).` };
  }
  if (!conductor.nivel_operativo_vigente) {
    return { elegible: false, tono: "warning" as const, texto: "No elegible", detalle: "Nivel operativo CONCER pendiente." };
  }
  return { elegible: true, tono: "success" as const, texto: "Elegible para asignación", detalle: `Nivel ${etiquetaNivel(conductor.nivel_operativo_vigente)} vigente.` };
}

function esDocumentoVisible(documento: DocumentoRow) {
  return /\.(png|jpe?g|webp|gif|pdf)$/i.test(documento.nombre_archivo) || /\.(png|jpe?g|webp|gif|pdf)$/i.test(documento.url);
}

function BadgeEstadoSolicitud({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span className={`rounded-full border px-3 py-1 font-body text-xs font-semibold ${ESTADO_SOLICITUD_CLASE[estado]}`}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: ReactNode; destacado?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-ui-line bg-ui-card px-3 py-2.5">
      <dt className="font-body text-xs text-ui-fg-muted">{etiqueta}</dt>
      <dd className={`mt-1 break-words font-body text-sm ${destacado ? "font-semibold text-ui-fg" : "font-medium text-ui-fg-muted"}`}>{valor || <span className="text-ui-fg-muted">-</span>}</dd>
    </div>
  );
}

function IndicadorChecklist({ etiqueta, valor, completo }: { etiqueta: string; valor: string; completo: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-ui-line bg-ui-card px-3 py-2">
      <span className="font-body text-sm text-ui-fg-muted">{etiqueta}</span>
      <span className={`inline-flex items-center gap-1.5 font-body text-sm font-semibold ${completo ? "text-ui-success" : "text-ui-danger"}`}>
        <span className={`size-2 rounded-full ${completo ? "bg-ui-success" : "bg-ui-danger"}`} aria-hidden="true" />
        {valor}
      </span>
    </div>
  );
}

function VigenciaLicencia({ fechaIso, dias }: { fechaIso: string | null; dias: number | null }) {
  const estado = estadoVigencia(dias);
  return (
    <span className={`inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border px-2.5 py-1 font-body text-sm font-semibold ${estado.clase}`}>
      <span className={`size-2 rounded-full ${estado.punto}`} aria-hidden="true" />
      <span>{fechaIso ?? "-"}</span>
      <span className="text-xs">{estado.etiqueta}</span>
    </span>
  );
}

function QuickActionsBar({
  nombre,
  telefono,
  correo,
  onChat
}: {
  nombre: string;
  telefono: string | null;
  correo: string | null;
  onChat: () => void;
}) {
  const telefonoLimpio = limpiarTelefono(telefono);
  const whatsapp = telefonoWhatsapp(telefono);
  const correoValido = correo && correo !== "-" ? correo : null;
  const mensaje = encodeURIComponent(`Hola ${nombre}, te contactamos de ruumruum sobre tu Pasaporte digital CONCER.`);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <a
        href={telefonoLimpio ? `tel:${telefonoLimpio}` : undefined}
        aria-disabled={!telefonoLimpio}
        className={`inline-flex h-9 items-center justify-center rounded-md border px-3 font-body text-xs font-semibold transition ${telefonoLimpio ? "border-ui-line bg-ui-card text-ui-fg-muted hover:bg-ui-muted" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
        title={telefonoLimpio ? "Llamar al conductor" : "Teléfono no registrado"}
      >
        Tel
      </a>
      <a
        href={whatsapp ? `https://wa.me/${whatsapp}?text=${mensaje}` : undefined}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!whatsapp}
        className={`inline-flex h-9 items-center justify-center rounded-md border px-3 font-body text-xs font-semibold transition ${whatsapp ? "border-ui-success/30 bg-ui-success-soft text-ui-success hover:bg-ui-success-soft" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
        title={whatsapp ? "Abrir WhatsApp con plantilla" : "Teléfono no disponible para WhatsApp"}
      >
        WhatsApp
      </a>
      <a
        href={correoValido ? `mailto:${correoValido}?subject=${encodeURIComponent("Pasaporte digital CONCER")}` : undefined}
        aria-disabled={!correoValido}
        className={`inline-flex h-9 items-center justify-center rounded-md border px-3 font-body text-xs font-semibold transition ${correoValido ? "border-ui-line bg-ui-card text-ui-fg-muted hover:bg-ui-muted" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
        title={correoValido ? "Enviar correo" : "Correo no registrado"}
      >
        Email
      </a>
      <button
        type="button"
        onClick={onChat}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-ui-brand/25 bg-ui-brand-soft px-3 font-body text-xs font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft"
        title="Abrir chat interno del expediente"
      >
        Chat interno
        <span className="rounded-full bg-ui-card px-1.5 py-0.5 font-mono-ruum text-xs">0</span>
      </button>
    </div>
  );
}

function KpiCard({ etiqueta, valor, detalle, tono = "neutral" }: { etiqueta: string; valor: ReactNode; detalle: string; tono?: "neutral" | "success" | "warning" | "danger" }) {
  const tonoClase = {
    neutral: "border-ui-line bg-ui-card",
    success: "border-ui-success/25 bg-ui-success-soft",
    warning: "border-ui-warning/30 bg-ui-warning-soft",
    danger: "border-ui-danger/25 bg-ui-danger-soft"
  }[tono];
  return (
    <div className={`min-w-0 rounded-lg border px-3 py-3 ${tonoClase}`}>
      <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ui-fg-muted">{etiqueta}</p>
      <div className="mt-2 font-display text-xl font-semibold text-ui-fg">{valor}</div>
      <p className="mt-1 line-clamp-2 font-body text-xs text-ui-fg-muted" title={detalle}>{detalle}</p>
    </div>
  );
}

function BadgeNeutro({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-ui-line bg-ui-brand/[0.04] px-2.5 py-1 font-body text-xs font-semibold text-ui-fg-muted">
      {children}
    </span>
  );
}

function SeccionAcordeon({ titulo, distintivo, children }: { titulo: string; distintivo?: ReactNode; children: ReactNode }) {
  return (
    <details className="rounded-lg border border-ui-line bg-ui-card p-4 shadow-ui-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-ui-brand/25 bg-ui-brand-soft font-body text-xs font-bold text-ui-brand-soft-fg" aria-hidden="true">⌄</span>
          <h2 className="font-display text-lg font-semibold">{titulo}</h2>
        </span>
        {distintivo && <span className="shrink-0">{distintivo}</span>}
      </summary>
      <div className="mt-4 border-t border-ui-line pt-4">
        {children}
      </div>
    </details>
  );
}

function DesempenoScore({
  conductor,
  documentosAprobados,
  diasVigencia,
  onActualizado,
  onAviso
}: {
  conductor: ConductorRow | null;
  documentosAprobados: boolean;
  diasVigencia: number | null;
  onActualizado: () => Promise<void> | void;
  onAviso: (aviso: { tono: "info" | "danger"; texto: string }) => void;
}) {
  const elegibilidad = evaluarElegibilidad({ conductor, documentosAprobados, diasVigencia });
  const totalEventosOperativos = conductor
    ? conductor.traslados_completados + conductor.cancelaciones_sin_justificacion_count + conductor.no_presentaciones_6m
    : 0;
  const efectividad = conductor && totalEventosOperativos > 0
    ? (conductor.traslados_completados / totalEventosOperativos) * 100
    : null;
  const tonoElegibilidad = elegibilidad.tono === "success"
    ? "border-ui-success/30 bg-ui-success-soft text-ui-success"
    : elegibilidad.tono === "danger"
      ? "border-ui-danger/30 bg-ui-danger-soft text-ui-danger"
      : "border-ui-warning/35 bg-ui-warning-soft text-ui-warning";

  return (
    <SeccionAcordeon titulo="Desempeño y Score" distintivo={<span className={`rounded-full border px-3 py-1 font-body text-xs font-semibold ${tonoElegibilidad}`}>{elegibilidad.texto}</span>}>
      <div className={`mt-4 rounded-lg border px-3 py-3 ${tonoElegibilidad}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-sm font-semibold">{elegibilidad.texto} · {elegibilidad.detalle}</p>
          <span className="rounded-full border border-current/20 px-2.5 py-1 font-body text-xs font-semibold">
            {textoEstadoConductor(conductor?.estado)}
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <KpiCard
          etiqueta="Calificación"
          valor={conductor ? <span className="inline-flex items-center gap-2"><span aria-hidden="true">⭐</span>{conductor.calificacion_promedio.toFixed(2)} / 5.0</span> : "Sin alta"}
          detalle={conductor ? "Promedio acumulado del conductor." : "Se activará cuando exista conductor asociado."}
          tono={conductor && conductor.calificacion_promedio >= 4.5 ? "success" : "neutral"}
        />
        <KpiCard
          etiqueta="Rendimiento"
          valor={efectividad === null ? <BadgeNeutro>Sin actividad previa</BadgeNeutro> : formatoPorcentaje(efectividad)}
          detalle={conductor ? `Cancelaciones: ${conductor.cancelaciones_sin_justificacion_count} · No presentaciones 6m: ${conductor.no_presentaciones_6m}` : "Sin historial operativo."}
          tono={efectividad !== null && efectividad >= 90 ? "success" : "neutral"}
        />
        <KpiCard
          etiqueta="Historial"
          valor={conductor ? `${conductor.traslados_completados} traslados` : "Sin historial"}
          detalle={`Nivel CONCER: ${etiquetaNivel(conductor?.nivel_operativo_vigente ?? conductor?.nivel_por_experiencia)}`}
        />
        <KpiCard
          etiqueta="Penalizaciones"
          valor={conductor ? `${conductor.suspensiones_activas} activas` : "Sin conductor"}
          detalle={conductor ? `Incidencias graves: ${conductor.incidencias_graves_6m} en 6m · ${conductor.incidencias_graves_12m} en 12m` : "Sin expediente operativo."}
          tono={conductor && conductor.suspensiones_activas > 0 ? "danger" : "success"}
        />
      </div>
      <AccionesCriticasPasaporte conductor={conductor} onActualizado={onActualizado} onAviso={onAviso} />
    </SeccionAcordeon>
  );
}

function IconoPausa() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 5v14" />
      <path d="M16 5v14" />
    </svg>
  );
}

function IconoBaja() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function AccionesCriticasPasaporte({
  conductor,
  onActualizado,
  onAviso
}: {
  conductor: ConductorRow | null;
  onActualizado: () => Promise<void> | void;
  onAviso: (aviso: { tono: "info" | "danger"; texto: string }) => void;
}) {
  const [accion, setAccion] = useState<"suspender" | "baja" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cerrar() {
    setAccion(null);
    setMotivo("");
    setConfirmacion("");
    setError(null);
  }

  async function ejecutar() {
    if (!conductor || !accion || !motivo.trim()) return;
    if (accion === "baja" && confirmacion !== "BAJA") return;
    setProcesando(true);
    setError(null);
    try {
      const cliente = crearClienteNavegador();
      const nuevoEstado = accion === "suspender" ? "suspendido" : "baja";
      const aprobacionId = await solicitarAprobacionAdmin(cliente, {
        tipo: "sancion",
        capacidad: "conductores:sancionar",
        recurso: "conductores",
        recursoId: conductor.id,
        accion: "suspender",
        payload: { nuevo_estado: nuevoEstado, motivo: motivo.trim() } as Json
      });
      await onActualizado();
      onAviso({
        tono: "info",
        texto: `Solicitud de aprobación #${aprobacionId.slice(0, 8).toUpperCase()} creada. Autorízala en Aprobaciones duales para ejecutar la ${accion === "suspender" ? "suspensión" : "baja definitiva"}.`
      });
      cerrar();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo completar la acción.";
      setError(mensaje);
    } finally {
      setProcesando(false);
    }
  }

  const titulo = accion === "baja" ? "Baja definitiva" : "Suspender conductor";
  const efecto = accion === "baja"
    ? "La cuenta queda bloqueada permanentemente y no podrá operar traslados."
    : "El conductor no podrá recibir nuevos traslados hasta que se reactive.";
  const motivos = accion === "baja" ? MOTIVOS_BAJA : MOTIVOS_SUSPENSION;

  return (
    <div className="mt-4 rounded-lg border border-ui-line bg-ui-muted p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-body text-sm font-semibold text-ui-fg">Acciones operativas</h3>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">Suspender impide nuevos Traslados hasta reactivación; baja definitiva bloquea la cuenta operativa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAccion("suspender")}
            disabled={!conductor || procesando}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ui-line-strong bg-ui-card px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconoPausa /> Suspender
          </button>
          <button
            type="button"
            onClick={() => setAccion("baja")}
            disabled={!conductor || procesando}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ui-danger/40 bg-ui-danger/10 px-4 py-2 font-body text-sm font-semibold text-ui-danger hover:bg-ui-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconoBaja /> Baja definitiva
          </button>
        </div>
      </div>
      {!conductor && <p className="mt-3 font-body text-sm text-ui-fg-muted">Disponible cuando la solicitud tenga conductor asociado.</p>}
      {accion && conductor && (
        <div role="dialog" aria-modal="true" aria-labelledby="accion-critica-pasaporte" className="mt-4 rounded-lg border border-ui-line bg-ui-card p-4">
          <p id="accion-critica-pasaporte" className={`flex items-center gap-2 font-body text-sm font-semibold ${accion === "baja" ? "text-ui-danger" : "text-ui-warning"}`}>
            {accion === "baja" ? <IconoBaja /> : <IconoPausa />} {titulo}
          </p>
          <div className="mt-3 rounded-lg border border-ui-line bg-ui-muted px-3 py-2 font-body text-sm text-ui-fg-muted">
            <p><span className="font-semibold text-ui-fg">Conductor:</span> {conductor.nombre}</p>
            <p><span className="font-semibold text-ui-fg">Estado actual:</span> {textoEstadoConductor(conductor.estado)}</p>
            <p><span className="font-semibold text-ui-fg">Efecto:</span> {efecto}</p>
          </div>
          {error && <div className="mt-3"><Aviso tono="danger">{error}</Aviso></div>}
          <details className="mt-3 rounded-lg border border-ui-line bg-ui-muted p-3">
            <summary className="cursor-pointer list-none font-body text-sm font-semibold text-ui-fg">
              Motivos principales
            </summary>
            <div className="mt-3 grid gap-2">
              {motivos.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setMotivo(opcion)}
                  className={`min-h-11 rounded-lg border px-3 py-2 text-left font-body text-sm font-medium transition ${motivo === opcion ? "border-ui-brand bg-ui-brand-soft text-ui-brand-soft-fg" : "border-ui-line bg-ui-card text-ui-fg-muted hover:bg-ui-muted"}`}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </details>
          <label className="mt-3 flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Motivo</span>
            <textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              className="min-h-[88px] rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
              placeholder={accion === "baja" ? "Motivo de la baja definitiva" : "Motivo de la suspensión"}
            />
          </label>
          {accion === "baja" && (
            <label className="mt-3 flex flex-col gap-1">
              <span className="font-body text-xs font-medium text-ui-fg-muted">Escribe BAJA para confirmar</span>
              <input
                type="text"
                value={confirmacion}
                onChange={(event) => setConfirmacion(event.target.value)}
                className="min-h-11 rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
              />
            </label>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void ejecutar()}
              disabled={procesando || !motivo.trim() || (accion === "baja" && confirmacion !== "BAJA")}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:cursor-not-allowed disabled:opacity-50 ${accion === "baja" ? "bg-ui-danger hover:bg-ui-danger/90" : "bg-ui-warning hover:bg-ui-warning/90"}`}
            >
              {accion === "baja" ? <IconoBaja /> : <IconoPausa />}
              {procesando ? "Procesando..." : accion === "baja" ? "Confirmar baja" : "Confirmar suspensión"}
            </button>
            <button type="button" onClick={cerrar} disabled={procesando} className="min-h-11 rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium hover:bg-ui-muted disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CampoEditable({
  label,
  value,
  onChange,
  inputMode = "text",
  readOnly = false
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  inputMode?: "text" | "tel" | "numeric";
  readOnly?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs font-medium text-ui-fg-muted">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-11 rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm text-ui-fg focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring ${readOnly ? "bg-ui-brand/[0.04] text-ui-fg-muted" : "bg-ui-card"}`}
      />
    </label>
  );
}

function DomicilioContactoEditable({
  solicitud,
  conductor,
  correo,
  onGuardado
}: {
  solicitud: DetalleSolicitudConductorAdmin["solicitud"];
  conductor: ConductorRow | null;
  correo: string;
  onGuardado: () => Promise<void> | void;
}) {
  const valoresIniciales = useMemo(() => ({
    codigo_postal: conductor?.codigo_postal ?? textoJson(solicitud.domicilio, "codigo_postal") ?? "",
    estado_residencia: conductor?.estado_residencia ?? textoJson(solicitud.domicilio, "estado") ?? "",
    ciudad_municipio: conductor?.ciudad_municipio ?? textoJson(solicitud.domicilio, "ciudad_municipio", "ciudad") ?? "",
    colonia: conductor?.colonia ?? textoJson(solicitud.domicilio, "colonia") ?? "",
    calle: conductor?.calle ?? textoJson(solicitud.domicilio, "calle") ?? "",
    numero: conductor?.numero ?? textoJson(solicitud.domicilio, "numero") ?? "",
    referencias: conductor?.referencias ?? textoJson(solicitud.domicilio, "referencias") ?? "",
    contacto_emergencia_nombre: conductor?.contacto_emergencia_nombre ?? textoJson(solicitud.contacto_emergencia, "nombre") ?? "",
    contacto_emergencia_telefono: conductor?.contacto_emergencia_telefono ?? textoJson(solicitud.contacto_emergencia, "telefono") ?? ""
  }), [solicitud, conductor]);
  const [datos, setDatos] = useState(valoresIniciales);
  const [procesando, setProcesando] = useState(false);
  const [avisoLocal, setAvisoLocal] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  const mapa = urlMapaDomicilio(datos);
  const llamadaEmergencia = telefonoLlamada(datos.contacto_emergencia_telefono);

  useEffect(() => {
    setDatos(valoresIniciales);
  }, [valoresIniciales]);

  function actualizar<K extends keyof typeof datos>(campo: K, valor: string) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }));
  }

  async function guardar() {
    if (!conductor) {
      setAvisoLocal({ tono: "danger", texto: "Disponible cuando la solicitud tenga conductor asociado." });
      return;
    }
    setProcesando(true);
    setAvisoLocal(null);
    try {
      const cliente = crearClienteNavegador();
      await actualizarConductorAdmin(cliente, conductor.id, {
        nombre: conductor.nombre ?? "",
        telefono: conductor.telefono ?? "",
        curp: conductor.curp ?? "",
        licencia_numero: conductor.licencia_numero ?? "",
        licencia_tipo: conductor.licencia_tipo ?? "",
        licencia_vigencia: conductor.licencia_vigencia ?? "",
        foto_perfil_url: conductor.foto_perfil_url ?? null,
        ...datos
      });
      await onGuardado();
      setAvisoLocal({ tono: "info", texto: "Domicilio y contacto de emergencia actualizados." });
    } catch (err) {
      setAvisoLocal({ tono: "danger", texto: err instanceof Error ? err.message : "No se pudo guardar la información." });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <SeccionAcordeon
      titulo="Domicilio y contacto de emergencia"
      distintivo={<span className="font-body text-xs text-ui-fg-muted">Editable</span>}
    >
      <div className="space-y-4">
        {avisoLocal && <Aviso tono={avisoLocal.tono}>{avisoLocal.texto}</Aviso>}
        <div className="rounded-lg border border-ui-line bg-ui-muted p-3">
          <p className="font-body text-sm font-semibold text-ui-fg">Domicilio formateado</p>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">
            {[
              [datos.calle, datos.numero].filter(Boolean).join(" "),
              datos.colonia,
              datos.codigo_postal,
              datos.ciudad_municipio,
              datos.estado_residencia
            ].filter(Boolean).join(", ") || "Sin domicilio registrado."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={mapa ?? undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!mapa}
              className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 font-body text-sm font-semibold ${mapa ? "border-ui-brand/40 bg-ui-brand/10 text-ui-brand-soft-fg hover:bg-ui-brand/20" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
            >
              Ver mapa
            </a>
            <a
              href={llamadaEmergencia ?? undefined}
              aria-disabled={!llamadaEmergencia}
              className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 font-body text-sm font-semibold ${llamadaEmergencia ? "border-ui-success/40 bg-ui-success/10 text-ui-success hover:bg-ui-success/20" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
            >
              Llamar emergencia
            </a>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoEditable label="Código postal" value={datos.codigo_postal} inputMode="numeric" onChange={(valor) => actualizar("codigo_postal", valor)} />
          <CampoEditable label="Estado" value={datos.estado_residencia} onChange={(valor) => actualizar("estado_residencia", valor)} />
          <CampoEditable label="Municipio o ciudad" value={datos.ciudad_municipio} onChange={(valor) => actualizar("ciudad_municipio", valor)} />
          <CampoEditable label="Colonia" value={datos.colonia} onChange={(valor) => actualizar("colonia", valor)} />
          <CampoEditable label="Calle" value={datos.calle} onChange={(valor) => actualizar("calle", valor)} />
          <CampoEditable label="Número" value={datos.numero} onChange={(valor) => actualizar("numero", valor)} />
          <CampoEditable label="Referencias" value={datos.referencias} onChange={(valor) => actualizar("referencias", valor)} />
          <CampoEditable label="Correo electrónico" value={correo} onChange={() => undefined} readOnly />
          <CampoEditable label="Contacto de emergencia" value={datos.contacto_emergencia_nombre} onChange={(valor) => actualizar("contacto_emergencia_nombre", valor)} />
          <CampoEditable label="Teléfono de emergencia" value={datos.contacto_emergencia_telefono} inputMode="tel" onChange={(valor) => actualizar("contacto_emergencia_telefono", valor)} />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={procesando || !conductor}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? "Guardando..." : "Guardar datos"}
          </button>
        </div>
      </div>
    </SeccionAcordeon>
  );
}

function ConsentimientosAcordeon({ consentimientos }: { consentimientos: DetalleSolicitudConductorAdmin["consentimientos"] }) {
  return (
    <details className="rounded-lg border border-ui-line bg-ui-card px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="font-body text-sm font-semibold text-ui-fg">Términos, privacidad y declaraciones</span>
        <span className="font-body text-xs text-ui-fg-muted">{consentimientos.length}/4</span>
      </summary>
      <div className="mt-3 space-y-2 border-t border-ui-line pt-3">
        {consentimientos.length === 0 ? <p className="font-body text-sm text-ui-fg-muted">Sin consentimientos registrados.</p> : consentimientos.map((consentimiento) => (
          <ConsentimientoItem key={consentimiento.id} consentimiento={consentimiento} />
        ))}
      </div>
    </details>
  );
}

function HistorialAcordeon({ historial }: { historial: DetalleSolicitudConductorAdmin["historial"] }) {
  const ultimo = historial[0] ?? null;
  return (
    <details className="rounded-lg border border-ui-line bg-ui-card p-4 shadow-ui-sm">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Historial de estados y decisiones</h2>
          {ultimo && <span className="rounded-full border border-ui-brand/30 bg-ui-brand-soft px-3 py-1 font-body text-xs font-semibold text-ui-brand-soft-fg">{ETIQUETA_DECISION[ultimo.decision] ?? ultimo.decision}</span>}
        </div>
        {ultimo ? (
          <p className="mt-2 font-body text-sm text-ui-fg-muted">{ETIQUETA_ESTADO[ultimo.estado_anterior]} - {ETIQUETA_ESTADO[ultimo.estado_nuevo]} · {fecha(ultimo.revisado_en)}</p>
        ) : (
          <p className="mt-2 font-body text-sm text-ui-fg-muted">Sin pasos registrados.</p>
        )}
      </summary>
      <ol className="mt-4 space-y-4 border-t border-ui-line pt-4">
        {historial.map((evento) => (
          <li key={evento.id} className="border-l-2 border-ui-brand/25 pl-4 font-body text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{ETIQUETA_DECISION[evento.decision] ?? evento.decision}</p>
              <time className="text-xs text-ui-fg-muted">{fecha(evento.revisado_en)}</time>
            </div>
            <p className="mt-1 text-xs text-ui-fg-muted">{ETIQUETA_ESTADO[evento.estado_anterior]} - {ETIQUETA_ESTADO[evento.estado_nuevo]} · {evento.revisor_nombre ?? "Sistema/conductor"}</p>
            {evento.motivo && <p className="mt-1 text-ui-fg-muted">{evento.motivo}</p>}
          </li>
        ))}
      </ol>
    </details>
  );
}

function ChatInternoDrawer({
  nombre,
  notas,
  onEnviar,
  onClose
}: {
  nombre: string;
  notas: DetalleSolicitudConductorAdmin["notasInternas"];
  onEnviar: (mensaje: string) => Promise<void>;
  onClose: () => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mensaje.trim()) return;
    setEnviando(true);
    setError(null);
    try {
      await onEnviar(mensaje.trim());
      setMensaje("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ui-brand" role="dialog" aria-modal="true" aria-label="Chat interno">
      <div className="ml-auto flex h-full w-full max-w-md flex-col border-l border-ui-line bg-ui-card shadow-ui-md">
        <div className="flex items-start justify-between gap-3 border-b border-ui-line px-5 py-4">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-ui-fg-muted">Chat interno</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ui-fg">{nombre}</h2>
          </div>
          <button type="button" onClick={onClose} className="min-h-10 rounded-md border border-ui-line px-3 py-2 font-body text-xs font-semibold text-ui-fg-muted hover:bg-ui-muted">
            Cerrar
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {notas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ui-line bg-ui-muted p-4 text-center">
              <p className="font-body text-sm font-semibold text-ui-fg">Sin notas internas</p>
              <p className="mt-1 font-body text-sm text-ui-fg-muted">Registra contexto operativo para Torre de Control. No será visible para el conductor.</p>
            </div>
          ) : notas.map((nota) => (
            <article key={nota.id} className="rounded-lg border border-ui-line bg-ui-muted p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-body text-sm font-semibold text-ui-fg">{nota.admin_nombre ?? "Administrador"}</p>
                <time className="font-body text-xs text-ui-fg-muted">{fecha(nota.creado_en)}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap font-body text-sm text-ui-fg-muted">{nota.mensaje}</p>
            </article>
          ))}
        </div>
        <form onSubmit={enviar} className="border-t border-ui-line bg-ui-card px-5 py-4">
          {error && <div className="mb-3"><Aviso tono="danger">{error}</Aviso></div>}
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Mensaje interno</span>
            <textarea
              value={mensaje}
              onChange={(event) => setMensaje(event.target.value)}
              rows={3}
              maxLength={1000}
              className="min-h-[96px] rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
              placeholder="Escribe una nota para el expediente"
            />
          </label>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-body text-xs text-ui-fg-muted">{mensaje.length}/1000</span>
            <button
              type="submit"
              disabled={enviando || !mensaje.trim()}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConsentimientoItem({ consentimiento }: { consentimiento: DetalleSolicitudConductorAdmin["consentimientos"][number] }) {
  const [copiado, setCopiado] = useState(false);

  async function copiarHash() {
    await navigator.clipboard.writeText(consentimiento.hash_documento);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1600);
  }

  return (
    <details className="rounded-lg border border-ui-line bg-ui-card px-3 py-2 font-body text-sm">
      <summary className="cursor-pointer list-none">
        <span className="flex items-center justify-between gap-3">
          <span className="font-medium text-ui-fg">{ETIQUETA_CONSENTIMIENTO[consentimiento.tipo_documento] ?? consentimiento.tipo_documento}</span>
          <AdminBadge tone="success">Consentido</AdminBadge>
        </span>
        <span className="mt-1 block text-xs text-ui-fg-muted">Versión {consentimiento.version} · {fecha(consentimiento.aceptado_en)} · {consentimiento.canal}</span>
      </summary>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ui-line pt-3">
        <span className="font-mono-ruum text-xs text-ui-fg-muted">Hash {truncarHash(consentimiento.hash_documento)}</span>
        <button type="button" onClick={copiarHash} className="rounded-md border border-ui-line px-2 py-1 font-body text-xs font-semibold text-ui-fg-muted hover:bg-ui-muted">
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
    </details>
  );
}

function FilaDocumento({
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

function VisorDocumento({
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
    if (!tieneSupabaseConfigurado()) { setCargando(false); return; }
    try {
      setDetalle(await obtenerDetalleSolicitudConductorAdmin(crearClienteNavegador(), id));
    } catch (err) {
      setAviso({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos cargar el Pasaporte digital CONCER." });
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    setCorreoAuth(null);
    const timer = setTimeout(() => { void cargar(); }, 0);
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
        const payload = await respuesta.json() as { correo?: string | null };
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

  const seleccionarDocumento = useCallback(async (documento: DocumentoRow) => {
    setVisorCerrado(false);
    setDocumentoSeleccionadoId(documento.id);
    if (urlsDocumento[documento.id]) return;
    const urlFirmada = await obtenerUrlDocumentoConductor(crearClienteNavegador(), documento.url, 60 * 30);
    setUrlsDocumento((actuales) => ({ ...actuales, [documento.id]: urlFirmada }));
  }, [urlsDocumento]);

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
    setDetalle((actual) => actual ? { ...actual, notasInternas: [...actual.notasInternas, nota] } : actual);
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
      setAviso({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos aprobar los documentos por lote." });
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
      setAviso({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos registrar la decisión." });
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) return <main className="admin-page-shell"><p className="font-body text-sm text-ui-fg-muted">Cargando...</p></main>;
  if (!detalle) return (
    <main className="admin-page-shell">
      <AdminPageHeader
        titulo="No encontramos esa solicitud"
        descripcion="La solicitud no está disponible o tu sesión no tiene permisos para revisarla."
        breadcrumb={[{ label: "Conductores", href: "/conductores" }, { label: "Revisión" }]}
      />
      {aviso && <div className="mt-4"><Aviso tono={aviso.tono}>{aviso.texto}</Aviso></div>}
      <Link href="/conductores" className="mt-4 inline-block font-body text-sm text-ui-brand-soft-fg hover:underline">Volver a la bandeja</Link>
    </main>
  );

  const { solicitud, conductor, documentos, historial } = detalle;
  const nombre = textoJson(solicitud.datos_personales, "nombre") ?? conductor?.nombre ?? "Conductor sin nombre";
  const correoContacto = textoJson(solicitud.datos_personales, "email", "correo", "correo_electronico");
  const correo = correoContacto ?? correoAuth ?? "-";
  const telefonoContacto = solicitud.telefono_normalizado ?? conductor?.telefono ?? null;
  const vigenciaLicencia = textoJson(solicitud.licencia, "vigencia") ?? conductor?.licencia_vigencia ?? null;
  const diasVigencia = diasParaVencer(vigenciaLicencia);
  const documentosRequeridos = documentos.filter((documento) => DOCUMENTOS_REQUERIDOS.includes(documento.tipo as typeof DOCUMENTOS_REQUERIDOS[number]));
  const documentosAprobadosCount = DOCUMENTOS_REQUERIDOS.filter((tipo) => documentos.some((documento) => documento.tipo === tipo && documento.estado === "aprobado")).length;
  const documentosAprobados = documentosAprobadosCount === DOCUMENTOS_REQUERIDOS.length;
  const tiposConsentidos = new Set(consentimientosActuales.map((consentimiento) => consentimiento.tipo_documento));
  const consentimientosRegistradosCount = CONSENTIMIENTOS_REQUERIDOS.filter((tipo) => tiposConsentidos.has(tipo)).length;
  const consentimientosCompletos = consentimientosRegistradosCount === CONSENTIMIENTOS_REQUERIDOS.length;
  const puedeAprobar = solicitud.estado === "en_revision" && documentosAprobados && consentimientosCompletos;
  const documentosLote = documentosRequeridos.filter((documento) => documento.estado === "en_revision");
  const anomalíasVisibles = documentosRequeridos.some((documento) => documento.estado === "rechazado" || documento.estado === "vencido" || Boolean(documento.motivo_rechazo));
  const puedeAprobarLote = solicitud.estado === "en_revision" && documentosRequeridos.length === DOCUMENTOS_REQUERIDOS.length && documentosLote.length > 0 && !anomalíasVisibles;
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
        accion={(
          <div className="flex flex-wrap justify-end gap-2">
            <Link href="/conductores" className="inline-flex min-h-10 items-center rounded-lg border border-ui-brand bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand shadow-sm hover:bg-ui-brand/90">
              Regresar
            </Link>
            <AdminButton
              variant="secondary"
              className={puedeAprobarLote ? "border-ui-success bg-ui-success text-ui-on-brand hover:bg-ui-success/90" : "border-ui-line bg-ui-card text-ui-fg-muted"}
              loading={procesando && !accion}
              disabled={!puedeAprobarLote || procesando}
              onClick={() => void aprobarTodosDocumentos(documentosLote)}
              title={!puedeAprobarLote ? "Disponible cuando los documentos requeridos están en revisión y no hay anomalías visibles." : undefined}
            >
              Aprobar todos los documentos
            </AdminButton>
          </div>
        )}
      />

      {aviso && <div className="mt-4"><Aviso tono={aviso.tono}>{aviso.texto}</Aviso></div>}
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
              <Dato
                etiqueta="Vigencia"
                valor={<VigenciaLicencia fechaIso={vigenciaLicencia} dias={diasVigencia} />}
                destacado
              />
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
              <IndicadorChecklist etiqueta="Consentimientos registrados" valor={`${consentimientosRegistradosCount}/4`} completo={consentimientosCompletos} />
            </div>
            <div className="mt-5">
              <ConsentimientosAcordeon consentimientos={consentimientosActuales} />
            </div>
          </PassportCard>

          <SeccionAcordeon titulo="Documentos vigentes" distintivo={<span className="font-body text-xs text-ui-fg-muted">{documentos.length} documento(s)</span>}>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {documentos.length === 0 ? <p className="font-body text-sm text-ui-fg-muted">No hay documentos vigentes.</p> : documentos.map((documento) => (
                <FilaDocumento
                  key={documento.id}
                  documento={documento}
                  seleccionado={documentoSeleccionado?.id === documento.id}
                  onSeleccionar={seleccionarDocumento}
                  onRevisado={revisarDocumento}
                />
              ))}
            </div>
          </SeccionAcordeon>

          <section className="sticky bottom-4 z-20 rounded-lg border border-ui-line bg-ui-card p-4 shadow-ui-md">
            <h2 className="font-display text-lg font-semibold">Decisión administrativa</h2>
            {solicitud.estado === "en_revision" ? (
              <>
                <div className="mt-4 grid gap-2">
                  <AdminButton onClick={() => setAccion("aprobar")} disabled={!puedeAprobar || procesando}>Aprobar solicitud</AdminButton>
                  <AdminButton variant="danger" onClick={() => setAccion("rechazar")} disabled={procesando}>Rechazar solicitud</AdminButton>
                </div>
                {!puedeAprobar && (
                  <div className="mt-3 space-y-2">
                    <IndicadorChecklist etiqueta="Documentos aprobados" valor={`${documentosAprobadosCount}/3`} completo={documentosAprobados} />
                    <IndicadorChecklist etiqueta="Consentimientos registrados" valor={`${consentimientosRegistradosCount}/4`} completo={consentimientosCompletos} />
                    <p className="font-body text-xs text-ui-fg-muted">Aprobar solicitud se habilita cuando los documentos requeridos y consentimientos estén completos.</p>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 font-body text-sm text-ui-fg-muted">La solicitud no admite una decisión final en su estado actual.</p>
            )}
            {accion && (
              <div className="mt-4 rounded-lg border border-ui-line bg-ui-muted p-4">
                <label className="font-body text-sm font-medium" htmlFor="motivo-decision">Motivo de la decisión {accion === "rechazar" && <span className="text-ui-danger">*</span>}</label>
                <textarea
                  id="motivo-decision"
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  maxLength={800}
                  placeholder={accion === "aprobar" ? "Opcional: observaciones de la aprobación." : "Explica el motivo del rechazo."}
                  className="mt-2 min-h-24 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <AdminButton variant={accion === "rechazar" ? "danger" : "primary"} onClick={decidir} loading={procesando} disabled={accion === "rechazar" && motivo.trim().length < 5}>
                    Confirmar decisión
                  </AdminButton>
                  <AdminButton variant="quiet" onClick={() => { setAccion(null); setMotivo(""); }} disabled={procesando}>Cancelar</AdminButton>
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
