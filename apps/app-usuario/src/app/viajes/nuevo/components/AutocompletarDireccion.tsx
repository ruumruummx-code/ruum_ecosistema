"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { sugerirDireccionesAutocomplete } from "@/lib/mapbox";

type Sugerencia = Awaited<ReturnType<typeof sugerirDireccionesAutocomplete>>[number];

export function AutocompletarDireccion({ id, etiqueta, placeholder, valor, sugerencias, buscando, onChange, onSeleccionar }: {
  id: string;
  etiqueta: string;
  placeholder: string;
  valor: string;
  sugerencias: Sugerencia[];
  buscando: boolean;
  onChange: (valor: string) => void;
  onSeleccionar: (sugerencia: Sugerencia) => void;
}) {
  const listaId = useId();
  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState({ valor: "", indice: -1 });
  const activo = seleccion.valor === valor && seleccion.indice < sugerencias.length ? seleccion.indice : -1;
  const visible = abierto && !buscando && sugerencias.length > 0;
  const listaRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (visible && activo >= 0) listaRef.current?.children[activo]?.scrollIntoView?.({ block: "nearest" });
  }, [activo, visible]);
  function elegir(sugerencia: Sugerencia) {
    onSeleccionar(sugerencia);
    setAbierto(false);
    setSeleccion({ valor, indice: -1 });
  }
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">{etiqueta}</label>
      <div className="relative mt-2">
        <input id={id} role="combobox" value={valor} autoComplete="off" placeholder={placeholder}
          className="min-h-12 w-full rounded-xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] py-2.5 pl-3.5 pr-11 text-base text-[var(--user-color-primary)] placeholder:text-[var(--user-color-muted)] focus:outline-2 focus:outline-[var(--user-color-action)]"
          aria-autocomplete="list" aria-controls={visible ? listaId : undefined} aria-expanded={visible}
          aria-activedescendant={visible && activo >= 0 ? `${listaId}-${activo}` : undefined}
          aria-describedby={`${id}-estado`}
          onFocus={() => setAbierto(true)} onBlur={() => setAbierto(false)}
          onChange={(e) => { onChange(e.target.value); setAbierto(true); setSeleccion({ valor: e.target.value, indice: -1 }); }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Escape") { e.preventDefault(); setAbierto(false); return; }
            if (!buscando && sugerencias.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault(); setAbierto(true);
              setSeleccion({ valor, indice: e.key === "ArrowDown" ? (activo + 1) % sugerencias.length : (activo < 0 ? sugerencias.length - 1 : (activo - 1 + sugerencias.length) % sugerencias.length) });
            } else if (visible && e.key === "Enter" && activo >= 0) {
              e.preventDefault(); elegir(sugerencias[activo]);
            } else if (visible && (e.key === "Home" || e.key === "End")) {
              e.preventDefault(); setSeleccion({ valor, indice: e.key === "Home" ? 0 : sugerencias.length - 1 });
            }
          }}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--user-color-muted)]" aria-hidden="true">
          {buscando ? <span className="block size-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg>}
        </span>
      </div>
      {visible && <ul ref={listaRef} id={listaId} role="listbox" aria-label={`Sugerencias: ${etiqueta}`} className="mt-2 max-h-[min(12rem,30dvh)] overflow-y-auto overscroll-contain rounded-xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)]">
        {sugerencias.map((s, i) => <li id={`${listaId}-${i}`} key={`${s.textoCompleto}-${i}`} role="option" aria-selected={activo === i}
          onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(s)}
          className={`min-h-12 cursor-pointer px-3 py-3 text-sm ${activo === i ? "bg-[var(--user-color-brand-soft)] font-semibold" : "hover:bg-[var(--user-color-surface-soft)]"}`}>
          {s.textoCompleto}
        </li>)}
      </ul>}
      <p id={`${id}-estado`} role="status" className="mt-1 text-xs text-[var(--user-color-muted)]">{buscando ? "Buscando direcciones…" : visible ? `${sugerencias.length} sugerencias disponibles. Usa las flechas y Enter para elegir.` : "Escribe al menos 3 letras y elige una sugerencia."}</p>
    </div>
  );
}
