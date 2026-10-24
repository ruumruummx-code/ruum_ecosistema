"use client";

import Link from "next/link";

interface PanelMetricsProps {
  gananciasHoy: number;
  trasladosHoy: number;
}

function BolsaDineroMovilIcono() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.5 3h5l1.2 2.6c.2.4 0 .9-.4 1.1H8.7c-.4-.2-.6-.7-.4-1.1L9.5 3ZM7.8 8h8.4c2.4 2 3.8 4.9 3.8 8.1 0 2.7-2.1 4.9-4.8 4.9H8.8C6.1 21 4 18.8 4 16.1 4 12.9 5.4 10 7.8 8Zm4.2 3v1h-.5a1.8 1.8 0 0 0 0 3.6h1a.6.6 0 0 1 0 1.2H10v1.2h1.5v1h1v-1h.5a1.8 1.8 0 0 0 0-3.6h-1a.6.6 0 0 1 0-1.2H14V12h-1.5v-1h-1Z" />
    </svg>
  );
}

function BilleteraDesktopIcono() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-2h-4.5a3.5 3.5 0 1 1 0-7H22V8a3 3 0 0 0-3-3H4Zm13.5 5a1.5 1.5 0 1 0 0 3H22v-3h-4.5Z" />
    </svg>
  );
}

function AutoIcono({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.5 4.5A2.5 2.5 0 0 1 8.85 3h6.3a2.5 2.5 0 0 1 2.35 1.5L19.8 10H21a1 1 0 0 1 0 2h-.5v6.5a1.5 1.5 0 0 1-3 0V17h-11v1.5a1.5 1.5 0 0 1-3 0V12H3a1 1 0 1 1 0-2h1.2l2.3-5.5ZM7.1 10h9.8l-1.5-4a.8.8 0 0 0-.75-.5h-5.3a.8.8 0 0 0-.75.5L7.1 10Zm.4 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    </svg>
  );
}

export function PanelMetrics({ gananciasHoy, trasladosHoy }: PanelMetricsProps) {
  const restantes = Math.max(0, 3 - trasladosHoy);
  const ganancias = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(gananciasHoy);

  return (
    <section className="driver-metrics grid grid-cols-2 gap-3 md:gap-5" aria-label="Resumen del día">
      {/* Tarjeta 1: Ganancias */}
      <article className="flex min-h-[140px] flex-col rounded-2xl bg-[#F3F7FC] p-3.5 sm:p-4 md:min-h-[136px] md:flex-row md:items-center md:gap-5 md:border md:border-[#E4ECF7] md:bg-white md:p-5 md:shadow-[0_4px_16px_rgba(10,35,66,0.03)]">
        <span
          className="hidden size-15 shrink-0 items-center justify-center rounded-full bg-[#E3F7ED] text-[#10B981] md:inline-flex"
          aria-hidden="true"
        >
          <BilleteraDesktopIcono />
        </span>

        <div className="flex min-w-0 flex-1 flex-col h-full">
          <div className="flex items-start justify-between gap-1.5 md:block">
            <span className="font-body text-[10px] font-black tracking-wide text-[#566889] md:hidden">
              GANANCIAS DEL DÍA
            </span>
            <span className="hidden font-display text-sm font-bold text-[#0A2342] md:block">
              Ganancias de hoy
            </span>
            <span
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DCE8FC] text-[#0066FF] md:hidden"
              aria-hidden="true"
            >
              <BolsaDineroMovilIcono />
            </span>
          </div>

          <strong className="mt-1.5 font-display text-2xl font-black leading-none text-[#0A2342] tabular-nums md:mt-1 md:text-3xl">
            {ganancias}
          </strong>
          <p className="mt-1 font-body text-xs text-[#566889] md:text-[13px]">
            {trasladosHoy === 0 ? "Sin cierres aún" : `${trasladosHoy} cierre${trasladosHoy === 1 ? "" : "s"} hoy`}
          </p>
          <Link
            href="/ganancias"
            className="mt-auto inline-flex min-h-9 cursor-pointer items-end pt-2 font-body text-xs sm:text-sm font-bold text-[#0057D9] transition hover:text-[#0066FF] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF] md:min-h-8 md:pt-2.5"
          >
            <span>Ver balance</span>
            <span className="ml-1.5 text-base leading-none" aria-hidden="true">→</span>
          </Link>
        </div>
      </article>

      {/* Tarjeta 2: Traslados hoy */}
      <article className="flex min-h-[140px] flex-col rounded-2xl bg-[#F3F7FC] p-3.5 sm:p-4 md:min-h-[136px] md:flex-row md:items-center md:gap-5 md:border md:border-[#E4ECF7] md:bg-white md:p-5 md:shadow-[0_4px_16px_rgba(10,35,66,0.03)]">
        <span
          className="hidden size-15 shrink-0 items-center justify-center rounded-full bg-[#EEECFA] text-[#6366F1] md:inline-flex"
          aria-hidden="true"
        >
          <AutoIcono className="size-7" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col h-full">
          <div className="flex items-start justify-between gap-1.5 md:block">
            <span className="font-body text-[10px] font-black tracking-wide text-[#566889] md:hidden">
              TRASLADOS HOY
            </span>
            <span className="hidden font-display text-sm font-bold text-[#0A2342] md:block">
              Traslados hoy
            </span>
            <span
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DCE8FC] text-[#0066FF] md:hidden"
              aria-hidden="true"
            >
              <AutoIcono className="size-5" />
            </span>
          </div>

          <strong className="mt-1.5 font-display text-2xl font-black leading-none text-[#0A2342] tabular-nums md:mt-1 md:text-3xl">
            {trasladosHoy} / 3
          </strong>
          <p className="mt-1 font-body text-xs text-[#566889] md:text-[13px]">
            {restantes === 0 ? "Bono disponible" : `Faltan ${restantes} para bono`}
          </p>
          <Link
            href="/viajes"
            className="mt-auto inline-flex min-h-9 cursor-pointer items-end pt-2 font-body text-xs sm:text-sm font-bold text-[#0057D9] transition hover:text-[#0066FF] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF] md:min-h-8 md:pt-2.5"
          >
            <span>Ver detalle</span>
            <span className="ml-1.5 text-base leading-none" aria-hidden="true">→</span>
          </Link>
        </div>
      </article>
    </section>
  );
}
