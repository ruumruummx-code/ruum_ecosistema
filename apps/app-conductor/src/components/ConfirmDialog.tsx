"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect, useId, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  consequence: string;
  maskedData?: string[];
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  consequence,
  maskedData = [],
  confirmLabel,
  cancelLabel = "Cancelar",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => cancelRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <BaseButton variant="ghost"
        type="button"
        aria-label="Cerrar diálogo"
        onClick={() => {
          if (!busy) onCancel();
        }}
        disabled={busy}
        className="absolute inset-0 w-full h-full bg-ui-overlay/70 backdrop-blur-xs border-none cursor-default disabled:cursor-not-allowed"
      />
      <dialog
        ref={dialogRef}
        open
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-lg rounded-lg border border-ui-line bg-ui-card p-5 shadow-2xl text-ui-fg m-0 block z-10"
      >
        <h2 id={titleId} className="font-display text-xl font-bold text-ui-fg">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 font-body text-sm leading-6 text-ui-fg-muted">
          {consequence}
        </p>
        {maskedData.length > 0 && (
          <ul className="mt-4 rounded-xl bg-ui-muted p-3 font-mono text-sm text-ui-fg-muted">
            {maskedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <BaseButton variant="ghost"
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-ui-line px-4 font-semibold text-ui-fg hover:bg-ui-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:opacity-50"
          >
            {cancelLabel}
          </BaseButton>
          <BaseButton variant="ghost"
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`min-h-11 rounded-xl px-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:opacity-50 ${
              destructive
                ? "bg-ui-danger text-ui-on-brand hover:brightness-110"
                : "bg-ui-brand text-ui-fg hover:brightness-110 font-bold"
            }`}
          >
            {busy ? "Procesando…" : confirmLabel}
          </BaseButton>
        </div>
      </dialog>
    </div>
  );
}
