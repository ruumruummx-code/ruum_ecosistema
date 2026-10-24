"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { calcularSyncSnapshot, obtenerUltimoSyncSnapshot, publicarSyncSnapshot, SYNC_STATUS_EVENT, type GlobalSyncSnapshot } from "../lib/offline-sync-status";
import { recordOperationalEvent } from "../lib/observability";
import {
  leerEvidenciasDescartadas,
  registrarEvidenciaDescartada,
  resolverEvidenciaDescartada,
  type EvidenciaDescartada
} from "../lib/evidencias-descartadas";

export function EstadoSincronizacionGlobal() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [snapshot, setSnapshot] = useState<GlobalSyncSnapshot>(obtenerUltimoSyncSnapshot());
  const [evidenciasDescartadas, setEvidenciasDescartadas] = useState<EvidenciaDescartada[]>([]);

  useEffect(() => {
    setMounted(true);
    let cancelado = false;
    void calcularSyncSnapshot().then((next) => {
      if (!cancelado) setSnapshot(next);
    });
    void leerEvidenciasDescartadas().then((items) => {
      if (!cancelado) setEvidenciasDescartadas(items);
    });
    const actualizar = (event: Event) => {
      setSnapshot((event as CustomEvent<GlobalSyncSnapshot>).detail);
    };
    const onEvidenciaDescartada = (event: Event) => {
      const detalle = (event as CustomEvent<EvidenciaDescartada>).detail;
      if (!detalle) return;
      void registrarEvidenciaDescartada(detalle);
      setEvidenciasDescartadas((prev) => {
        if (prev.some((e) => e.localId === detalle.localId)) return prev;
        return [...prev, detalle];
      });
    };
    const recalcular = () => void publicarSyncSnapshot();
    window.addEventListener(SYNC_STATUS_EVENT, actualizar);
    window.addEventListener("ruum:evidencia-descartada", onEvidenciaDescartada);
    window.addEventListener("online", recalcular);
    window.addEventListener("offline", recalcular);
    window.addEventListener("ruum:evidencia-sincronizada", recalcular);
    window.addEventListener("ruum:telemetria-sincronizada", recalcular);
    window.addEventListener("ruum:evidencia-pendiente", recalcular);
    window.addEventListener("ruum:telemetria-pendiente", recalcular);
    return () => {
      cancelado = true;
      window.removeEventListener(SYNC_STATUS_EVENT, actualizar);
      window.removeEventListener("ruum:evidencia-descartada", onEvidenciaDescartada);
      window.removeEventListener("online", recalcular);
      window.removeEventListener("offline", recalcular);
      window.removeEventListener("ruum:evidencia-sincronizada", recalcular);
      window.removeEventListener("ruum:telemetria-sincronizada", recalcular);
      window.removeEventListener("ruum:evidencia-pendiente", recalcular);
      window.removeEventListener("ruum:telemetria-pendiente", recalcular);
    };
  }, []);

  useEffect(() => {
    const relevante = ["accion_requerida", "conflicto_revision", "error_recuperable"].includes(snapshot.status);
    if (!relevante) return;
    void recordOperationalEvent(snapshot.status === "conflicto_revision" ? "sync_failure" : "session_expired", { status: snapshot.status, message: snapshot.message }, "warning");
  }, [snapshot.status, snapshot.message]);

  if (!mounted || pathname === "/login" || pathname === "/registro" || pathname === "/cuenta" || pathname === "/cuenta/perfil" || pathname === "/cuenta/documentos" || pathname === "/cuenta/datos-bancarios" || pathname === "/cuenta/certificacion") return null;

  if (evidenciasDescartadas.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {evidenciasDescartadas.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto mt-3 flex w-[min(100%-24px,1120px)] flex-col gap-2 rounded-xl border border-[var(--ruum-error)]/40 bg-[var(--ruum-error-bg)] p-3 font-body text-sm text-[var(--ruum-error-text)]"
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true">⚠️</span>
              <span>Evidencia fotográfica descartada ({evidenciasDescartadas.length})</span>
            </span>
            <span className="text-xs uppercase tracking-wider opacity-80">Atención requerida</span>
          </div>
          <div className="flex flex-col gap-1.5 text-xs">
            {evidenciasDescartadas.map((ev) => (
              <div key={ev.localId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/10 px-2.5 py-1.5">
                <span>
                  Traslado <strong>#{ev.trasladoId.slice(0, 8)}</strong> · Ángulo: <strong>{ev.angulo || "General"}</strong> ({ev.razon === "ttl_expirado" ? "Expiró tras 7 días sin red" : "Superó 15 reintentos"})
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/viajes/${ev.trasladoId}`}
                    className="font-bold underline hover:opacity-80"
                  >
                    Ver viaje
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await resolverEvidenciaDescartada(ev.localId);
                      setEvidenciasDescartadas((prev) => prev.filter((d) => d.localId !== ev.localId));
                    }}
                    className="rounded bg-black/20 px-2 py-0.5 text-xs font-semibold hover:bg-black/30"
                  >
                    Descartar aviso
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

