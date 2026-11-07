"use client";

import { useId, useRef, useState, type ReactNode, type KeyboardEvent } from "react";

export interface TabItem {
  id: string;
  etiqueta: ReactNode;
  conteo?: number;
  activo?: boolean;
  disabled?: boolean;
  motivoDeshabilitado?: string;
  contenido?: ReactNode;
}
export interface TabsProps {
  tabs: TabItem[];
  value?: string;
  idPrefix?: string;
  onSeleccion?: (id: string) => void;
  etiqueta?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
  panelClassName?: string;
  renderPanel?: (id: string) => ReactNode;
  /** Conserva estado local; los paneles inactivos siguen ocultos y fuera del foco. */
  mantenerMontados?: boolean;
}

/** Activación manual: flechas/Home/End enfocan; Enter/Space o clic seleccionan. */
export function Tabs({ tabs, value, idPrefix, onSeleccion, etiqueta = "Pestañas", orientation = "horizontal", className = "", panelClassName = "", renderPanel, mantenerMontados = false }: TabsProps) {
  const generatedId = useId();
  const instanceId = idPrefix || generatedId;
  const [internalValue, setInternalValue] = useState<string>();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const enabled = tabs.filter(t => !t.disabled);
  const requested = value ?? (tabs.some(t => t.activo !== undefined) ? tabs.find(t => t.activo)?.id : internalValue);
  const selected = enabled.find(t => t.id === requested)?.id ?? enabled[0]?.id;
  const roving = enabled.some(t => t.id === focusedId) ? focusedId : selected;
  const tabId = (id: string) => `${instanceId}-tab-${encodeURIComponent(id)}`;
  const panelId = (id: string) => `${instanceId}-panel-${encodeURIComponent(id)}`;
  if (new Set(tabs.map(t => t.id)).size !== tabs.length) throw new Error("Tabs: cada item requiere un id único dentro de la instancia");

  function select(id: string) {
    if (!enabled.some(t => t.id === id)) return;
    setInternalValue(id);
    onSeleccion?.(id);
  }
  function navigate(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    const forward = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const backward = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const index = enabled.findIndex(t => t.id === id);
    const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : event.key === forward ? (index + 1) % enabled.length : event.key === backward ? (index - 1 + enabled.length) % enabled.length : -1;
    if (next < 0 || !enabled[next]) return;
    event.preventDefault();
    buttons.current.get(enabled[next].id)?.focus();
  }
  if (tabs.length === 0) return null;
  return <div className="contents">
    <div role="tablist" aria-label={etiqueta} aria-orientation={orientation} className={`flex gap-2 overflow-x-auto p-2 ${orientation === "vertical" ? "flex-col" : ""} ${className}`}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusedId(null); }}>
      {tabs.map(t => {
        const active = selected === t.id;
        const classes = `flex min-h-[var(--ruum-touch)] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 font-body text-sm font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--ruum-focus)] ${t.disabled ? "cursor-not-allowed border-[var(--ruum-border)] bg-[var(--ruum-neutral-bg)] text-[var(--ruum-text-disabled)]" : active ? "border-transparent bg-[var(--ruum-action)] text-[var(--ruum-on-primary)]" : "border-[var(--ruum-border-input)] bg-[var(--ruum-surface)] text-[var(--ruum-text)]"}`;
        const content = <>{t.etiqueta}{typeof t.conteo === "number" && <span className="rounded-full px-1.5 py-0.5 text-xs tabular-nums">{t.conteo}</span>}{t.disabled && t.motivoDeshabilitado && <span className="text-xs">{t.motivoDeshabilitado}</span>}</>;
        return t.disabled
          ? <span key={t.id} id={tabId(t.id)} role="tab" aria-selected={false} aria-disabled="true" aria-controls={panelId(t.id)} className={classes}>{content}</span>
          : <button key={t.id} ref={element => { if (element) buttons.current.set(t.id, element); else buttons.current.delete(t.id); }} id={tabId(t.id)} type="button" role="tab" aria-selected={active} aria-controls={panelId(t.id)} tabIndex={roving === t.id ? 0 : -1} onFocus={() => setFocusedId(t.id)} onKeyDown={event => navigate(event, t.id)} onClick={() => select(t.id)} className={classes}>{content}</button>;
      })}
    </div>
    {tabs.map(t => <div key={t.id} id={panelId(t.id)} role="tabpanel" aria-labelledby={tabId(t.id)} hidden={selected !== t.id} style={selected !== t.id ? { display: "none" } : undefined} tabIndex={selected === t.id ? 0 : -1} className={panelClassName}>
      {(mantenerMontados || selected === t.id) ? (renderPanel ? renderPanel(t.id) : t.contenido) : null}
    </div>)}
  </div>;
}
