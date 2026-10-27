"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Cambia el contenedor visual sin desmontar el formulario ni sus operaciones. */
export function ContenidoResponsivePersistente({ desktop, movil, escritorio, children }: {
  desktop: boolean;
  movil: (contenido: ReactNode) => ReactNode;
  escritorio: (contenido: ReactNode) => ReactNode;
  children: ReactNode;
}) {
  const [contenedor, setContenedor] = useState<HTMLDivElement | null>(null);
  const destino = useRef<HTMLDivElement | null>(null);
  const foco = useRef<HTMLElement | null>(null);
  useEffect(() => { const nodo = document.createElement("div"); nodo.className = "contents"; setContenedor(nodo); }, []);
  const asignarDestino = useCallback((nodo: HTMLDivElement | null) => {
    if (!nodo && destino.current?.contains(document.activeElement)) foco.current = document.activeElement as HTMLElement;
    destino.current = nodo;
  }, []);
  useLayoutEffect(() => {
    if (!contenedor || !destino.current) return;
    destino.current.appendChild(contenedor);
    // Al mover un diálogo abierto entre contenedores, restablecer su modalidad.
    for (const dialog of contenedor.querySelectorAll<HTMLDialogElement>("dialog[open]")) {
      try {
        if (!dialog.matches(":modal") && typeof dialog.showModal === "function") {
          dialog.close();
          dialog.showModal();
        }
      } catch { /* Mantener el contenido en navegadores sin selector :modal. */ }
    }
    if (foco.current?.isConnected) foco.current.focus({ preventScroll: true });
    foco.current = null;
  }, [desktop, contenedor]);
  const sitio = <div ref={asignarDestino} className="contents" />;
  return <>{desktop ? escritorio(sitio) : movil(sitio)}{contenedor && createPortal(children, contenedor)}</>;
}
