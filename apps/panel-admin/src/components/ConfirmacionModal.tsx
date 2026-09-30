"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function ConfirmacionModal({ abierto, titulo, children, confirmar, cancelar, destructiva = false }: { abierto: boolean; titulo: string; children: ReactNode; confirmar: () => void; cancelar: () => void; destructiva?: boolean }) {
  const dialogoRef = useRef<HTMLElement | null>(null);
  const previoRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!abierto) return;
    previoRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const t = window.requestAnimationFrame(() => dialogoRef.current?.querySelector<HTMLElement>("button")?.focus());
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") cancelar();
      if (e.key !== "Tab" || !dialogoRef.current) return;
      const controles = Array.from(dialogoRef.current.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")).filter((el) => !el.hasAttribute("disabled"));
      if (controles.length === 0) return;
      const primero = controles[0]!;
      const ultimo = controles[controles.length - 1]!;
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
      window.cancelAnimationFrame(t);
      window.requestAnimationFrame(() => previoRef.current?.focus());
    };
  }, [abierto, cancelar]);
  if (!abierto) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--ruum-overlay)] p-4" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) cancelar(); }}>
    <section ref={dialogoRef} role="alertdialog" aria-modal="true" aria-labelledby="confirmacion-titulo" className="w-full max-w-md rounded-[var(--ruum-radius-modal)] border border-[var(--ruum-border)] bg-surface-primary p-6 text-ink shadow-[var(--ruum-shadow-2)]" onClick={(e) => e.stopPropagation()}>
      <h2 id="confirmacion-titulo" className="font-body text-xl font-semibold text-ink">{titulo}</h2>
      <div className="mt-3 font-body text-sm text-text-secondary">{children}</div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={cancelar} className="min-h-11 rounded-lg border border-[var(--ruum-action)] px-4 py-2 font-body text-base font-semibold text-[var(--ruum-action)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--ruum-focus)]">Cancelar</button>
        <button type="button" onClick={confirmar} className={`min-h-11 rounded-lg px-4 py-2 font-body text-base font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--ruum-focus)] ${destructiva ? "bg-[var(--ruum-error)] text-[var(--ruum-on-danger)]" : "ruum-button-primary"}`}>Continuar</button>
      </div>
    </section>
  </div>;
}
