import type { ReactNode } from "react";
import { AdminBadge } from "../../admin-components";
import type { TonoBadge } from "./PasaporteEmpresarialHelpers";

export function Kpi({
  etiqueta,
  valor,
  detalle,
  tono
}: {
  etiqueta: string;
  valor: ReactNode;
  detalle: string;
  tono: TonoBadge;
}) {
  return (
    <section className="rounded-lg border border-ui-line bg-ui-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-body text-sm font-medium text-ui-fg-muted">{etiqueta}</p>
        <AdminBadge tone={tono}>Hoy</AdminBadge>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ui-fg">{valor}</p>
      <p className="mt-1 font-body text-xs text-ui-fg-muted">{detalle}</p>
    </section>
  );
}

export function Dato({
  etiqueta,
  valor,
  mono = false
}: {
  etiqueta: string;
  valor?: ReactNode | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{etiqueta}</dt>
      <dd className={`mt-1 text-sm text-ui-fg ${mono ? "font-mono-ruum" : "font-body"}`}>{valor ?? "Pendiente"}</dd>
    </div>
  );
}
