"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./conductor-dialog.module.css";
import { useVisibleViewport } from "./useVisibleViewport";

/** La modalidad, el foco y Escape pertenecen al diálogo nativo. */
export function ConductorDialog({ open, onClose, labelledBy, children, className }: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  className?: string;
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
    return () => {
      if (node.open) node.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);

  return <dialog ref={dialog} className={`${styles.dialog} ${className ?? ""}`}
    aria-labelledby={labelledBy}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className={styles.closeRow}>
      <button type="button" data-dialog-close onClick={onClose} aria-label="Cerrar diálogo">×</button>
    </div>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Región larga desplazable con teclado. */}
    <div className={styles.content} role="region" aria-label="Contenido del diálogo" tabIndex={0}>{children}</div>
  </dialog>;
}
