import type { ButtonHTMLAttributes, ReactNode } from "react";

export type MobileButtonVariant = "primary" | "secondary" | "quiet" | "danger";

export interface MobileButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: MobileButtonVariant;
  stickyBottom?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const ESTILOS_VARIANTE: Record<MobileButtonVariant, string> = {
  primary:
    "bg-[#0a2342] text-white shadow-[0_12px_24px_-8px_rgba(10,35,66,0.35)] hover:bg-[#162c47] active:scale-[0.98] dark:bg-[#4d94ff] dark:text-[#061529] dark:hover:bg-[#6ba8ff]",
  secondary:
    "border border-[#d7e1ee] bg-white text-[#0a2342] hover:bg-[#f6f8fb] active:scale-[0.98] dark:border-[#2d4f73] dark:bg-[#0a2342] dark:text-[#f6f8fb] dark:hover:bg-[#0f2d52]",
  quiet:
    "bg-transparent text-[#0a2342] hover:bg-[#f2f6fc] active:scale-[0.98] dark:text-[#f6f8fb] dark:hover:bg-[#0f2d52]",
  danger:
    "bg-[#9a2637] text-white shadow-[0_12px_24px_-8px_rgba(154,38,55,0.35)] hover:bg-[#7e1f2d] active:scale-[0.98] dark:bg-[#ff6b7a] dark:text-[#061529]",
};

export function MobileButton({
  children,
  variant = "primary",
  stickyBottom = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = true,
  disabled,
  className = "",
  ...props
}: MobileButtonProps) {
  const boton = (
    <button
      className={[
        "relative flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15.5px] font-bold tracking-tight transition",
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#0066ff] focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100",
        fullWidth ? "w-full" : "w-auto",
        ESTILOS_VARIANTE[variant],
        className,
      ].join(" ")}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : undefined}
      {...props}
    >
      {loading ? (
        <span
          className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        <>
          {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
          <span>{children}</span>
          {iconRight && <span className="shrink-0" aria-hidden="true">{iconRight}</span>}
        </>
      )}
    </button>
  );

  if (!stickyBottom) {
    return boton;
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 border-t border-[#eef2f7] bg-white/95 p-4 backdrop-blur-md transition-colors pb-[max(16px,env(safe-area-inset-bottom,16px))] dark:border-[#1a3a5c] dark:bg-[#0a2342]/95">
      {boton}
    </div>
  );
}
