import type { ElementType, ReactNode } from "react";

export type MobileCardPadding = "none" | "sm" | "md" | "lg";
export type MobileCardRadius = "md" | "lg" | "xl" | "2xl";

export interface MobileCardProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  padding?: MobileCardPadding;
  elevated?: boolean;
  radius?: MobileCardRadius;
}

const PADDING: Record<MobileCardPadding, string> = {
  none: "",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

const RADIUS: Record<MobileCardRadius, string> = {
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-[22px]",
  "2xl": "rounded-2xl sm:rounded-[26px]",
};

export function MobileCard({
  children,
  className = "",
  as: Component = "section",
  padding = "md",
  elevated = false,
  radius = "2xl",
}: MobileCardProps) {
  return (
    <Component
      className={[
        "border border-[#e6edf6] bg-white text-[#0a2342] transition-colors",
        "dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:text-[#f6f8fb]",
        elevated
          ? "shadow-[0_10px_28px_rgba(10,35,66,0.08)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.4)]"
          : "shadow-[0_2px_10px_rgba(10,35,66,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.25)]",
        RADIUS[radius],
        PADDING[padding],
        className,
      ].join(" ")}
    >
      {children}
    </Component>
  );
}
