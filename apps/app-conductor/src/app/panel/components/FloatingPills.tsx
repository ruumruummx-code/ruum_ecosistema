"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Píldoras flotantes superpuestas sobre el mapa. Agrupan las métricas clave
 * (ganancias, traslados, salud operacional) en chips táctiles. Al hacer tap
 * en una píldora se despliega el desglose detallado como expansión inline
 * (mobile-first, sin desplazar el mapa).
 */
interface FloatingPillsProps {
  gananciasHoy: number;
  trasladosHoy: number;
  gpsActivo: boolean | null;
  estaOnline: boolean;
  documentoBloqueante: boolean;
  documentoPorVencer: boolean;
}

type PillKey = "ganancias" | "traslados" | "salud";

export function FloatingPills({
  gananciasHoy,
  trasladosHoy,
  gpsActivo,
  estaOnline,
  documentoBloqueante,
  documentoPorVencer
}: FloatingPillsProps) {
  const [pillSeleccionada, setPillSeleccionada] = useState<PillKey | null>(null);

  const formatoMoneda = (v: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v);

  const saludEstado = (() => {
    if (documentoBloqueante) return { label: "Revisión", color: "bg-danger text-danger" as string, dot: "bg-danger" as string };
    if (documentoPorVencer || gpsActivo === false) return { label: "Atención", color: "bg-warning text-warning" as string, dot: "bg-warning" as string };
    if (!estaOnline) return { label: "Sin conexión", color: "bg-danger text-danger" as string, dot: "bg-danger" as string };
    return { label: "Todo listo", color: "bg-emerald-500 text-emerald-600 dark:text-emerald-400" as string, dot: "bg-emerald-500" as string };
  })();

  const saludDetalle = (() => {
    if (documentoBloqueante) return "Tienes documentos pendientes de revisión. Ve a tu cuenta para regularizarlos.";
    if (documentoPorVencer) return "Un documento está por vencer. Renóvalo antes de que expire.";
    if (gpsActivo === false) return "El GPS está inactivo. Actívalo para recibir traslados.";
    if (!estaOnline) return "Estás sin conexión. Los datos se sincronizarán al volver la red.";
    return "Documentos, GPS y conexión en orden. Puedes operar con normalidad.";
  })();

  return (
    <div className="w-full px-4 pointer-events-auto">
      {/* Fila de píldoras flotantes */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          type="button"
          onClick={() => setPillSeleccionada(pillSeleccionada === "ganancias" ? null : "ganancias")}
          aria-pressed={pillSeleccionada === "ganancias"}
          aria-label="Desglose de ganancias del día"
          className="flex-1 min-w-[110px] rounded-xl border border-border/20 bg-surface px-3 py-3 flex flex-col items-start gap-1 shadow-sm transition-all hover:bg-surface-elevated focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
        >
          <span className="text-text-tertiary text-[10px] font-extrabold uppercase tracking-wider leading-none">Ganancias hoy</span>
          <span className="font-display text-lg font-black text-text-primary leading-none tabular-nums">{formatoMoneda(gananciasHoy)}</span>
          <span className="ml-auto text-[10px] font-bold text-route-action uppercase tracking-wider">Ver →</span>
        </button>

        <button
          type="button"
          onClick={() => setPillSeleccionada(pillSeleccionada === "traslados" ? null : "traslados")}
          aria-pressed={pillSeleccionada === "traslados"}
          aria-label="Desglose de traslados del día"
          className="flex-1 min-w-[110px] rounded-xl border border-border/20 bg-surface px-3 py-3 flex flex-col items-start gap-1 shadow-sm transition-all hover:bg-surface-elevated focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
        >
          <span className="text-text-tertiary text-[10px] font-extrabold uppercase tracking-wider leading-none">Traslados hoy</span>
          <span className="font-display text-lg font-black text-text-primary leading-none tabular-nums">{trasladosHoy}</span>
          <span className="ml-auto text-[10px] font-bold text-route-action uppercase tracking-wider">Ver →</span>
        </button>

        <button
          type="button"
          onClick={() => setPillSeleccionada(pillSeleccionada === "salud" ? null : "salud")}
          aria-pressed={pillSeleccionada === "salud"}
          aria-label={`Estado de salud operacional: ${saludEstado.label}`}
          className={`flex-1 min-w-[110px] rounded-xl border border-border/20 bg-surface px-3 py-3 flex flex-col items-start gap-1 shadow-sm transition-all hover:bg-surface-elevated focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action ${pillSeleccionada === "salud" ? "bg-signal/10 border-signal" : ""}`}
        >
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${saludEstado.dot}`} aria-hidden />
            <span className="text-text-tertiary text-[10px] font-extrabold uppercase tracking-wider leading-none">Salud</span>
          </div>
          <span className={`font-display text-lg font-bold text-text-primary leading-none ${saludEstado.color.split(" ")[0]}`}>{saludEstado.label}</span>
        </button>
      </div>

      {/* Expansión de desglose (acordeón mobile-first) */}
      {pillSeleccionada && (
        <div className="rounded-xl border border-border/20 bg-surface-elevated px-4 py-4 shadow-sm animate-fadeIn">
          {pillSeleccionada === "ganancias" && (
            <>
              <h3 className="font-display text-sm font-bold text-text-primary mb-2">Desglose de ganancias</h3>
              <div className="flex justify-between items-center mb-1">
                <span className="font-body text-sm text-text-secondary">Ganancias cerradas hoy</span>
                <span className="font-display text-sm font-black text-text-primary tabular-nums">{formatoMoneda(gananciasHoy)}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-body text-sm text-text-secondary">Traslados cerrados</span>
                <span className="font-display text-sm font-black text-text-primary tabular-nums">{trasladosHoy}</span>
              </div>
              {trasladosHoy > 0 && (
                <div className="flex justify-between items-center mb-3">
                  <span className="font-body text-sm text-text-secondary">Promedio por traslado</span>
                  <span className="font-display text-sm font-black text-text-primary tabular-nums">{formatoMoneda(Math.round(gananciasHoy / trasladosHoy))}</span>
                </div>
              )}
              <Link
                href="/ganancias"
                className="inline-flex items-center gap-1 text-xs font-bold text-route-action hover:underline min-h-11 rounded-lg px-2 -mx-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
              >
                Ver balance completo <span aria-hidden>→</span>
              </Link>
            </>
          )}
          {pillSeleccionada === "traslados" && (
            <>
              <h3 className="font-display text-sm font-bold text-text-primary mb-2">Desglose de traslados</h3>
              <div className="flex justify-between items-center mb-1">
                <span className="font-body text-sm text-text-secondary">Traslados completados hoy</span>
                <span className="font-display text-sm font-black text-text-primary tabular-nums">{trasladosHoy}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-body text-sm text-text-secondary">Ganancias acumuladas</span>
                <span className="font-display text-sm font-black text-text-primary tabular-nums">{formatoMoneda(gananciasHoy)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${trasladosHoy >= 3 ? "bg-emerald-500" : "bg-text-disabled"}`} aria-hidden />
                <span className="font-body text-sm text-text-secondary">
                  {trasladosHoy >= 3 ? "¡Bono en camino!" : `Faltan ${Math.max(0, 3 - trasladosHoy)} para el bono de $100`}
                </span>
              </div>
              <Link
                href="/viajes"
                className="inline-flex items-center gap-1 text-xs font-bold text-route-action hover:underline min-h-11 rounded-lg px-2 -mx-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
              >
                Ver bandeja de traslados <span aria-hidden>→</span>
              </Link>
            </>
          )}
          {pillSeleccionada === "salud" && (
            <>
              <h3 className="font-display text-sm font-bold text-text-primary mb-2">Salud operacional</h3>
              <div className="flex items-start gap-3 mb-3">
                <span className={`size-2.5 rounded-full ${saludEstado.dot} shrink-0 mt-0.5`} aria-hidden />
                <div>
                  <p className="font-body text-sm text-text-secondary">{saludDetalle}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-2 py-2 rounded-lg border border-border/20 bg-surface">
                  <span className="font-body text-sm text-text-secondary">Documentos</span>
                  <span className={`font-body text-sm font-semibold ${documentoBloqueante ? "text-danger" : documentoPorVencer ? "text-warning" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {documentoBloqueante ? "Pendientes" : documentoPorVencer ? "Por vencer" : "Vigentes"}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-2 rounded-lg border border-border/20 bg-surface">
                  <span className="font-body text-sm text-text-secondary">GPS</span>
                  <span className={`font-body text-sm font-semibold ${gpsActivo === true ? "text-emerald-600 dark:text-emerald-400" : gpsActivo === false ? "text-danger" : "text-text-disabled"}`}>
                    {gpsActivo === true ? "Activo" : gpsActivo === false ? "Inactivo" : "Verificando…"}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-2 rounded-lg border border-border/20 bg-surface">
                  <span className="font-body text-sm text-text-secondary">Conexión</span>
                  <span className={`font-body text-sm font-semibold ${estaOnline ? "text-emerald-600 dark:text-emerald-400" : "text-danger"}`}>
                    {estaOnline ? "Conectado" : "Sin conexión"}
                  </span>
                </div>
              </div>
              <Link
                href="/cuenta"
                className="inline-flex items-center gap-1 text-xs font-bold text-route-action hover:underline min-h-11 rounded-lg px-2 -mx-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
              >
                Ir a mi cuenta <span aria-hidden>→</span>
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setPillSeleccionada(null)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-text-tertiary hover:text-text-primary min-h-11 rounded-lg px-2 -mx-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
          >
            <span aria-hidden>←</span> Cerrar desglose
          </button>
        </div>
      )}
    </div>
  );
}
