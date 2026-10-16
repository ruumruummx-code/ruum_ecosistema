"use client";
import { useRef, type ReactNode } from "react";
import { useDialogAccesible } from "@ruum/ui";
import { useAltoViewportCuenta } from "./useAltoViewportCuenta";
export function HojaTareaCuenta({ titulo, extendida = false, ocupada = false, cerrar, children }: { titulo: string; extendida?: boolean; ocupada?: boolean; cerrar: () => void; children: ReactNode }) {
  const foco = useRef<HTMLButtonElement>(null);
  const gesto = useRef<number | null>(null);
  const dialog = useDialogAccesible({ focoInicial: foco, alCancelar: cerrar });
  useAltoViewportCuenta(dialog);
  return <dialog ref={dialog} aria-modal="true" aria-labelledby="tarea-cuenta-titulo" className="user-task-sheet user-v2-scope" onClick={event => { if (event.target === event.currentTarget) cerrar(); }}>
    <div className={`user-task-panel ${extendida ? "is-extended" : ""}`}>
      <div className="user-task-grip" aria-hidden="true" onPointerDown={event => { gesto.current = event.clientY; event.currentTarget.setPointerCapture?.(event.pointerId); }} onPointerUp={event => { if (gesto.current !== null && event.clientY - gesto.current > 60) cerrar(); gesto.current = null; }} onPointerCancel={() => { gesto.current = null; }}><span /></div>
      <header><h2 id="tarea-cuenta-titulo">{titulo}</h2><button ref={foco} type="button" disabled={ocupada} aria-label={`Cerrar ${titulo}`} onClick={cerrar}>×</button></header>
      <div className="user-task-body">{children}</div>
    </div>
  </dialog>;
}
