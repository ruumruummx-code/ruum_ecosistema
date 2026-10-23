"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** El diálogo nativo conserva el foco y permite cerrar con Escape sin mover la página. */
export function TripDialog({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<dialog ref={ref} data-trip-dialog aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h2 className="font-bold text-base">{title}</h2><button type="button" onClick={onClose} aria-label={`Cerrar ${title}`}>✕</button></header>
    <div data-trip-dialog-content>{children}</div>
    {footer && <footer>{footer}</footer>}
  </dialog>, document.body);
}
