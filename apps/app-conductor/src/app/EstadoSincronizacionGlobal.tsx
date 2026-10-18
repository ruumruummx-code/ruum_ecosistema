"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { calcularSyncSnapshot, obtenerUltimoSyncSnapshot, publicarSyncSnapshot, SYNC_STATUS_EVENT, type GlobalSyncSnapshot } from "../lib/offline-sync-status";
import { recordOperationalEvent } from "../lib/observability";

const CLASES: Record<GlobalSyncSnapshot["status"], string> = {
  todo_sincronizado: "conductor-feedback conductor-feedback-success",
  sin_conexion: "conductor-feedback conductor-feedback-warning",
  pendientes: "conductor-feedback conductor-feedback-info",
  sincronizando: "conductor-feedback conductor-feedback-info",
  accion_requerida: "conductor-feedback conductor-feedback-warning",
  error_recuperable: "conductor-feedback conductor-feedback-warning",
  conflicto_revision: "conductor-feedback conductor-feedback-error"
};

// CODE-003 — mapeo de accion_requerida a UI accionable + observabilidad
function AccionRequeridaCTA({ snapshot }: { snapshot: GlobalSyncSnapshot }) {
  const isSesionExpirada = snapshot.status === "accion_requerida";
  const isConflicto = snapshot.status === "conflicto_revision";
  const isRelevante = snapshot.status === "accion_requerida" || snapshot.status === "conflicto_revision" || snapshot.status === "error_recuperable";

  useEffect(() => {
    if (!isRelevante) return;
    void recordOperationalEvent(isConflicto ? "sync_failure" : "session_expired", { status: snapshot.status, message: snapshot.message }, "warning");
  }, [snapshot.status, snapshot.message, isRelevante, isConflicto]);

  if (!isRelevante) return null;

  if (isSesionExpirada) {
    return (
      <Link href="/login?next=/panel" style={{ color: "var(--ruum-on-primary, #061529)" }} className="ml-3 inline-flex min-h-11 items-center rounded-lg bg-warning px-3 py-1 text-sm font-black hover:brightness-95">
        Iniciar sesión
      </Link>
    );
  }
  if (isConflicto) {
    return (
      <Link href="/viajes" className="ml-3 inline-flex min-h-11 items-center rounded-lg border border-current px-3 py-1 text-sm font-black hover:bg-white/10">
        Ver traslados
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => void publicarSyncSnapshot()} className="ml-3 inline-flex min-h-11 items-center rounded-lg border border-current px-3 py-1 text-sm font-bold hover:bg-white/10">
      Reintentar
    </button>
  );
}

export function EstadoSincronizacionGlobal() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [snapshot, setSnapshot] = useState<GlobalSyncSnapshot>(obtenerUltimoSyncSnapshot());

  useEffect(() => {
    setMounted(true);
    let cancelado = false;
    void calcularSyncSnapshot().then((next) => {
      if (!cancelado) setSnapshot(next);
    });
    const actualizar = (event: Event) => {
      setSnapshot((event as CustomEvent<GlobalSyncSnapshot>).detail);
    };
    const recalcular = () => void publicarSyncSnapshot();
    window.addEventListener(SYNC_STATUS_EVENT, actualizar);
    window.addEventListener("online", recalcular);
    window.addEventListener("offline", recalcular);
    window.addEventListener("ruum:evidencia-sincronizada", recalcular);
    window.addEventListener("ruum:telemetria-sincronizada", recalcular);
    window.addEventListener("ruum:evidencia-pendiente", recalcular);
    window.addEventListener("ruum:telemetria-pendiente", recalcular);
    return () => {
      cancelado = true;
      window.removeEventListener(SYNC_STATUS_EVENT, actualizar);
      window.removeEventListener("online", recalcular);
      window.removeEventListener("offline", recalcular);
      window.removeEventListener("ruum:evidencia-sincronizada", recalcular);
      window.removeEventListener("ruum:telemetria-sincronizada", recalcular);
      window.removeEventListener("ruum:evidencia-pendiente", recalcular);
      window.removeEventListener("ruum:telemetria-pendiente", recalcular);
    };
  }, []);

  if (!mounted || pathname === "/login" || pathname === "/registro" || pathname === "/cuenta" || pathname === "/cuenta/perfil" || pathname === "/cuenta/documentos" || pathname === "/cuenta/datos-bancarios" || pathname === "/cuenta/certificacion") return null;

  if (snapshot.status === "todo_sincronizado") return null;

  return (
    <div aria-live="polite" aria-atomic="true" className={`mx-auto mt-3 flex w-[min(100%-24px,1120px)] items-center justify-between gap-2 rounded-xl border px-4 py-2 font-body text-sm font-semibold ${CLASES[snapshot.status]}`}>
      <span>{snapshot.message}</span>
      <AccionRequeridaCTA snapshot={snapshot} />
    </div>
  );
}

