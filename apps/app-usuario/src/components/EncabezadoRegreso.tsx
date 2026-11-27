import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button, cn } from "@ruum/ui/base";

/**
 * Barra fija con botón de regreso, título y subtítulo opcional.
 * Sustituye a `MobileHeader` de la entrada raíz de `@ruum/ui`.
 */
export function EncabezadoRegreso({
  titulo,
  subtitulo,
  enlaceAtras,
  etiquetaAtras = "Regresar",
  nivelTitulo = "h1",
  className,
}: {
  titulo: string;
  subtitulo?: string;
  enlaceAtras: string;
  etiquetaAtras?: string;
  /** `p` cuando la página ya tiene su propio encabezado principal. */
  nivelTitulo?: "h1" | "p";
  className?: string;
}) {
  const Titulo = nivelTitulo;
  return (
    <header className={cn("sticky top-0 z-20 flex min-h-14 items-center gap-3 bg-ui-card px-4 py-2.5 sm:px-6", className)}>
      <Button asChild variant="outline" size="icon-sm" className="rounded-full">
        <Link href={enlaceAtras} aria-label={etiquetaAtras}>
          <ChevronLeft aria-hidden="true" />
        </Link>
      </Button>
      <div className="min-w-0 flex-1">
        <Titulo className="truncate text-lg leading-tight font-bold tracking-tight text-ui-fg" title={titulo}>
          {titulo}
        </Titulo>
        {subtitulo && (
          <p className="mt-0.5 truncate text-xs font-medium text-ui-fg-muted" title={subtitulo}>
            {subtitulo}
          </p>
        )}
      </div>
    </header>
  );
}
