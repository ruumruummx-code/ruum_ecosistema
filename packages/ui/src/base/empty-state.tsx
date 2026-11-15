import type { ReactNode } from "react";
import { cn } from "./cn";

export function EmptyState({
  icono,
  titulo,
  descripcion,
  accion,
  className,
}: {
  icono?: ReactNode;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div data-empty-state className={cn("flex flex-col items-center rounded-lg border border-dashed border-ui-line-strong bg-ui-card px-6 py-10 text-center", className)}>
      {icono && (
        <span aria-hidden="true" className="mb-4 flex size-12 items-center justify-center rounded-full bg-ui-brand-soft text-ui-brand-soft-fg [&_svg]:size-6">
          {icono}
        </span>
      )}
      <h2 className="text-base font-semibold text-ui-fg">{titulo}</h2>
      {descripcion && <p className="mt-1 max-w-sm text-sm text-ui-fg-muted">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}
