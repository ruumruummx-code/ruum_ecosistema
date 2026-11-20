import { Badge, Button as BaseButton, buttonVariants, cn } from "@ruum/ui/base";
import { ConductorIcon, type ConductorIconName } from "../icons";
import type { ButtonHTMLAttributes, ReactNode } from "react";

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

export function ConductorStatusBadge({
  status,
  label,
  className = ""
}: {
  status: ConductorStatus;
  label: string;
  className?: string;
}) {
  const tone = { assigned: "info", pending: "warning", active: "info", success: "success", error: "danger", neutral: "neutral" } as const;

  return (
    <Badge tone={tone[status]} dot className={className}>{label}</Badge>
  );
}

export function ConductorOperationalCard({
  children,
  className = "",
  as: Element = "article"
}: {
  children: ReactNode;
  className?: string;
  as?: "article" | "section" | "div";
}) {
  return <Element className={cn("rounded-lg border border-ui-line bg-ui-card p-4 text-ui-fg shadow-ui-sm", className)}>{children}</Element>;
}

export function ConductorFeedback({
  tone = "info",
  children,
  className = ""
}: {
  tone?: "info" | "warning" | "error" | "success";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cn("rounded-lg border p-3 text-sm", { info: "border-ui-line bg-ui-brand-soft text-ui-brand-soft-fg", warning: "border-ui-warning bg-ui-warning-soft text-ui-warning", error: "border-ui-danger bg-ui-danger-soft text-ui-danger", success: "border-ui-success bg-ui-success-soft text-ui-success" }[tone], className)}
    >
      {children}
    </div>
  );
}

