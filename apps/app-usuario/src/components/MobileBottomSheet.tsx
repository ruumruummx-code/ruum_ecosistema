"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./mobile-bottom-sheet.module.css";

export function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
  fullScreen = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  fullScreen?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={`${styles.sheet} ${fullScreen ? styles.fullScreen : ""} bg-white text-[#0a2342] dark:bg-[#071322] dark:text-white`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex h-full min-h-0 flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#d7e1ee] px-5 py-2 dark:border-[#1a3a5c]">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar hoja inferior"
            className="min-h-11 min-w-11 text-xl"
          >
            ×
          </button>
        </header>
        <div
          className={
            fullScreen
              ? "min-h-0 flex-1 overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]"
          }
        >
          {open ? children : null}
        </div>
      </div>
    </dialog>
  );
}
