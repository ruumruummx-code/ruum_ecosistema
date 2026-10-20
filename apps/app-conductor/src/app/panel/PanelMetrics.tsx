"use client";

import Link from "next/link";

interface PanelMetricsProps {
  gananciasHoy: number;
  trasladosHoy: number;
}

function DineroIcono() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M12 9v6m2-4.4c-.4-.45-1-.7-1.7-.7-.95 0-1.7.45-1.7 1.2 0 1.9 3.4.65 3.4 2.5 0 .8-.75 1.3-1.7 1.3-.75 0-1.4-.3-1.85-.8" /></svg>;
}

function AutoIcono() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 17 1.5-7h11L19 17" /><path d="M4 17h16v3H4zM8 10l1.3-3h5.4l1.3 3" /><circle cx="7.5" cy="18.5" r=".7" fill="currentColor" /><circle cx="16.5" cy="18.5" r=".7" fill="currentColor" /></svg>;
}

export function PanelMetrics({ gananciasHoy, trasladosHoy }: PanelMetricsProps) {
  const restantes = Math.max(0, 3 - trasladosHoy);
  const ganancias = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(gananciasHoy);

  return (
    <section className="driver-metrics grid grid-cols-2 gap-3" aria-label="Resumen del día">
      <article className="flex min-h-[145px] flex-col rounded-2xl bg-route-action/5 p-4">
        <div className="flex items-start justify-between gap-2"><span className="font-body text-[10px] font-black tracking-wide text-text-secondary">GANANCIAS DEL DÍA</span><span className="inline-flex size-10 items-center justify-center rounded-full bg-route-action/10 text-route-action"><DineroIcono /></span></div>
        <strong className="mt-2 font-display text-2xl font-black leading-none text-text-primary tabular-nums">{ganancias}</strong>
        <p className="mt-1 font-body text-xs text-text-secondary">{trasladosHoy === 0 ? "Sin cierres aún" : `${trasladosHoy} cierre${trasladosHoy === 1 ? "" : "s"} hoy`}</p>
        <Link href="/ganancias" className="mt-auto inline-flex min-h-11 items-end font-body text-sm font-bold text-route-action transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-route-action">Ver balance <span className="ml-2 text-lg leading-none">→</span></Link>
      </article>
      <article className="flex min-h-[145px] flex-col rounded-2xl bg-route-action/5 p-4">
        <div className="flex items-start justify-between gap-2"><span className="font-body text-[10px] font-black tracking-wide text-text-secondary">TRASLADOS HOY</span><span className="inline-flex size-10 items-center justify-center rounded-full bg-route-action/10 text-route-action"><AutoIcono /></span></div>
        <strong className="mt-2 font-display text-2xl font-black leading-none text-text-primary tabular-nums">{trasladosHoy} / 3</strong>
        <p className="mt-1 font-body text-xs text-text-secondary">{restantes === 0 ? "Bono disponible" : `Faltan ${restantes} para bono`}</p>
        <Link href="/viajes" className="mt-auto inline-flex min-h-11 items-end font-body text-sm font-bold text-route-action transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-route-action">Ver detalle <span className="ml-2 text-lg leading-none">→</span></Link>
      </article>
    </section>
  );
}
