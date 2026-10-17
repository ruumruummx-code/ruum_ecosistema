import { useCallback, useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./registration.module.css";

export function RegistrationSheet({ title, kind, onClose, onSave, children, saving = false }: {
  title: string; kind: "address" | "contact"; onClose: () => void;
  onSave: () => boolean; children: ReactNode; saving?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const requestClose = useCallback(() => {
    if (closeTimer.current !== null) return;
    setClosing(true);
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160;
    closeTimer.current = window.setTimeout(onClose, duration);
  }, [onClose]);
  useLayoutEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    const dialog = ref.current;
    const handleEnter = (event: KeyboardEvent) => {
      if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
        event.preventDefault();
        if (!saving && !closing && onSave()) requestClose();
      }
    };
    dialog?.addEventListener("keydown", handleEnter);
    return () => dialog?.removeEventListener("keydown", handleEnter);
  }, [onSave, saving, closing, requestClose]);
  return (
    <dialog ref={ref} className={styles.sheet} data-kind={kind} data-closing={closing} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); requestClose(); }}>
      <header className={styles.sheetHeader}>
        <h2 id={titleId}>{title}</h2>
        <button type="button" onClick={requestClose} disabled={closing} aria-label={`Cerrar ${title}`}>×</button>
      </header>
      <div className={styles.sheetBody}>{children}</div>
      <footer className={styles.sheetFooter}>
        <button type="button" onClick={requestClose} disabled={closing}>Cancelar</button>
        <button type="button" onClick={() => { if (onSave()) requestClose(); }} disabled={saving || closing}>Guardar</button>
      </footer>
    </dialog>
  );
}
