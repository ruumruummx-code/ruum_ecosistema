"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@ruum/ui/base";
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
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ui-overlay p-4" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) cancelar(); }}>
    <section ref={dialogoRef} role="alertdialog" aria-modal="true" aria-labelledby="confirmacion-titulo" className="w-full max-w-md rounded-xl border border-ui-line bg-ui-card p-6 text-ui-fg shadow-ui-md" onClick={(e) => e.stopPropagation()}>
      <h2 id="confirmacion-titulo" className="text-lg font-semibold text-ui-fg">{titulo}</h2>
      <div className="mt-2 text-sm text-ui-fg-muted">{children}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={cancelar}>Cancelar</Button>
        <Button variant={destructiva ? "danger" : "primary"} onClick={confirmar}>Continuar</Button>
      </div>
    </section>
  </div>;
}
