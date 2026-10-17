"use client";

import { useEffect } from "react";
import { claveDia, esHoy, formatearDiaSelector, type DiaCalendario } from "../trips-utils";

/**
 * Bottom Sheet nativo (dialog) que despliega el calendario para seleccionar
 * la fecha de los traslados. Reemplaza al carrusel horizontal de días.
 */
interface CalendarioBottomSheetProps {
  abierto: boolean;
  onCerrar: () => void;
  calendario: DiaCalendario[];
  diaSeleccionado: string;
  diaHoy: string;
  onSelectDia: (clave: string) => void;
}

export function CalendarioBottomSheet({
  abierto,
  onCerrar,
  calendario,
  diaSeleccionado,
  diaHoy,
  onSelectDia
}: CalendarioBottomSheetProps) {
  useEffect(() => {
    if (!abierto) return;
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex h-[100dvh] w-[100vw] max-h-none max-w-none items-end justify-center border-0 bg-transparent p-0"
      aria-modal="true"
      aria-labelledby="titulo-calendario"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn cursor-default w-full h-full border-none outline-hidden"
        onClick={onCerrar}
        aria-label="Cerrar calendario"
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-md bg-surface-elevated rounded-t-[2rem] border-t border-border/40 p-6 flex flex-col gap-4 animate-slideUp shadow-2xl z-10">
        {/* Handle */}
        <div className="mx-auto w-10 h-1.5 rounded-full bg-border/40 mb-1" aria-hidden />

        <div className="flex justify-between items-center pb-2 border-b border-border/20">
          <h2 id="titulo-calendario" className="font-display text-lg font-bold text-text-primary">
            Seleccionar fecha
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-text-tertiary hover:text-text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer font-bold text-base rounded-full hover:bg-surface"
            aria-label="Cerrar calendario"
          >
            ✕
          </button>
        </div>

        <p className="font-body text-xs text-text-secondary leading-relaxed">
          Elige el día para consultar sus traslados y ofertas disponibles.
        </p>

        <div className="grid grid-cols-7 gap-1">
          {calendario.map(({ dia, Traslados }) => {
            const clave = claveDia(dia);
            const activo = clave === diaSeleccionado;
            const hoy = esHoy(clave);
            const tieneOfertas = Traslados.some((t) => t.tipo === "Ofertado");
            return (
              <button
                key={clave}
                type="button"
                onClick={() => {
                  onSelectDia(clave);
                  onCerrar();
                }}
                aria-pressed={activo}
                aria-label={formatearDiaSelector(dia) + (hoy ? ", hoy" : "") + (tieneOfertas ? ", con ofertas" : "")}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-xs font-bold transition-all min-h-[56px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action ${
                  activo
                    ? "bg-signal text-slate-950 shadow-md"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`}
              >
                <span className="font-display text-[11px] leading-none">
                  {new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "America/Mexico_City" }).format(dia)}
                </span>
                <span className="font-body text-[11px] leading-none tabular-nums">
                  {new Intl.DateTimeFormat("es-MX", { day: "numeric", timeZone: "America/Mexico_City" }).format(dia)}
                </span>
                {hoy && (
                  <span className="bg-route-soft text-route-action border border-route-action/30 text-[8px] font-extrabold px-1.5 py-0 rounded-md uppercase">
                    hoy
                  </span>
                )}
                {tieneOfertas && !activo && (
                  <span className="size-1.5 rounded-full bg-signal" aria-hidden />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCerrar}
          className="w-full min-h-[48px] mt-2 rounded-xl bg-surface hover:bg-surface-elevated border border-border/30 font-display text-sm font-bold text-text-primary transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </dialog>
  );
}
