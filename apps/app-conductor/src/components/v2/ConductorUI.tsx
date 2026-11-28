import { Button as BaseButton, buttonVariants, cn } from "@ruum/ui/base";
import { ConductorIcon, type ConductorIconName } from "../icons";
import type { ButtonHTMLAttributes } from "react";

export type ConductorButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet" | "emergency";
export type ConductorStatus = "assigned" | "pending" | "active" | "success" | "error" | "neutral";

function baseVariant(variant: ConductorButtonVariant) {
  return variant === "secondary" ? "outline" : variant === "quiet" ? "ghost" : variant === "emergency" ? "danger" : variant;
}
const ICONS = { arrow: "right", check: "check", warning: "warning", phone: "phone", send: "right" } as const satisfies Record<string, ConductorIconName>;

export function conductorButtonClasses({
  variant = "primary",
  className = ""
}: {
  variant?: ConductorButtonVariant;
  className?: string;
} = {}) {
  return cn(buttonVariants({ variant: baseVariant(variant) }), "min-h-12 whitespace-normal", className);
}

export function ConductorButton({
  variant = "primary",
  loading = false,
  icon = "none",
  disabled,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ConductorButtonVariant;
  loading?: boolean;
  icon?: "arrow" | "check" | "warning" | "phone" | "send" | "none";
}) {
  return (
    <BaseButton variant={baseVariant(variant)}
      {...props}
      className={conductorButtonClasses({ variant, className })}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {!loading && icon !== "none" && <ConductorIcon name={ICONS[icon]} size={16} />}
      {children}
    </BaseButton>
  );
}

