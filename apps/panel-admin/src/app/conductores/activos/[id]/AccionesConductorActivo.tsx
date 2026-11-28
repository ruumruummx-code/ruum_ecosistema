import { useState } from "react";
import { Aviso } from "@ruum/ui";
import type { Json } from "@ruum/shared/types";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { solicitarAprobacionAdmin } from "@ruum/api/services";
import { textoEstado, type ConductorRow } from "./ConductorActivoComponentes";

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

export function SuspenderConductor({
  conductor,
  compacto = false
}: {
  conductor: ConductorRow;
  onCompletado: () => void;
  compacto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className={`${compacto ? "rounded-lg px-4 py-2" : "rounded-lg px-4 py-2"} inline-flex min-h-10 items-center justify-center gap-2 border border-ui-line-strong bg-ui-card font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted`}
      >
        <IconoPausa />
        Suspender
      </button>
    );
  }

  async function ejecutar() {
    if (!motivo.trim()) return;
    setProcesando(true);
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      const aprobacionId = await solicitarAprobacionAdmin(cliente, {
        tipo: "sancion",
        capacidad: "conductores:sancionar",
        recurso: "conductores",
        recursoId: conductor.id,
        accion: "suspender",
        payload: { nuevo_estado: "suspendido", motivo: motivo.trim() } as Json
      });
      setAviso({
        tono: "info",
        texto: `Solicitud de aprobación #${aprobacionId.slice(0, 8).toUpperCase()} creada. Autorízala en Aprobaciones duales para ejecutar la suspensión.`
      });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo suspender.";
      setAviso({ tono: "danger", texto: mensaje });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspender-conductor-titulo"
      className="rounded-lg border border-ui-warning/30 bg-ui-warning-soft p-4"
    >
      <p id="suspender-conductor-titulo" className="flex items-center gap-2 font-body text-sm font-semibold text-ui-warning">
        <IconoPausa /> Suspender conductor
      </p>
      <div className="mt-3 rounded-lg border border-ui-line bg-ui-card px-3 py-2 font-body text-sm text-ui-fg-muted">
        <p>
          <span className="font-semibold text-ui-fg">Conductor:</span> {conductor.nombre}
        </p>
        <p>
          <span className="font-semibold text-ui-fg">Estado actual:</span> {textoEstado(conductor.estado)}
        </p>
        <p>
          <span className="font-semibold text-ui-fg">Efecto:</span> El conductor no podrá recibir nuevos traslados hasta que se reactive.
        </p>
      </div>
      {aviso && (
        <div className="mt-2">
          <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
      )}
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo de la suspensión"
        className="mt-3 w-full rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm"
        rows={2}
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={ejecutar}
          disabled={procesando || !motivo.trim()}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ui-warning px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50"
        >
          <IconoPausa />
          {procesando ? "Suspendiendo…" : "Confirmar suspensión"}
        </button>
        <button
          onClick={() => setAbierto(false)}
          disabled={procesando}
          className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium hover:bg-ui-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function ReactivarConductor({
  conductorId,
  compacto = false
}: {
  conductorId: string;
  onCompletado: () => void;
  compacto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className={`${compacto ? "rounded-lg px-4 py-2" : "rounded-lg px-4 py-2"} border border-ui-success/40 bg-ui-success/10 font-body text-sm font-medium text-ui-success hover:bg-ui-success/20`}
      >
        Reactivar
      </button>
    );
  }

  async function ejecutar() {
    if (!motivo.trim()) return;
    setProcesando(true);
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      const aprobacionId = await solicitarAprobacionAdmin(cliente, {
        tipo: "sancion",
        capacidad: "conductores:sancionar",
        recurso: "conductores",
        recursoId: conductorId,
        accion: "suspender",
        payload: { nuevo_estado: "activo", motivo: motivo.trim() } as Json
      });
      setAviso({
        tono: "info",
        texto: `Solicitud de aprobación #${aprobacionId.slice(0, 8).toUpperCase()} creada. Autorízala en Aprobaciones duales para ejecutar la reactivación.`
      });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo reactivar.";
      setAviso({ tono: "danger", texto: mensaje });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="rounded-lg border border-ui-success/30 bg-ui-success-soft p-4">
      <p className="font-body text-sm font-semibold text-ui-success">Reactivar conductor</p>
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo de la reactivación"
        className="mt-3 w-full rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm"
        rows={2}
      />
      {aviso && (
        <div className="mt-2">
          <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={ejecutar}
          disabled={procesando || !motivo.trim()}
          className="rounded-lg bg-ui-success px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50"
        >
          {procesando ? "Reactivando…" : "Confirmar reactivación"}
        </button>
        <button
          onClick={() => setAbierto(false)}
          disabled={procesando}
          className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function DarBajaConductor({
  conductor
}: {
  conductor: ConductorRow;
  onCompletado: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ui-danger/40 bg-ui-danger/10 px-4 py-2 font-body text-sm font-semibold text-ui-danger hover:bg-ui-danger/20"
      >
        <IconoBaja />
        Baja definitiva
      </button>
    );
  }

  async function ejecutar() {
    if (!motivo.trim() || confirmacion !== "BAJA") return;
    setProcesando(true);
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      const aprobacionId = await solicitarAprobacionAdmin(cliente, {
        tipo: "sancion",
        capacidad: "conductores:sancionar",
        recurso: "conductores",
        recursoId: conductor.id,
        accion: "suspender",
        payload: { nuevo_estado: "baja", motivo: motivo.trim() } as Json
      });
      setAviso({
        tono: "info",
        texto: `Solicitud de aprobación #${aprobacionId.slice(0, 8).toUpperCase()} creada. Autorízala en Aprobaciones duales para ejecutar la baja definitiva.`
      });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo dar de baja.";
      setAviso({ tono: "danger", texto: mensaje });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="baja-conductor-titulo"
      className="rounded-lg border border-ui-danger/30 bg-ui-danger-soft p-4"
    >
      <p id="baja-conductor-titulo" className="flex items-center gap-2 font-body text-sm font-semibold text-ui-danger">
        <IconoBaja /> Baja definitiva
      </p>
      <div className="mt-3 rounded-lg border border-ui-danger/20 bg-ui-card px-3 py-2 font-body text-sm text-ui-fg-muted">
        <p>
          <span className="font-semibold text-ui-fg">Conductor:</span> {conductor.nombre}
        </p>
        <p>
          <span className="font-semibold text-ui-fg">Estado actual:</span> {textoEstado(conductor.estado)}
        </p>
        <p>
          <span className="font-semibold text-ui-fg">Efecto:</span> La cuenta queda bloqueada permanentemente y no podrá operar traslados.
        </p>
      </div>
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo de la baja"
        className="mt-3 w-full rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm"
        rows={2}
      />
      {aviso && (
        <div className="mt-2">
          <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
      )}
      <label className="mt-3 flex flex-col gap-1">
        <span className="font-body text-xs font-medium text-ui-fg-muted">Escribe BAJA para confirmar</span>
        <input
          type="text"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          onClick={ejecutar}
          disabled={procesando || !motivo.trim() || confirmacion !== "BAJA"}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ui-danger px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50"
        >
          <IconoBaja />
          {procesando ? "Dando de baja…" : "Dar de baja definitivamente"}
        </button>
        <button
          onClick={() => setAbierto(false)}
          disabled={procesando}
          className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
