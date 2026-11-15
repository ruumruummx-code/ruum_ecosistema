import type { ReactNode } from "react";
import { cn } from "./cn";

/** Encabezado de pantalla: mismo patrón en móvil y escritorio. */
export function PageHeader({
  titulo,
  descripcion,
  acciones,
  className,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ui-fg lg:text-3xl">{titulo}</h1>
        {descripcion && <p className="mt-1 hidden text-sm text-ui-fg-muted sm:block">{descripcion}</p>}
      </div>
      {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
    </header>
  );
}
