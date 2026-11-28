"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Aviso } from "@ruum/ui";
import { AdminBadge } from "../../admin-components";
import type {
  EstadoSolicitud,
  DetalleSolicitudConductorAdmin
} from "./ConductorDetalleTipos";
import {
  ETIQUETA_ESTADO,
  ETIQUETA_CONSENTIMIENTO,
  ESTADO_SOLICITUD_CLASE,
  ETIQUETA_DECISION,
  estadoVigencia,
  telefonoWhatsapp,
  telefonoLlamada,
  fecha,
  truncarHash
} from "./ConductorDetalleTipos";

export function BadgeEstadoSolicitud({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span className={`rounded-full border px-3 py-1 font-body text-xs font-semibold ${ESTADO_SOLICITUD_CLASE[estado]}`}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

export function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: ReactNode; destacado?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-ui-line bg-ui-card px-3 py-2.5">
      <dt className="font-body text-xs text-ui-fg-muted">{etiqueta}</dt>
      <dd className={`mt-1 break-words font-body text-sm ${destacado ? "font-semibold text-ui-fg" : "font-medium text-ui-fg-muted"}`}>{valor || <span className="text-ui-fg-muted">-</span>}</dd>
    </div>
  );
}

export function IndicadorChecklist({ etiqueta, valor, completo }: { etiqueta: string; valor: string; completo: boolean }) {
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

export function VigenciaLicencia({ fechaIso, dias }: { fechaIso: string | null; dias: number | null }) {
  const estado = estadoVigencia(dias);
  return (
    <span className={`inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border px-2.5 py-1 font-body text-sm font-semibold ${estado.clase}`}>
      <span className={`size-2 rounded-full ${estado.punto}`} aria-hidden="true" />
      <span>{fechaIso ?? "-"}</span>
      <span className="text-xs">{estado.etiqueta}</span>
    </span>
  );
}

export function QuickActionsBar({
  nombre,
  telefono,
  correo,
  onChat
}: {
  nombre: string;
  telefono: string | null;
  correo: string;
  onChat: () => void;
}) {
  const [copiado, setCopiado] = useState<string | null>(null);
  const wa = telefonoWhatsapp(telefono);
  const tel = telefonoLlamada(telefono);
  const mailto = correo && correo !== "Sin correo registrado" ? `mailto:${correo}` : null;

  async function copiar(texto: string, clave: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(clave);
    window.setTimeout(() => setCopiado(null), 1600);
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-semibold text-ui-fg">{nombre}</h2>
        <p className="mt-0.5 font-body text-sm text-ui-fg-muted">{telefono ?? "Sin teléfono"} · {correo}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={tel ?? undefined}
          aria-disabled={!tel}
          className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3.5 py-2 font-body text-sm font-semibold ${tel ? "border-ui-brand/40 bg-ui-brand/10 text-ui-brand-soft-fg hover:bg-ui-brand/20" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
        >
          Llamar
        </a>
        <a
          href={wa ? `https://wa.me/${wa}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!wa}
          className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3.5 py-2 font-body text-sm font-semibold ${wa ? "border-ui-success/40 bg-ui-success/10 text-ui-success hover:bg-ui-success/20" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
        >
          WhatsApp
        </a>
        <a
          href={mailto ?? undefined}
          aria-disabled={!mailto}
          className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3.5 py-2 font-body text-sm font-semibold ${mailto ? "border-ui-line-strong bg-ui-card text-ui-fg hover:bg-ui-muted" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
        >
          Email
        </a>
        <button
          type="button"
          onClick={onChat}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ui-line-strong bg-ui-card px-3.5 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted"
        >
          Chat interno
        </button>
        <button
          type="button"
          onClick={() => copiar(window.location.href, "expediente")}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ui-line-strong bg-ui-card px-3.5 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted"
        >
          {copiado === "expediente" ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}

export function KpiCard({ etiqueta, valor, detalle, tono = "neutral" }: { etiqueta: string; valor: ReactNode; detalle: string; tono?: "neutral" | "success" | "warning" | "danger" }) {
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

export function BadgeNeutro({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-ui-line bg-ui-brand/[0.04] px-2.5 py-1 font-body text-xs font-semibold text-ui-fg-muted">
      {children}
    </span>
  );
}

export function SeccionAcordeon({ titulo, distintivo, children }: { titulo: string; distintivo?: ReactNode; children: ReactNode }) {
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

export function IconoPausa() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 5v14" />
      <path d="M16 5v14" />
    </svg>
  );
}

export function IconoBaja() {
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

export function ConsentimientosAcordeon({ consentimientos }: { consentimientos: DetalleSolicitudConductorAdmin["consentimientos"] }) {
  return (
    <div className="space-y-2">
      {consentimientos.map((item) => (
        <ConsentimientoItem key={item.id} consentimiento={item} />
      ))}
    </div>
  );
}

export function HistorialAcordeon({ historial }: { historial: DetalleSolicitudConductorAdmin["historial"] }) {
  return (
    <SeccionAcordeon titulo="Historial y auditoría" distintivo={<span className="font-body text-xs text-ui-fg-muted">{historial.length} evento(s)</span>}>
      {historial.length === 0 ? (
        <p className="font-body text-sm text-ui-fg-muted">No hay eventos registrados.</p>
      ) : (
        <div className="space-y-3">
          {historial.map((evento) => (
            <div key={evento.id} className="rounded-lg border border-ui-line bg-ui-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-body text-sm font-semibold text-ui-fg">{ETIQUETA_DECISION[evento.decision] ?? evento.decision}</span>
                <span className="font-body text-xs text-ui-fg-muted">{fecha(evento.revisado_en)}</span>
              </div>
              <p className="mt-1 font-body text-xs text-ui-fg-muted">
                {ETIQUETA_ESTADO[evento.estado_anterior]} - {ETIQUETA_ESTADO[evento.estado_nuevo]} · {evento.revisor_nombre ?? "Sistema/conductor"}
              </p>
              {evento.motivo && <p className="mt-2 rounded-lg bg-ui-muted px-3 py-2 font-body text-xs text-ui-fg-muted">{evento.motivo}</p>}
            </div>
          ))}
        </div>
      )}
    </SeccionAcordeon>
  );
}

export function ChatInternoDrawer({
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
