"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./details.module.css";

export function DetailsDialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = dialog.current;
    if (open && !node?.open) node?.showModal();
    if (!open && node?.open) node.close();
  }, [open]);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClose={onClose}>
    <h2 id={titleId}>{title}</h2>
    {children}
    <button type="button" className={styles.retry} onClick={onClose}>Cerrar</button>
  </dialog>;
}
