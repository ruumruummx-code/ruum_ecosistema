"use client";

import { useState } from "react";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { useEarningsLedger } from "./useEarningsLedger";
import { EarningsTimeline } from "./EarningsTimeline";
import { EarningsTabs } from "./EarningsTabs";
import { EarningsSummary } from "./EarningsSummary";
import { EarningsTripRow } from "./EarningsTripRow";
import { EarningsPayoutsSection } from "./EarningsPayoutsSection";
import { PanelSupportSheet } from "../panel/PanelSupportSheet";
import { InfoSheet } from "./InfoSheet";
import { estatusPayout, obtenerRangoPeriodo, formatearRango } from "./useEarningsLedger";

export default function PaginaGanancias() {
  const {
    datosBancarios,
    payouts,
    traslados,
    error,
    cargando,
    periodoActivo,
    offsetPeriodo,
    viajeExpandido,
    soporteAbierto,
    hoy,
    registrosTraslados,
    rangoActual,
    TrasladosFiltrados,
    payoutsFiltrados,
    resumen,
    fechaDispersion,
    sinDatosTotales,
    cambiarPeriodo,
    setOffsetPeriodo,
    setViajeExpandido,
    setSoporteAbierto
  } = useEarningsLedger();

  const [infoSheetLocal, setInfoSheetLocal] = useState<{ titulo: string; texto: string } | null>(null);

  const cambiarPeriodoLocal = (nuevo: typeof periodoActivo) => {
    setViajeExpandido(null);
    cambiarPeriodo(nuevo);
  };

  const tieneTraslados = TrasladosFiltrados.length > 0;
  const tieneValidados = TrasladosFiltrados.some(
    (v) => v.estatusEconomico === "en_validacion" || v.estatusEconomico === "confirmado" || v.estatusEconomico === "programado"
  );
  const tienePagado =
    payoutsFiltrados.some((p) => p.estado === "procesado") ||
    TrasladosFiltrados.some((v) => v.estatusEconomico === "pagado");
  const paso = tienePagado ? 3 : tieneValidados ? 2 : tieneTraslados ? 1 : 0;
  const proximoPayout = payoutsFiltrados.find((p) => p.estado !== "procesado");
  const montoPendiente = resumen.depositoAcumulado;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-12">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 border-b border-border/40 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href="/ganancias" className="font-body text-xs text-text-tertiary hover:underline">
              ← Volver a Mis ganancias
            </Link>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Mis ganancias y pagos
          </h1>
          <p className="mt-1 font-body text-sm text-text-secondary">
            Evidencia financiera de cada traslado. Trazabilidad y cierre documentado.
          </p>
          <div className="conductor-ruta-divider mt-3 max-w-[280px]" aria-hidden />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setSoporteAbierto(true)}
            aria-label="Ayuda y soporte operativo"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border/20 bg-surface-elevated text-text-primary hover:text-signal hover:border-signal/30 transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
          >
            <span className="font-display text-sm font-black" aria-hidden>
              ?
            </span>
          </button>
        </div>
      </header>

      {error && (
        <div className="mt-6">
          <Aviso tono="danger">{error}</Aviso>
        </div>
      )}

      {cargando && (
        <div className="mt-6 rounded-xl border border-border bg-surface-elevated p-8">
          <p className="font-body text-sm font-semibold text-text-secondary">Cargando expediente de ganancias...</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="h-20 animate-pulse rounded-xl bg-surface-elevated" />
            <div className="h-20 animate-pulse rounded-xl bg-surface-elevated" />
            <div className="h-20 animate-pulse rounded-xl bg-surface-elevated" />
            <div className="h-20 animate-pulse rounded-xl bg-surface-elevated" />
          </div>
        </div>
      )}

      {sinDatosTotales && (
        <div className="mt-6 rounded-xl border-route-action/35 bg-surface-elevated p-8">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-signal/40 bg-signal/10 font-display text-2xl text-signal" aria-hidden>
              💵
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-text-primary">Aún no hay ganancias registradas</h2>
            <p className="mt-2 font-body text-sm leading-6 text-text-tertiary">
              Completa tu primer traslado para comenzar a acumular ganancias. Al finalizar cada viaje, verás aquí el desglose detallado y el estatus de tu depósito bancario.
            </p>
          </div>
        </div>
      )}

      {!cargando && !sinDatosTotales && (
        <>
          {/* Ruta de pago */}
          <EarningsTimeline
            paso={paso}
            tieneTraslados={tieneTraslados}
            tieneValidados={tieneValidados}
            tienePagado={tienePagado}
            montoPendiente={montoPendiente}
            proximoPayoutFecha={proximoPayout?.periodo_fin ?? fechaDispersion}
            fechaDispersion={fechaDispersion}
          />

          {/* Pestañas de periodo */}
          <div className="mt-6 flex flex-col gap-3">
            <EarningsTabs periodoActivo={periodoActivo} onCambiarPeriodo={cambiarPeriodoLocal} />

            <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/40 bg-surface px-3 py-2.5">
              <button
                type="button"
                onClick={() => setOffsetPeriodo(offsetPeriodo - 1)}
                aria-label="Periodo anterior"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-primary hover:border-signal/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
              >
                ‹
              </button>
              <div className="text-center min-w-0">
                <p className="font-display text-sm font-bold text-text-primary truncate capitalize">
                  {formatearRango(periodoActivo, rangoActual.inicio, rangoActual.fin)}
                </p>
                <p className="font-body text-xs font-semibold text-text-tertiary">
                  {periodoActivo === "semana" ? "Dom – Sáb" : periodoActivo === "mes" ? "Mes completo" : "Año completo"} ·{" "}
                  {resumen.totalTraslados} viaje(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOffsetPeriodo(offsetPeriodo + 1)}
                aria-label="Periodo siguiente"
                disabled={offsetPeriodo >= 0 && obtenerRangoPeriodo(periodoActivo, hoy, offsetPeriodo + 1).inicio.getTime() > hoy.getTime()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-primary hover:border-signal/40 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
              >
                ›
              </button>
            </div>
          </div>

          {/* Resumen */}
          <EarningsSummary
            resumen={resumen}
            fechaDispersion={fechaDispersion}
            periodoActivo={periodoActivo}
            rangoActual={rangoActual}
            setInfoSheet={setInfoSheetLocal}
          />

          {/* Desglose por viaje */}
          <section className="mt-6" aria-label="Desglose por viaje">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-text-primary">Desglose por viaje</h2>
              <span className="rounded-full bg-surface-elevated border border-border px-2.5 py-1 font-body text-xs font-bold text-text-tertiary tabular-nums">
                {TrasladosFiltrados.length} traslado(s)
              </span>
            </div>

            {TrasladosFiltrados.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-border bg-surface p-8 text-center font-body text-sm text-text-tertiary">
                No hay traslados en este periodo ({formatearRango(periodoActivo, rangoActual.inicio, rangoActual.fin)}).
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                {TrasladosFiltrados.map((viaje) => (
                  <EarningsTripRow
                    key={viaje.id}
                    viaje={viaje}
                    expandido={viajeExpandido}
                    setViajeExpandido={setViajeExpandido}
                    setInfoSheet={setInfoSheetLocal}
                  />
                ))}
              </div>
            )}

            {payoutsFiltrados.length > 0 && (
              <EarningsPayoutsSection
                payoutsFiltrados={payoutsFiltrados}
                estatusPayout={(p) => estatusPayout(p as any)}
              />
            )}
          </section>
        </>
      )}

      <PanelSupportSheet abierto={soporteAbierto} onCerrar={() => setSoporteAbierto(false)} />

      {infoSheetLocal && (
        <InfoSheet
          titulo={infoSheetLocal.titulo}
          texto={infoSheetLocal.texto}
          onCerrar={() => setInfoSheetLocal(null)}
        />
      )}
    </div>
  );
}
