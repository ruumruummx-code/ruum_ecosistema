import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/** Grupo de indicadores en una sola tarjeta, separados por líneas (no tarjetas de colores). */
export function StatGroup({ className, ...props }: HTMLAttributes<HTMLDListElement>) {
  return (
    <dl
      className={cn(
        "grid divide-x divide-ui-line overflow-hidden rounded-lg border border-ui-line bg-ui-card shadow-ui-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Stat({ etiqueta, valor, icono, className }: { etiqueta: string; valor: ReactNode; icono?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 px-3 py-3 sm:px-5 sm:py-4", className)}>
      <dt className="flex items-center gap-1.5 truncate text-xs font-medium text-ui-fg-muted sm:text-sm">
        {icono && <span aria-hidden="true" className="hidden text-ui-fg-muted sm:inline-flex [&_svg]:size-4">{icono}</span>}
        {etiqueta}
      </dt>
      <dd className="truncate text-xl font-semibold tabular-nums tracking-tight text-ui-fg sm:text-2xl">{valor}</dd>
    </div>
  );
}
