"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Hoja inferior en móvil y diálogo centrado desde 640px, sobre <dialog> nativo
 * (foco atrapado, Escape y capa superior del navegador; sin estilos inyectados).
 */
export function Sheet({
  open,
  onClose,
  titulo,
  descripcion,
  children,
  pie,
  className,
  etiquetaCerrar = "Cerrar",
}: {
  open: boolean;
  onClose: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  className?: string;
  etiquetaCerrar?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previo = document.activeElement;
    if (!dialog.open) dialog.showModal?.();
    return () => {
      if (dialog.open) dialog.close?.();
      if (previo instanceof HTMLElement) previo.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      className={cn("ui-sheet rounded-t-xl bg-ui-card text-ui-fg shadow-ui-md sm:max-w-md sm:rounded-xl", className)}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-ui-line-strong sm:hidden" />
          <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-2">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ui-fg">{titulo}</h2>
              {descripcion && <p className="mt-1 text-sm text-ui-fg-muted">{descripcion}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={etiquetaCerrar}
              className="-mr-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-ui-fg-muted hover:bg-ui-muted hover:text-ui-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">{children}</div>
          {pie && (
            <footer className="flex flex-col-reverse gap-2 border-t border-ui-line px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
              {pie}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
