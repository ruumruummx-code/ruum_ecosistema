import type { ReactNode } from "react";

export type MobileRowTonoIcono =
  | "base"
  | "verde"
  | "azul"
  | "ambar"
  | "rojo"
  | "morado"
  | "neutro";

export interface MobileRowProps {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  icono?: ReactNode;
  tonoIcono?: MobileRowTonoIcono;
  href?: string;
  enlaceComponente?: React.ComponentType<any>;
  linkComponent?: React.ComponentType<any>;
  onClick?: () => void;
  disabled?: boolean;
  badge?: ReactNode;
  derecha?: ReactNode;
  mostrarChevron?: boolean;
  destructivo?: boolean;
  conDivisor?: boolean;
  className?: string;
}

const TONO_ICONO_CLASES: Record<MobileRowTonoIcono, string> = {
  base: "bg-[#edf4fe] text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]",
  verde: "bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]",
  azul: "bg-[#e6f0ff] text-[#0066ff] dark:bg-[#0f2d52] dark:text-[#4d94ff]",
  ambar: "bg-[#fef4e6] text-[#765100] dark:bg-[#3d2e00] dark:text-[#ffc933]",
  rojo: "bg-[#fdeaea] text-[#9a2637] dark:bg-[#3d0f1a] dark:text-[#ff6b7a]",
  morado: "bg-[#f3eefb] text-[#5e3b8c] dark:bg-[#2b1945] dark:text-[#bf9ff0]",
  neutro: "bg-[#eff3f8] text-[#3b4c68] dark:bg-[#1a2e4a] dark:text-[#a8b5cc]",
};

function ChevronDerecha() {
  return (
    <svg
      className="size-4 shrink-0 text-[#8b9bb0] dark:text-[#6b7a99]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function MobileRow({
  titulo,
  subtitulo,
  icono,
  tonoIcono = "base",
  href,
  enlaceComponente,
  linkComponent,
  onClick,
  disabled = false,
  badge,
  derecha,
  mostrarChevron,
  destructivo = false,
  conDivisor = true,
  className = "",
}: MobileRowProps) {
  const esInteractivo = Boolean(href || onClick) && !disabled;
  const debeMostrarChevron = mostrarChevron ?? esInteractivo;

  const contenido = (
    <>
      {conDivisor && (
        <span
          aria-hidden="true"
          className="absolute left-[64px] right-4 top-0 h-px bg-[#eef2f7] dark:bg-[#1a3a5c]"
        />
      )}

      {icono && (
        <span
          aria-hidden="true"
          className={[
            "flex size-10 shrink-0 items-center justify-center rounded-[13px] transition-transform",
            TONO_ICONO_CLASES[tonoIcono],
          ].join(" ")}
        >
          {icono}
        </span>
      )}

      <span className="min-w-0 flex-1 py-1">
        <span
          className={[
            "block text-[14.5px] font-bold tracking-tight leading-snug",
            destructivo
              ? "text-[#9a2637] dark:text-[#ff6b7a]"
              : "text-[#0a2342] dark:text-[#f6f8fb]",
          ].join(" ")}
        >
          {titulo}
        </span>
        {subtitulo && (
          <span className="mt-0.5 block text-[12.5px] font-medium leading-normal text-[#4e5f80] dark:text-[#a8b5cc]">
            {subtitulo}
          </span>
        )}
      </span>

      {badge && <span className="shrink-0">{badge}</span>}
      {derecha && <span className="shrink-0">{derecha}</span>}
      {debeMostrarChevron && <ChevronDerecha />}
    </>
  );

  const clasesFila = [
    "relative flex min-h-[54px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors",
    esInteractivo
      ? "cursor-pointer hover:bg-[#f8fafd] active:bg-[#f0f5fe] dark:hover:bg-[#0f2d52]/60 dark:active:bg-[#0f2d52]"
      : "",
    disabled ? "opacity-60 pointer-events-none" : "",
    className,
  ].join(" ");

  if (href) {
    const Componente = enlaceComponente || linkComponent || "a";
    return (
      <Componente href={href} className={clasesFila}>
        {contenido}
      </Componente>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={clasesFila}>
        {contenido}
      </button>
    );
  }

  return <div className={clasesFila}>{contenido}</div>;
}

export interface MobileListGroupProps {
  children?: ReactNode;
  tituloSeccion?: string;
  ariaLabel?: string;
  as?: "div" | "nav";
  className?: string;
}

export function MobileListGroup({
  children,
  tituloSeccion,
  ariaLabel,
  as = "div",
  className = "",
}: MobileListGroupProps) {
  const Contenedor = as === "nav" ? "nav" : "div";

  return (
    <div className={className}>
      {tituloSeccion && (
        <h2 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
          {tituloSeccion}
        </h2>
      )}
      <Contenedor
        {...(as === "nav" ? { "aria-label": ariaLabel || tituloSeccion } : {})}
        className="overflow-hidden rounded-2xl border border-[#e6edf6] bg-white shadow-[0_2px_10px_rgba(10,35,66,0.04)] transition-colors dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
      >
        {children}
      </Contenedor>
    </div>
  );
}
