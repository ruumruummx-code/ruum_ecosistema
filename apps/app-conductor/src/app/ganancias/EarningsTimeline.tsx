"use client";

import { formatearMoneda } from "./useEarningsLedger";

interface EarningsTimelineProps {
  paso: number;
  tieneTraslados: boolean;
  tieneValidados: boolean;
  tienePagado: boolean;
  montoPendiente: number | null;
  proximoPayoutFecha: string;
  fechaDispersion: string;
}

export function EarningsTimeline({
  paso,
  tieneTraslados,
  tieneValidados,
  tienePagado,
  montoPendiente,
  fechaDispersion
}: EarningsTimelineProps) {
  const pasos = [
    { n: 1, label: "Traslado", sub: tieneTraslados ? "Registrado" : "Pendiente" },
    { n: 2, label: "Devengo", sub: tieneValidados ? "Registrado" : "En espera" },
    { n: 3, label: "Pagado", sub: tienePagado ? "Verificado" : "Por validar" }
  ];

  return (
    <div className="rounded-lg border border-ui-line/40 bg-ui-muted p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-black tracking-widest uppercase text-ui-fg-muted">
          Ruta de tu pago
        </span>
        <span className="rounded-full border border-ui-success/30 bg-ui-success-soft px-2.5 py-1 font-body text-xs font-bold text-ui-success   ">
          {paso === 3 ? "Con pagos verificados" : paso === 2 ? "Devengo en validación" : paso === 1 ? "Actividad registrada" : "Sin actividad"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {pasos.map((s, idx) => {
          const activo = paso >= s.n;
          const esActual = paso === s.n;
          return (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <span className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-black ${activo ? "bg-ui-brand border-ui-brand text-ui-on-brand" : "bg-ui-card border-ui-line/40 text-ui-fg-muted"} ${esActual ? "ring-2 ring-ui-brand/30" : ""}`}>
                  {activo ? "✓" : s.n}
                </span>
                <span className={`font-body text-xs font-bold leading-none ${activo ? "text-ui-fg" : "text-ui-fg-muted"}`}>{s.label}</span>
                <span className="font-body text-xs leading-none text-ui-fg-muted">{s.sub}</span>
              </div>
              {idx < 2 && <div className={`hidden sm:block h-0.5 flex-1 ${paso > s.n ? "bg-ui-brand" : "bg-ui-line/30"}`} aria-hidden />}
            </div>
          );
        })}
      </div>
      {montoPendiente !== null && montoPendiente > 0 && (
        <div className="rounded-xl bg-ui-brand/10 border border-ui-brand/20 px-3 py-2.5 flex items-center justify-between gap-2">
          <span className="font-body text-xs font-bold text-ui-fg flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="text-ui-brand">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Devengo del periodo: {formatearMoneda(montoPendiente)}. Liquidación sujeta a validación financiera; fecha {fechaDispersion}.
          </span>
          <span className="font-body text-xs font-bold text-ui-fg whitespace-nowrap">Notificación automática</span>
        </div>
      )}
    </div>
  );
}
