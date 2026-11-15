"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

export interface ChipOpcion<T extends string> {
  id: T;
  etiqueta: string;
  conteo?: number;
}

/**
 * Grupo de filtros de selección única (botones con aria-pressed).
 * Teclado: flechas, Inicio y Fin mueven el foco y seleccionan.
 */
export function ChipGroup<T extends string>({
  opciones,
  valor,
  onCambio,
  etiqueta,
  className,
  fin,
}: {
  opciones: ChipOpcion<T>[];
  valor: T;
  onCambio: (id: T) => void;
  etiqueta: string;
  className?: string;
  fin?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  function teclado(e: KeyboardEvent) {
    const botones = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button[data-chip]") ?? []);
    const i = botones.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const destino =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % botones.length
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + botones.length) % botones.length
      : e.key === "Home" ? 0
      : e.key === "End" ? botones.length - 1
      : -1;
    if (destino < 0) return;
    e.preventDefault();
    botones[destino]?.focus();
    const id = botones[destino]?.dataset.chip as T | undefined;
    if (id) onCambio(id);
  }
  return (
    <div
      ref={ref}
      role="group"
      aria-label={etiqueta}
      onKeyDown={teclado}
      className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]", className)}
    >
      {opciones.map(({ id, etiqueta: texto, conteo }) => {
        const activo = id === valor;
        return (
          <button
            key={id}
            type="button"
            data-chip={id}
            aria-pressed={activo}
            tabIndex={activo ? 0 : -1}
            onClick={() => onCambio(id)}
            className={cn(
              "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring",
              activo
                ? "border-ui-fg bg-ui-fg text-ui-card"
                : "border-ui-line bg-ui-card text-ui-fg-muted hover:border-ui-line-strong hover:text-ui-fg",
            )}
          >
            {texto}
            {conteo !== undefined && (
              <span className={cn("tabular-nums text-xs", activo ? "opacity-80" : "text-ui-fg-muted")}>{conteo}</span>
            )}
          </button>
        );
      })}
      {fin}
    </div>
  );
}
