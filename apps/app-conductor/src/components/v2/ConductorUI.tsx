import { Button as BaseButton, buttonVariants, cn } from "@ruum/ui/base";
import { ConductorIcon, type ConductorIconName } from "../icons";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ConductorButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet" | "emergency";

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

export function ConductorFeedback({ tono, children }: { tono: "info" | "danger"; children: ReactNode }) {
  const esError = tono === "danger";
  return (
    <div
      role={esError ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-xl border px-4 py-3 font-body text-sm leading-5",
        esError
          ? "border-ui-danger/30 bg-ui-danger-soft text-ui-danger"
          : "border-ui-brand/30 bg-ui-brand-soft text-ui-brand"
      )}
    >
      <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full border border-current text-xs font-bold">
        {esError ? "!" : "i"}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
