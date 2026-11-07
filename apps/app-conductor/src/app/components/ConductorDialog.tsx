"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./conductor-dialog.module.css";
import { useVisibleViewport } from "./useVisibleViewport";

/** La modalidad, el foco y Escape pertenecen al diálogo nativo. */
export function ConductorDialog({ open, onClose, labelledBy, children, className, footer, title, closeLabel = "Cerrar diálogo" }: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode; title?: string; closeLabel?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useVisibleViewport(dialog);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (!open) {
      if (node.open) node.close();
      return;
    }
    const previous = document.activeElement;
    if (!node.open) node.showModal();
    // El cierre explícito es siempre alcanzable, incluso sin otros controles.
    node.querySelector<HTMLButtonElement>("[data-dialog-close]")?.focus();
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const candidates = Array.from(node.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex='0']"))
        .filter(node => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== "hidden");
      const first = candidates[0]; const last = candidates[candidates.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }

    };
    node.addEventListener("keydown", trapTab);
    return () => {
      node.removeEventListener("keydown", trapTab);
      if (node.open) node.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);

  return <dialog ref={dialog} className={`${styles.dialog} ${className ?? ""}`}
    aria-labelledby={labelledBy}
    onCancel={event => { event.preventDefault(); onClose(); }}
    >
    <div className={styles.closeRow}>
      {title && <h2 id={labelledBy}>{title}</h2>}
      <button type="button" data-dialog-close onClick={onClose} aria-label={closeLabel}>×</button>
    </div>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Región larga desplazable con teclado. */}
    <div className={styles.content} role="region" aria-label="Contenido del diálogo" tabIndex={0}>{children}</div>
    {footer && <footer className={styles.footer}>{footer}</footer>}
  </dialog>;
}
