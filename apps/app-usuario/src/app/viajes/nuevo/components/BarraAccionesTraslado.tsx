"use client";

import { useEffect, useRef } from "react";
import { Button } from "@ruum/ui";

export interface BarraAccionesTrasladoProps {
  etiqueta: string;
  onContinuar: () => void;
  onAtras: () => void;
  deshabilitado?: boolean;
  ocupado?: boolean;
  precio?: string;
  desgloseId?: string;
  ayuda?: string;
}

export function BarraAccionesTraslado({ etiqueta, onContinuar, onAtras, deshabilitado, ocupado, precio, desgloseId, ayuda }: BarraAccionesTrasladoProps) {
  const barraRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const actualizar = () => {
      const teclado = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      barraRef.current?.style.setProperty("--wizard-keyboard-offset", `${teclado}px`);
    };
    actualizar();
    viewport.addEventListener("resize", actualizar);
    viewport.addEventListener("scroll", actualizar);
    return () => {
      viewport.removeEventListener("resize", actualizar);
      viewport.removeEventListener("scroll", actualizar);
    };
  }, []);

  return (
    <section ref={barraRef} className="user-wizard-actions" aria-label="Acciones del traslado">
      <div className="user-wizard-actions-inner">
        {precio && (
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="text-base font-bold" aria-live="polite">{precio}</p>
            {desgloseId && <a href={`#${desgloseId}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--user-color-action)] underline underline-offset-2">Ver desglose</a>}
          </div>
        )}
        <div className="flex items-center gap-3">
          <button type="button" disabled={ocupado} onClick={onAtras} className="min-h-12 shrink-0 rounded-xl px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">Atrás</button>
          <Button type="button" onClick={onContinuar} disabled={deshabilitado || ocupado} aria-busy={ocupado} aria-describedby={ayuda ? "wizard-acciones-ayuda" : undefined} className="user-wizard-primary min-h-12 flex-1">{etiqueta}</Button>
        </div>
        {ayuda && <p id="wizard-acciones-ayuda" className="text-xs text-[var(--user-color-muted)]">{ayuda}</p>}
      </div>
    </section>
  );
}
