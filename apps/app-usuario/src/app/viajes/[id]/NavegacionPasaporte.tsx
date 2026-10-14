"use client";

import { useRef } from "react";
import type { PestanaPasaporte } from "./PasaporteDigitalSegmentado";
import { IconoPinTab, IconoCamaraTab, IconoAutoTab, IconoReciboTab } from "./iconos-pasaporte";

const PESTANAS = [
  { id: "en_ruta", etiqueta: "En Ruta", Icono: IconoPinTab },
  { id: "fotos", etiqueta: "Fotos", Icono: IconoCamaraTab },
  { id: "unidad", etiqueta: "Unidad", Icono: IconoAutoTab },
  { id: "recibo", etiqueta: "Recibo", Icono: IconoReciboTab },
] as const;

export function NavegacionPasaporte({ id, activa, onCambiar }: { id: string; activa: PestanaPasaporte; onCambiar: (pestana: PestanaPasaporte) => void }) {
  const listaRef = useRef<HTMLDivElement>(null);
  return <div ref={listaRef} id={id} role="tablist" aria-label="Pestañas del Pasaporte Digital" className="user-passport-tabs grid grid-cols-4 gap-1.5 rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-1.5 shadow-sm">
    {PESTANAS.map((pestana, i) => <button key={pestana.id} type="button" role="tab" id={`tab-${pestana.id}`} aria-selected={activa === pestana.id} aria-controls={`panel-${pestana.id}`} tabIndex={activa === pestana.id ? 0 : -1}
      onClick={() => onCambiar(pestana.id)}
      onKeyDown={(e) => {
        const indice = e.key === "ArrowRight" ? (i + 1) % PESTANAS.length : e.key === "ArrowLeft" ? (i - 1 + PESTANAS.length) % PESTANAS.length : e.key === "Home" ? 0 : e.key === "End" ? PESTANAS.length - 1 : -1;
        if (indice < 0) return;
        e.preventDefault();
        onCambiar(PESTANAS[indice].id);
        (listaRef.current?.children[indice] as HTMLButtonElement | undefined)?.focus();
      }}
      className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-xs font-semibold ${activa === pestana.id ? "bg-[var(--user-color-action)] text-[var(--user-color-on-action)]" : "text-[var(--user-color-muted)] hover:bg-[var(--user-color-surface-soft)]"}`}>
      <pestana.Icono />{pestana.etiqueta}
    </button>)}
  </div>;
}
