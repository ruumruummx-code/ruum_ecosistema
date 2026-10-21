"use client";

import Link from "next/link";
import { formatearMoneda } from "./useEarningsLedger";

interface EarningsTimelineProps {
  paso: number;
  tieneTraslados: boolean;
  tieneValidados: boolean;
  tienePagado: boolean;
  montoPendiente: number;
  proximoPayoutFecha: string;
  fechaDispersion: string;
}

export function EarningsTimeline({
  paso,
  tieneTraslados,
  tieneValidados,
  tienePagado,
  montoPendiente,
  proximoPayoutFecha,
  fechaDispersion
}: EarningsTimelineProps) {
  const pasos = [
    { n: 1, label: "Traslado", sub: tieneTraslados ? "Hecho" : "Pendiente" },
    { n: 2, label: "Validado", sub: tieneValidados ? "Revisado" : "En espera" },
    { n: 3, label: "Pagado", sub: tienePagado ? "Depositado" : "Próximo" }
  ];

  return (
    <div className="rounded-2xl border border-border/40 bg-surface-elevated p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-black tracking-widest uppercase text-text-tertiary">
          Ruta de tu pago
        </span>
        <span className="rounded-full border border-emerald-600/30 bg-emerald-50 px-2.5 py-1 font-body text-xs font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
          {paso === 3 ? "Pagado" : paso === 2 ? "En validación" : paso === 1 ? "Traslado completado" : "Sin actividad"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {pasos.map((s, idx) => {
          const activo = paso >= s.n;
          const esActual = paso === s.n;
          return (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <span className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-black ${activo ? "bg-signal border-signal text-on-primary" : "bg-surface border-border/40 text-text-tertiary"} ${esActual ? "ring-2 ring-signal/30" : ""}`}>
                  {activo ? "✓" : s.n}
                </span>
                <span className={`font-body text-xs font-bold leading-none ${activo ? "text-text-primary" : "text-text-tertiary"}`}>{s.label}</span>
                <span className="font-body text-xs leading-none text-text-tertiary">{s.sub}</span>
              </div>
              {idx < 2 && <div className={`hidden sm:block h-0.5 flex-1 ${paso > s.n ? "bg-signal" : "bg-border/30"}`} aria-hidden />}
            </div>
          );
        })}
      </div>
      {montoPendiente > 0 && (
        <div className="rounded-xl bg-signal/10 border border-signal/20 px-3 py-2.5 flex items-center justify-between gap-2">
          <span className="font-body text-xs font-bold text-text-primary flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="text-signal">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Tu pago {formatearMoneda(montoPendiente)} {tienePagado ? "depositado" : proximoPayoutFecha ? `llega ${proximoPayoutFecha}` : `se dispersa ${fechaDispersion}`}
          </span>
          <span className="font-body text-xs font-bold text-text-primary whitespace-nowrap">Notificación automática</span>
        </div>
      )}
    </div>
  );
}
