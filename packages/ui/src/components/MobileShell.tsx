import type { CSSProperties, ElementType, ReactNode } from "react";

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
  contentClassName?: string;
  style?: CSSProperties;
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
  contentClassName = "",
  style,
}: MobileShellProps) {
  return (
    <Component
      style={style}
      className={[
        "ruum-screen flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden transition-colors",
        conFondoCanvas
          ? "bg-[var(--user-color-background,var(--ruum-canvas))] text-[var(--user-color-primary,var(--ruum-text-primary))]"
          : "",
        className,
      ].join(" ")}
    >
      <div
        style={{ WebkitOverflowScrolling: "touch" }}
        className={[
          "scrollable-content mx-auto flex w-full min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain",
          ANCHO_VARIANTE[variant],
          PADDING_VARIANTE[padding],
          navInferiorVisible ? "pb-24" : "pb-6",
          contentClassName,
        ].filter(Boolean).join(" ")}
      >
        {children}
      </div>
    </Component>
  );
}
