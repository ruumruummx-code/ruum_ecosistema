import type { ReactNode } from "react";

export interface MobileHeaderProps {
  titulo: string;
  subtitulo?: string;
  enlaceAtras?: string;
  onAtras?: () => void;
  etiquetaAtras?: string;
  accionDerecha?: ReactNode;
  conBorde?: boolean;
  className?: string;
}

function IconoFlechaAtras() {
  return (
    <svg
      className="size-4.5 text-[#0a2342] dark:text-[#f6f8fb]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function MobileHeader({
  titulo,
  subtitulo,
  enlaceAtras,
  onAtras,
  etiquetaAtras = "Regresar",
  accionDerecha,
  conBorde = true,
  className = "",
}: MobileHeaderProps) {
  const tieneAtras = Boolean(enlaceAtras || onAtras);

  const botonAtrasClases =
    "flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-xs transition hover:bg-[#f6f8fb] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066ff] dark:border-[#2d4f73] dark:bg-[#0a2342] dark:hover:bg-[#0f2d52]";

  return (
    <header
      className={[
        "sticky top-0 z-20 flex min-h-[58px] items-center justify-between gap-3 bg-white/95 px-4 py-2.5 backdrop-blur-md transition-colors sm:px-6",
        "dark:bg-[#0a2342]/95",
        conBorde ? "border-b border-[#eef2f7] dark:border-[#1a3a5c]" : "",
        className,
      ].join(" ")}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {tieneAtras && (
          <>
            {enlaceAtras ? (
              <a
                href={enlaceAtras}
                className={botonAtrasClases}
                aria-label={etiquetaAtras}
              >
                <IconoFlechaAtras />
              </a>
            ) : (
              <button
                type="button"
                onClick={onAtras}
                className={botonAtrasClases}
                aria-label={etiquetaAtras}
              >
                <IconoFlechaAtras />
              </button>
            )}
          </>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold tracking-tight text-[#0a2342] leading-tight dark:text-[#f6f8fb] sm:text-[18px]">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="truncate text-[12px] font-medium text-[#4e5f80] dark:text-[#a8b5cc] mt-0.5">
              {subtitulo}
            </p>
          )}
        </div>
      </div>

      {accionDerecha && (
        <div className="shrink-0 flex items-center gap-2">{accionDerecha}</div>
      )}
    </header>
  );
}
