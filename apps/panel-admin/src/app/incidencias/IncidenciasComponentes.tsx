"use client";

import type { ReactNode } from "react";
import { AdminButton } from "../admin-components";
import { AdminPanel } from "../admin-ui";

export function KpiIncidencia({
  etiqueta,
  valor,
  detalle,
  tono = "neutral"
}: {
  etiqueta: string;
  valor: number | string;
  detalle: string;
  tono?: "neutral" | "alerta" | "exito";
}) {
  const clase = tono === "alerta"
    ? "border-ui-danger/25 bg-ui-danger-soft"
    : tono === "exito"
      ? "border-ui-success/25 bg-ui-success-soft"
      : "border-ui-line bg-ui-card";

  return (
    <AdminPanel className={`p-4 ${clase}`}>
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{etiqueta}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-ui-fg">{valor}</p>
      <p className="mt-1 font-body text-xs text-ui-fg-muted">{detalle}</p>
    </AdminPanel>
  );
}

export function BadgeIncidencia({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex min-h-7 items-center gap-2 rounded-full border px-3 py-1 font-body text-xs font-semibold ${className}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

export function ChipFiltroIncidencia({
  activo,
  etiqueta,
  contador,
  onClick
}: {
  activo: boolean;
  etiqueta: string;
  contador: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={[
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 font-body text-sm font-semibold transition-colors",
        activo ? "border-ui-brand bg-ui-brand-soft text-ui-fg ring-1 ring-inset ring-ui-warning/20" : "border-ui-line bg-ui-card text-ui-fg-muted hover:border-ui-brand/45 hover:text-ui-fg"
      ].join(" ")}
    >
      <span>{etiqueta}</span>
      <span className="rounded-full bg-ui-muted px-2 py-0.5 font-mono-ruum text-xs text-ui-fg">{contador}</span>
    </button>
  );
}

export function EmptyIncidencias({ onLimpiar, onHistorial }: { onLimpiar: () => void; onHistorial: () => void }) {
  return (
    <section className="rounded-lg border border-dashed border-ui-line bg-ui-card px-6 py-10 text-center" aria-live="polite">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-ui-brand/25 bg-ui-brand-soft">
        <span className="block size-3 rounded-full bg-ui-brand" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold text-ui-fg">No hay incidencias abiertas bajo este criterio.</h2>
      <p className="mx-auto mt-2 max-w-md font-body text-sm text-ui-fg-muted">La bandeja queda limpia para este segmento operativo.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <AdminButton variant="secondary" onClick={onLimpiar}>Limpiar filtros</AdminButton>
        <AdminButton onClick={onHistorial}>Ver historial completo</AdminButton>
      </div>
    </section>
  );
}

export function FiltroSelect<T extends string>({
  label,
  value,
  opciones,
  onChange
}: {
  label: string;
  value: T;
  opciones: Array<{ valor: T; etiqueta: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex min-w-56 flex-col gap-1 font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-10 rounded-lg border border-ui-line bg-ui-card px-3 py-2 font-body text-sm font-semibold normal-case tracking-normal text-ui-fg outline-none transition-colors focus:border-ui-focus"
      >
        {opciones.map((item) => (
          <option key={item.valor} value={item.valor}>{item.etiqueta}</option>
        ))}
      </select>
    </label>
  );
}
