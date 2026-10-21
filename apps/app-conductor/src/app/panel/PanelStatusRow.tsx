"use client";

import Link from "next/link";
import { useState } from "react";
import { ConductorIcon, type ConductorIconName } from "@/components/icons";

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

export function PanelStatusRow({
  gpsActivo,
  gpsUltimaSenal,
  estaOnline,
  documentoBloqueante,
  documentoPorVencer,
  conductorEstado,
}: PanelOperationalHealthProps) {
  const [sheetAbierto, setSheetAbierto] = useState(false);

  const getDocumentoColor = () => {
    if (documentoBloqueante) return "bg-danger";
    if (documentoPorVencer) return "bg-warning";
    return "bg-emerald-500";
  };
  const getDocumentoLabel = () => {
    if (documentoBloqueante) return "Pendientes";
    if (documentoPorVencer) return "Por vencer";
    return "Vigentes";
  };
  const vehiculoHabilitado = conductorEstado === "activo" || conductorEstado === "modo_prueba_supervisada";

  const items = [
    {
      href: "/cuenta/documentos",
      icon: documentoBloqueante ? "alert" : "check",
      label: "Documentos",
      value: getDocumentoLabel(),
      dot: getDocumentoColor(),
    },
    {
      href: "/cuenta/perfil",
      icon: "user",
      label: "Perfil",
      value: vehiculoHabilitado ? "Habilitado" : "En validación",
      dot: vehiculoHabilitado ? "bg-emerald-500" : "bg-warning",
    },
    {
      href: "/cuenta",
      icon: "gps",
      label: "GPS",
      value:
        gpsActivo === true
          ? gpsUltimaSenal
            ? `Activo · ${formatoHace(gpsUltimaSenal)}`
            : "Activo"
          : gpsActivo === false
            ? "Inactivo"
            : "Verificando…",
      dot: gpsActivo ? "bg-emerald-500" : gpsActivo === false ? "bg-danger" : "bg-text-disabled",
    },
    {
      href: null as string | null,
      icon: "wifi",
      label: "Conexión",
      value: estaOnline ? "Conectado" : "Sin conexión",
      dot: estaOnline ? "bg-emerald-500" : "bg-danger",
    },
  ];

  function Icon({ name, className }: { name: string; className: string }) {
    const iconName = (name === "check" || name === "alert" || name === "user" || name === "gps") ? name : "wifi";
    return <ConductorIcon name={iconName as ConductorIconName} className={className} />;
  }

  const estadoGlobal =
    documentoBloqueante || !vehiculoHabilitado || gpsActivo === false || !estaOnline ? "atencion" : "ok";

  return (
    <>
      <div className="driver-health-row grid grid-cols-4 gap-2 rounded-2xl bg-route-action/[0.045] p-3" role="status" aria-label="Salud operacional">
        {items.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={() => setSheetAbierto(true)}
            className="relative flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl transition hover:bg-surface/80 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-route-action"
            aria-label={`${it.label}: ${it.value}`}
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Icon name={it.icon} className="size-7" />
            </span>
            <span className="max-w-full truncate px-0.5 text-[11px] font-bold leading-none text-text-primary">
              {it.label === "Documentos" ? "Docu" : it.label}
            </span>
            <span className={`absolute right-1 top-1 flex size-5 items-center justify-center rounded-full border-2 border-surface text-[11px] font-black text-white ${it.dot}`} aria-hidden>✓</span>
          </button>
        ))}
      </div>

      {/* BottomSheet detalle — se despliega solo al hacer tap en el StatusRow */}
      {sheetAbierto && (
        <dialog
          open
          className="fixed inset-0 z-50 m-0 flex h-[100dvh] w-[100vw] max-h-none max-w-none items-end justify-center border-0 bg-transparent p-0"
          aria-modal="true"
          aria-labelledby="titulo-salud-sheet"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setSheetAbierto(false)}
            aria-label="Cerrar diálogo"
          />
          <div className="relative w-full max-w-md rounded-t-[1.75rem] border-t border-border/40 bg-surface-elevated p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl animate-slideUp">
            <div className="mx-auto h-1 w-10 rounded-full bg-border/60 mb-4" aria-hidden />
            <h2 id="titulo-salud-sheet" className="font-display text-base font-black text-text-primary">
              Salud operacional
            </h2>
            <p className="mt-1 font-body text-sm leading-6 text-text-secondary">
              {estadoGlobal === "ok"
                ? "Todo listo para operar"
                : documentoBloqueante
                  ? "Tienes documentos pendientes de revisión"
                  : gpsActivo === false
                    ? "GPS inactivo — verifica permisos"
                    : "Revisa tu conexión a internet"}
            </p>
            <ul className="mt-4 divide-y divide-border/10">
              {items.map((it) => {
                const dotColor = it.dot === "bg-emerald-500" ? "text-emerald-700" : it.dot === "bg-danger" ? "text-red-600" : it.dot === "bg-warning" ? "text-amber-600" : "text-text-tertiary";
                return (
                  <li key={it.label} className="flex items-center justify-between gap-3 px-3 py-3 min-h-[52px]">
                    <div className="flex items-center gap-2.5">
                      <span className={`size-8 shrink-0 rounded-full border border-border/30 flex items-center justify-center ${it.dot}`}>
                        <Icon name={it.icon} className="size-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-display text-sm font-bold text-text-primary">{it.label}</span>
                        <span className={`block font-body text-xs leading-5 mt-0.5 ${dotColor}`}>
                          <span className={`size-1.5 rounded-full ${it.dot}`} aria-hidden />
                          {it.value}
                        </span>
                      </div>
                    </div>
                    {it.href ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-text-tertiary shrink-0" aria-hidden>
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
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 font-display text-xs font-bold text-route-action shadow-xs transition hover:bg-surface-elevated focus-visible:outline-none"
                  >
                    Ver {it.label}
                  </Link>
                ))}
              <button
                type="button"
                onClick={() => setSheetAbierto(false)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 font-display text-xs font-bold text-text-secondary transition hover:bg-surface-elevated focus-visible:outline-none"
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
