import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "./cn";

export type MarcoPantallaVariante = "compact" | "wide";
export type MarcoPantallaPadding = "none" | "sm" | "md" | "lg";

export interface MarcoPantallaProps {
  children: ReactNode;
  /** `compact`: columna de 480 px (formularios y flujos cortos). `wide`: hasta 64 rem. */
  variant?: MarcoPantallaVariante;
  padding?: MarcoPantallaPadding;
  /** Pinta el fondo y el color de texto de la pantalla. */
  conFondoCanvas?: boolean;
  /** Deja espacio al final para la barra de navegación inferior. */
  navInferiorVisible?: boolean;
  as?: ElementType;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
}

const ANCHO: Record<MarcoPantallaVariante, string> = {
  compact: "max-w-[480px]",
  wide: "max-w-5xl",
};

const PADDING: Record<MarcoPantallaPadding, string> = {
  none: "",
  sm: "px-3 py-3 sm:px-4 sm:py-4",
  md: "px-4 py-4 sm:px-6 sm:py-6",
  lg: "px-5 py-6 sm:px-8 sm:py-8",
};

/**
 * Marco de pantalla a alto completo con desplazamiento interno. Sustituye a
 * `MobileShell` de la entrada raíz de `@ruum/ui`.
 */
export function MarcoPantalla({
  children,
  variant = "compact",
  padding = "md",
  conFondoCanvas = true,
  navInferiorVisible = false,
  as: Component = "div",
  className,
  contentClassName,
  style,
}: MarcoPantallaProps) {
  return (
    <Component
      style={style}
      className={cn(
        "ruum-screen flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden transition-colors",
        conFondoCanvas && "bg-ui-bg text-ui-fg",
        className,
      )}
    >
      <div
        className={cn(
          "scrollable-content mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain",
          ANCHO[variant],
          PADDING[padding],
          navInferiorVisible ? "pb-24" : "pb-6",
          contentClassName,
        )}
      >
        {children}
      </div>
    </Component>
  );
}
