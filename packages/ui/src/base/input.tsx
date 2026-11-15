import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "./cn";

const campo =
  "h-11 w-full min-w-0 rounded-md border border-ui-field bg-ui-card px-3 text-base text-ui-fg shadow-ui-sm transition-[border-color,box-shadow] " +
  "placeholder:text-ui-fg-muted focus-visible:border-ui-focus focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(campo, className)} {...props} />,
);
Input.displayName = "Input";

/** Campo con icono al inicio y acción opcional al final (p. ej. buscador con filtro). */
export const InputConIcono = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icono: ReactNode; accion?: ReactNode; contenedorClassName?: string }
>(({ icono, accion, className, contenedorClassName, ...props }, ref) => (
  <div className={cn("relative flex items-center", contenedorClassName)}>
    <span className="pointer-events-none absolute left-3 text-ui-fg-muted [&_svg]:size-4" aria-hidden="true">
      {icono}
    </span>
    <input ref={ref} className={cn(campo, "pl-9", accion ? "pr-12" : "", className)} {...props} />
    {accion && <span className="absolute right-1 flex items-center">{accion}</span>}
  </div>
));
InputConIcono.displayName = "InputConIcono";

/** Select nativo: accesible y con el selector del sistema en móvil. */
export const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(campo, "cursor-pointer pr-8", className)} {...props} />
  ),
);
NativeSelect.displayName = "NativeSelect";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-ui-fg", className)} {...props} />;
}
