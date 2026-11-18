import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-ui-neutral-soft text-ui-neutral",
        info: "bg-ui-brand-soft text-ui-brand-soft-fg",
        success: "bg-ui-success-soft text-ui-success",
        warning: "bg-ui-warning-soft text-ui-warning",
        danger: "bg-ui-danger-soft text-ui-danger",
        outline: "border border-ui-line text-ui-fg-muted",
      },
      dot: { true: "before:size-1.5 before:rounded-full before:bg-current", false: "" },
    },
    defaultVariants: { tone: "neutral", dot: false },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

/** Insignia de estado. Siempre lleva texto: el color nunca va solo. */
export function Badge({ className, tone, dot, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, dot }), className)} {...props} />;
}
