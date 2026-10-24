"use client";

import Link from "next/link";
import { useState } from "react";

interface PanelOperationalHealthProps {
  gpsActivo: boolean | null;
  gpsUltimaSenal?: Date | null;
  estaOnline: boolean;
  documentoBloqueante: boolean;
  documentoPorVencer: boolean;
  conductorEstado?: string | null;
}

function formatoHace(date: Date | null | undefined) {
  if (!date) return null;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace segundos";
  if (mins === 1) return "hace 1 min";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `hace ${hrs} h`;
}

function RequirementIcon({ type }: { type: "documentos" | "perfil" | "gps" | "conexion" }) {
  if (type === "documentos") {
    return (
      <svg className="size-6 sm:size-7 md:size-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Zm7 1.5L18.5 9H13V3.5ZM8 12h8v1.8H8V12Zm0 4h8v1.8H8V16Zm0-8h3v1.8H8V8Z" />
      </svg>
    );
  }
  if (type === "perfil") {
    return (
      <svg className="size-6 sm:size-7 md:size-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="7.5" r="4" />
        <path d="M4 20c0-3.8 3.5-6.5 8-6.5s8 2.7 8 6.5v1H4v-1Z" />
      </svg>
    );
  }
  if (type === "gps") {
    return (
      <>
        {/* En móvil muestra el icono GPS mira/target del prototipo móvil */}
        <svg className="size-6 sm:size-7 md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        {/* En desktop muestra el pin de ubicación relleno del prototipo web */}
        <svg className="hidden size-10 md:block" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.42 6.42 11.73 6.7 11.99a1.15 1.15 0 0 0 1.6 0c.28-.26 6.7-6.57 6.7-11.99C19.5 5.36 16.14 2 12 2Zm0 10.2a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z" />
        </svg>
      </>
    );
  }
  return (
    <svg className="size-6 sm:size-7 md:size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 8.82a15 15 0 0 1 20 0" />
      <path d="M5 12.859a10 10 0 0 1 14 0" />
      <path d="M8.5 16.429a5 5 0 0 1 7 0" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PanelStatusRow({
  gpsActivo,
  gpsUltimaSenal,
  estaOnline,
  documentoBloqueante,
  documentoPorVencer,
  conductorEstado,
}: PanelOperationalHealthProps) {
  const [sheetAbierto, setSheetAbierto] = useState(false);

  const docsOk = !documentoBloqueante;
  const vehiculoHabilitado =
    !conductorEstado || conductorEstado === "activo" || conductorEstado === "modo_prueba_supervisada";
  const gpsOk = gpsActivo !== false;

  const getDocumentoDesktopLabel = () => {
    if (documentoBloqueante) return "Pendientes";
    if (documentoPorVencer) return "Por vencer";
    return "Todo en orden";
  };

  const items = [
    {
      href: "/cuenta/documentos",
      type: "documentos" as const,
      label: "Documentos",
      shortLabel: "Docu",
      desktopValue: getDocumentoDesktopLabel(),
      detailValue:
        gpsUltimaSenal && !documentoBloqueante && !documentoPorVencer
          ? "Todo en orden"
          : getDocumentoDesktopLabel(),
      ok: docsOk && !documentoPorVencer,
      dot: !docsOk ? "bg-danger" : documentoPorVencer ? "bg-amber-500" : "bg-[#10B981]",
    },
    {
      href: "/cuenta/perfil",
      type: "perfil" as const,
      label: "Perfil",
      shortLabel: "Perfil",
      desktopValue: vehiculoHabilitado ? "Completo" : "En validación",
      detailValue: vehiculoHabilitado ? "Completo" : "En validación",
      ok: vehiculoHabilitado,
      dot: vehiculoHabilitado ? "bg-[#10B981]" : "bg-amber-500",
    },
    {
      href: "/cuenta",
      type: "gps" as const,
      label: "GPS",
      shortLabel: "GPS",
      desktopValue: gpsActivo === false ? "Inactivo" : "Activo",
      detailValue:
        gpsActivo === true
          ? gpsUltimaSenal
            ? `Activo · ${formatoHace(gpsUltimaSenal)}`
            : "Activo"
          : gpsActivo === false
            ? "Inactivo"
            : "Activo",
      ok: gpsOk,
      dot: gpsOk ? "bg-[#10B981]" : "bg-danger",
    },
    {
      href: null as string | null,
      type: "conexion" as const,
      label: "Conexión",
      shortLabel: "Conexión",
      desktopValue: estaOnline ? "Estable" : "Sin conexión",
      detailValue: estaOnline ? "Estable" : "Sin conexión",
      ok: estaOnline,
      dot: estaOnline ? "bg-[#10B981]" : "bg-danger",
    },
  ];

  const estadoGlobal =
    !docsOk || !vehiculoHabilitado || gpsActivo === false || !estaOnline ? "atencion" : "ok";

  return (
    <>
      <div
        className="driver-health-row grid grid-cols-4 gap-2 rounded-2xl bg-[#EFF4FA] p-2.5 sm:p-3 md:gap-4 md:bg-transparent md:p-0"
        role="status"
        aria-label="Salud operacional"
      >
        {items.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={() => setSheetAbierto(true)}
            className="group relative flex min-h-[84px] min-w-0 cursor-pointer flex-col items-center justify-center rounded-xl px-1 py-1.5 text-center transition hover:bg-white/80 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066FF] md:min-h-[140px] md:rounded-2xl md:border md:border-[#E2ECF8] md:bg-[#EDF3FB] md:px-4 md:py-5 md:hover:bg-[#E3EDF9] md:hover:shadow-xs"
            aria-label={`${it.label}: ${it.desktopValue}`}
          >
            <span className="relative flex size-12 sm:size-13 shrink-0 items-center justify-center rounded-2xl bg-[#D8F3E5] text-[#0D9668] md:static md:size-12 md:bg-transparent md:text-[#0066FF]">
              <RequirementIcon type={it.type} />
              <span
                className={`absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-2xs md:right-3 md:top-3 md:size-6 md:text-xs ${it.dot}`}
                aria-hidden="true"
              >
                ✓
              </span>
            </span>
            <span className="mt-1.5 max-w-full truncate px-0.5 font-body text-[11px] sm:text-xs font-bold leading-tight text-[#0A2342] md:hidden">
              {it.shortLabel}
            </span>
            <span className="mt-2 hidden font-display text-[15px] font-extrabold leading-tight text-[#0A2342] md:block">
              {it.label}
            </span>
            <span className="mt-1 hidden font-body text-xs font-medium leading-tight text-[#566889] md:block">
              {it.desktopValue}
            </span>
          </button>
        ))}
      </div>

      {/* BottomSheet / Modal detalle — se despliega al hacer tap/clic en el StatusRow */}
      {sheetAbierto && (
        <dialog
          open
          className="fixed inset-0 z-50 m-0 flex h-[100dvh] w-[100vw] max-h-none max-w-none items-end justify-center border-0 bg-transparent p-0 md:items-center"
          aria-modal="true"
          aria-labelledby="titulo-salud-sheet"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-[2px]"
            onClick={() => setSheetAbierto(false)}
            aria-label="Cerrar diálogo"
          />
          <div className="relative w-full max-w-md rounded-t-[1.75rem] border-t border-border/40 bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl md:rounded-3xl md:border md:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 md:hidden" aria-hidden="true" />
            <h2 id="titulo-salud-sheet" className="font-display text-base font-black text-[#0A2342]">
              Salud operacional
            </h2>
            <p className="mt-1 font-body text-sm leading-6 text-[#566889]">
              {estadoGlobal === "ok"
                ? "Todo listo para operar"
                : !docsOk
                  ? "Tienes documentos pendientes de revisión"
                  : gpsActivo === false
                    ? "GPS inactivo — verifica permisos"
                    : "Revisa tu conexión a internet"}
            </p>
            <ul className="mt-4 divide-y divide-slate-100">
              {items.map((it) => {
                const statusColor =
                  it.dot === "bg-[#10B981]"
                    ? "text-emerald-700"
                    : it.dot === "bg-danger"
                      ? "text-red-600"
                      : "text-amber-600";
                return (
                  <li key={it.label} className="flex min-h-[52px] items-center justify-between gap-3 px-2 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FB] text-[#0066FF]">
                        <RequirementIcon type={it.type} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-bold text-[#0A2342]">{it.label}</span>
                        <span className={`mt-0.5 block font-body text-[13px] leading-5 ${statusColor}`}>
                          {it.detailValue}
                        </span>
                      </div>
                    </div>
                    {it.href ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-slate-400" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 grid gap-2">
              {items
                .filter((it) => Boolean(it.href))
                .map((it) => (
                  <Link
                    key={it.label}
                    href={it.href!}
                    onClick={() => setSheetAbierto(false)}
                    className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-[#DCE8FC] bg-[#F5F9FF] px-4 py-2.5 font-display text-xs font-bold text-[#0057D9] transition hover:bg-[#E8F1FE]"
                  >
                    Ver {it.label}
                  </Link>
                ))}
              <button
                type="button"
                onClick={() => setSheetAbierto(false)}
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-display text-xs font-bold text-[#566889] transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
