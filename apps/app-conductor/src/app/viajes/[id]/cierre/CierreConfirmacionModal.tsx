"use client";

import { useState } from "react";
import type { EvidenciaDescartada } from "@/lib/evidencias-descartadas";

interface CierreConfirmacionModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  procesando: boolean;
  evidenciasDescartadas?: EvidenciaDescartada[];
}

export function CierreConfirmacionModal({
  abierto,
  onCerrar,
  onConfirmar,
  procesando,
  evidenciasDescartadas = [],
}: CierreConfirmacionModalProps) {
  const [confirmadoConTorre, setConfirmadoConTorre] = useState(false);

  if (!abierto) return null;

  const tieneDescartes = evidenciasDescartadas.length > 0;
  const puedeConfirmar = !tieneDescartes || confirmadoConTorre;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-surface-elevated border border-border/40 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl animate-slideUp">
        <h3 className="font-display text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
          ⚠️ Confirmar Entrega
        </h3>
        <p className="font-body text-xs text-text-secondary leading-relaxed">
          ¿Estás seguro de finalizar el traslado y entregar el vehículo? Esta acción es definitiva y no se puede deshacer.
        </p>

        {tieneDescartes && (
          <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-xs text-red-200 flex flex-col gap-2">
            <div className="font-bold text-red-400 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Evidencia descartada ({evidenciasDescartadas.length})</span>
            </div>
            <p className="text-[11px] leading-tight text-red-300">
              Hay fotografías que no pudieron sincronizarse y fueron purgadas:
            </p>
            <ul className="list-disc list-inside text-[11px] text-red-200">
              {evidenciasDescartadas.map((e) => (
                <li key={e.localId}>
                  Ángulo: <strong>{e.angulo || "General"}</strong> ({e.razon === "ttl_expirado" ? "Expiró 7 días" : "Reintentos agotados"})
                </li>
              ))}
            </ul>
            <label className="flex items-start gap-2 mt-1 pt-2 border-t border-red-500/30 text-text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmadoConTorre}
                onChange={(e) => setConfirmadoConTorre(e.target.checked)}
                className="mt-0.5 rounded border-red-400 text-signal focus:ring-signal"
              />
              <span className="text-[11px] font-semibold text-amber-300">
                Notifiqué a Torre de Control y confirmo cerrar el traslado sin estas evidencias.
              </span>
            </label>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 min-h-11 rounded-xl bg-transparent border border-border/80 text-text-secondary hover:text-text-primary font-display text-xs font-black tracking-wider transition-colors cursor-pointer select-none"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={procesando || !puedeConfirmar}
            className="flex-[2] min-h-11 rounded-xl bg-signal hover:bg-signal/90 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-display text-xs font-black tracking-wider transition-colors cursor-pointer shadow-md select-none flex items-center justify-center focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            {procesando ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "SÍ, ENTREGAR"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
