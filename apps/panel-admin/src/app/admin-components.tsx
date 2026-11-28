"use client";

import { Tabs } from "@ruum/ui";
import { Badge, Button, Skeleton, cn } from "@ruum/ui/base";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject
} from "react";

const unir = cn;

/** Variantes del panel → variantes de @ruum/ui/base. */
const botonVariante = {
  primary: "primary",
  secondary: "outline",
  quiet: "ghost",
  danger: "danger"
} as const;

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof botonVariante;
  loading?: boolean;
};

export function AdminButton({ variant = "primary", loading = false, disabled, className, children, type = "button", ...props }: AdminButtonProps) {
  return (
    <Button
      {...props}
      type={type}
      variant={botonVariante[variant]}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={disabled || loading || undefined}
      className={className}
    >
      {loading && (
        <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {loading ? "Procesando..." : children}
    </Button>
  );
}

type AdminIconButtonProps = Omit<AdminButtonProps, "children"> & {
  "aria-label": string;
  icon: ReactNode;
};

function AdminIconButton({ icon, className, variant = "quiet", ...props }: AdminIconButtonProps) {
  return (
    <AdminButton {...props} variant={variant} className={unir("size-11 px-0", className)}>
      <span aria-hidden="true" className="flex items-center justify-center">
        {icon}
      </span>
    </AdminButton>
  );
}

type CampoBaseProps = {
  label: string;
  description?: string;
  error?: string;
  className?: string;
  controlClassName?: string;
};

function useCampoIds(idProp?: string) {
  const generado = useId();
  const id = idProp ?? generado;
  return {
    id,
    descripcionId: `${id}-descripcion`,
    errorId: `${id}-error`
  };
}

function CampoMarco({ label, htmlFor, description, error, descriptionId, errorId, children, className }: CampoBaseProps & {
  htmlFor: string;
  descriptionId: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <label className={unir("block text-sm font-medium text-ui-fg", className)} htmlFor={htmlFor}>
      <span className="block">{label}</span>
      {description && <span id={descriptionId} className="mt-1 block text-xs text-ui-fg-muted">{description}</span>}
      <span className="mt-1.5 block">{children}</span>
      {error && <span id={errorId} className="mt-1 block text-xs text-ui-danger">{error}</span>}
    </label>
  );
}

/* Misma geometría que Input/NativeSelect de @ruum/ui/base (borde de campo con contraste ≥ 3:1). */
const campoClase = "w-full rounded-md border border-ui-field bg-ui-card px-3 py-2.5 text-sm text-ui-fg placeholder:text-ui-fg-muted focus:border-ui-focus focus:outline-none focus:ring-4 focus:ring-ui-ring disabled:cursor-not-allowed disabled:opacity-60";

export function AdminInput({ label, description, error, className, controlClassName, id: idProp, ...props }: CampoBaseProps & ComponentPropsWithoutRef<"input">) {
  const { id, descripcionId, errorId } = useCampoIds(idProp);
  const describedBy = [description && descripcionId, error && errorId].filter(Boolean).join(" ") || undefined;
  return (
    <CampoMarco label={label} htmlFor={id} description={description} error={error} descriptionId={descripcionId} errorId={errorId} className={className}>
      <input {...props} id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy} data-ruum-label={label} className={unir(campoClase, controlClassName)} />
    </CampoMarco>
  );
}

export function AdminSelect({ label, description, error, className, controlClassName, id: idProp, children, ...props }: CampoBaseProps & ComponentPropsWithoutRef<"select">) {
  const { id, descripcionId, errorId } = useCampoIds(idProp);
  const describedBy = [description && descripcionId, error && errorId].filter(Boolean).join(" ") || undefined;
  return (
    <CampoMarco label={label} htmlFor={id} description={description} error={error} descriptionId={descripcionId} errorId={errorId} className={className}>
      <select {...props} id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy} className={unir(campoClase, controlClassName)}>
        {children}
      </select>
    </CampoMarco>
  );
}

export function AdminTextarea({ label, description, error, className, controlClassName, id: idProp, ...props }: CampoBaseProps & ComponentPropsWithoutRef<"textarea">) {
  const { id, descripcionId, errorId } = useCampoIds(idProp);
  const describedBy = [description && descripcionId, error && errorId].filter(Boolean).join(" ") || undefined;
  return (
    <CampoMarco label={label} htmlFor={id} description={description} error={error} descriptionId={descripcionId} errorId={errorId} className={className}>
      <textarea {...props} id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy} data-ruum-label={label} className={unir(campoClase, "min-h-28 resize-y", controlClassName)} />
    </CampoMarco>
  );
}

function obtenerControles(contenedor: HTMLElement | null) {
  return Array.from(contenedor?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])") ?? [])
    .filter((elemento) => !elemento.hasAttribute("disabled") && elemento.getAttribute("aria-hidden") !== "true");
}

function useCapaModal(abierto: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>, finalFocusRef?: RefObject<HTMLElement | null>) {
  const focoPrevio = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!abierto) return;
    focoPrevio.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focoFinal = finalFocusRef?.current;
    const controles = obtenerControles(ref.current);
    window.requestAnimationFrame(() => controles[0]?.focus());

    function keydown(evento: globalThis.KeyboardEvent) {
      if (evento.key === "Escape") onCloseRef.current();
      if (evento.key !== "Tab") return;
      const actuales = obtenerControles(ref.current);
      if (actuales.length === 0) return;
      const primero = actuales[0]!;
      const ultimo = actuales[actuales.length - 1]!;
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      window.requestAnimationFrame(() => (focoFinal ?? focoPrevio.current)?.focus());
    };
  }, [abierto, finalFocusRef, ref]);
}

type AdminDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  footer?: ReactNode;
  finalFocusRef?: RefObject<HTMLElement | null>;
};

export function AdminDialog({ open, title, description, onOpenChange, children, footer, finalFocusRef }: AdminDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useCapaModal(open, () => onOpenChange(false), dialogRef, finalFocusRef);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ui-overlay px-4" role="presentation">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className="w-full max-w-lg overflow-hidden rounded-xl border border-ui-line bg-ui-card shadow-ui-md">
        <header className="border-b border-ui-line px-6 py-5">
          <h2 id={titleId} className="text-lg font-semibold text-ui-fg">{title}</h2>
          {description && <p id={descriptionId} className="mt-1 text-sm text-ui-fg-muted">{description}</p>}
        </header>
        <div className="px-6 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-ui-line px-6 py-4">{footer}</footer>}
      </section>
    </div>
  );
}

export function AdminDrawer({ open, title, description, onOpenChange, children, footer, finalFocusRef }: AdminDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const drawerRef = useRef<HTMLElement | null>(null);
  useCapaModal(open, () => onOpenChange(false), drawerRef, finalFocusRef);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ui-overlay" role="presentation">
      <aside ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className="flex h-full w-full max-w-md flex-col border-l border-ui-line bg-ui-card shadow-ui-md">
        <header className="border-b border-ui-line px-6 py-5">
          <h2 id={titleId} className="text-lg font-semibold text-ui-fg">{title}</h2>
          {description && <p id={descriptionId} className="mt-1 text-sm text-ui-fg-muted">{description}</p>}
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-ui-line px-6 py-4">{footer}</footer>}
      </aside>
    </div>
  );
}

type AdminTabsProps<T extends string> = {
  items: Array<{ value: T; label: string; disabled?: boolean }>;
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  renderPanel: (id: string) => ReactNode;
};

export function AdminTabs<T extends string>({ items, value, onValueChange, label, renderPanel }: AdminTabsProps<T>) {
 return <Tabs tabs={items.map(item=>({id:item.value,etiqueta:item.label,disabled:item.disabled}))} value={value} onSeleccion={id=>onValueChange(id as T)} etiqueta={label} renderPanel={renderPanel} />;
}

const tonoBadge = { neutral: "neutral", info: "info", success: "success", warning: "warning", danger: "danger" } as const;
type TonoAdmin = keyof typeof tonoBadge;

/** Insignia de estado: siempre con texto (Badge de @ruum/ui/base). */
export function AdminBadge({ children, tone = "neutral", className }: { children: ReactNode; tone?: TonoAdmin; className?: string }) {
  return <Badge tone={tonoBadge[tone]} className={className}>{children}</Badge>;
}

export function AdminTooltip({ label, children }: { label: string; children: ReactElement }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const child = isValidElement(children)
    ? cloneElement(Children.only(children), {
        "aria-describedby": abierto ? id : undefined,
        onFocus: () => setAbierto(true),
        onBlur: () => setAbierto(false),
        onMouseEnter: () => setAbierto(true),
        onMouseLeave: () => setAbierto(false),
        onKeyDown: (evento: KeyboardEvent<HTMLElement>) => {
          if (evento.key === "Escape") setAbierto(false);
          (children as ReactElement<{ onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void }>).props.onKeyDown?.(evento);
        }
      } as Partial<unknown>)
    : children;
  return (
    <span className="relative inline-flex">
      {child}
      {abierto && <span id={id} role="tooltip" className="absolute bottom-full left-1/2 z-50 mb-2 max-w-64 -translate-x-1/2 whitespace-normal break-words rounded-md bg-ui-fg px-2.5 py-1.5 text-xs text-ui-bg shadow-ui-md">{label}</span>}
    </span>
  );
}

export function AdminEmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <section data-empty-state className="flex flex-col items-center rounded-lg border border-dashed border-ui-line-strong bg-ui-card px-6 py-10 text-center" aria-live="polite" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}>
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-ui-brand-soft text-ui-brand-soft-fg" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>
      </span>
      <h2 id={titleId} className="text-base font-semibold text-ui-fg">{title}</h2>
      {description && <p id={descriptionId} className="mt-1 max-w-md text-sm text-ui-fg-muted">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </section>
  );
}

export function AdminErrorState({ title = "No pudimos cargar esta información", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-ui-danger/30 bg-ui-danger-soft px-6 py-6" role="alert">
      <h2 className="text-base font-semibold text-ui-danger">{title}</h2>
      {description && <p className="mt-2 text-sm text-ui-fg">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

export function AdminLoadingState({ label = "Cargando información" }: { label?: string }) {
  return (
    <div className="rounded-lg border border-ui-line bg-ui-card p-5" aria-label={label} aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <div className="mt-4 grid gap-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}

function AdminLastUpdated({ value, label = "Última actualización" }: { value?: string | Date | null; label?: string }) {
  if (!value) return <span className="text-xs text-ui-fg-muted">{label}: sin fecha</span>;
  const fecha = value instanceof Date ? value : new Date(value);
  return (
    <time dateTime={fecha.toISOString()} className="text-xs text-ui-fg-muted">
      {label}: {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(fecha)}
    </time>
  );
}
