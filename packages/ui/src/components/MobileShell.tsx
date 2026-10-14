import type { ElementType, ReactNode } from "react";

export type MobileShellVariant = "compact" | "wide";
export type MobileShellPadding = "none" | "sm" | "md" | "lg";

export interface MobileShellProps {
  children: ReactNode;
  variant?: MobileShellVariant;
  padding?: MobileShellPadding;
  conFondoCanvas?: boolean;
  navInferiorVisible?: boolean;
  as?: ElementType;
  className?: string;
}

const ANCHO_VARIANTE: Record<MobileShellVariant, string> = {
  compact: "max-w-[480px]",
  wide: "max-w-5xl",
};

const PADDING_VARIANTE: Record<MobileShellPadding, string> = {
  none: "",
  sm: "px-3 py-3 sm:px-4 sm:py-4",
  md: "px-4 py-4 sm:px-6 sm:py-6",
  lg: "px-5 py-6 sm:px-8 sm:py-8",
};

export function MobileShell({
  children,
  variant = "compact",
  padding = "md",
  conFondoCanvas = true,
  navInferiorVisible = false,
  as: Component = "div",
  className = "",
}: MobileShellProps) {
  return (
    <Component
      className={[
        "min-h-dvh w-full transition-colors",
        conFondoCanvas
          ? "bg-[var(--user-color-background,var(--ruum-canvas))] text-[var(--user-color-primary,var(--ruum-text-primary))]"
          : "",
        navInferiorVisible ? "pb-24" : "pb-6",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "w-full mx-auto flex flex-col",
          ANCHO_VARIANTE[variant],
          PADDING_VARIANTE[padding],
        ].join(" ")}
      >
        {children}
      </div>
    </Component>
  );
}
