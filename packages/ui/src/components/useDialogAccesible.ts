"use client";

import { useEffect, useRef, type RefObject } from "react";

export interface OpcionesDialogAccesible {
  /** Mostrar el diálogo. Por defecto true (montar = abrir). */
  abierto?: boolean;
  /** Elemento que recibe el foco inicial (p. ej. cerrar o checkbox). */
  focoInicial?: RefObject<HTMLElement | null>;
  /** Cancel nativo (ESC): se hace preventDefault y se delega aquí. */
  alCancelar?: () => void;
}

const SELECTOR_FOCUSEABLES =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * Patrón <dialog> nativo accesible: showModal (+ fallback), trampa de foco
 * Tab/Shift+Tab, foco inicial, restauración de foco al cerrar/desmontar y
 * cierre al desmontar si quedó abierto.
 *
 * Unifica ConsentimientoTerminos, SoporteCliente y DiditVerificationModal
 * (app-usuario), que triplicaban este bloque con diferencias cosméticas.
 * `iframe` está en el selector porque Didit incrusta su flujo.
 */
export function useDialogAccesible({
  abierto = true,
  focoInicial,
  alCancelar,
}: OpcionesDialogAccesible = {}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previoFocoRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!abierto) {
      if (dialog.open) dialog.close();
      previoFocoRef.current?.focus?.();
      return;
    }

    previoFocoRef.current = document.activeElement as HTMLElement | null;
    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // Fallback si ya está abierto o en jsdom sin showModal.
        dialog.setAttribute("open", "");
      }
    }

    const marco = requestAnimationFrame(() => focoInicial?.current?.focus());

    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") return; // lo gestiona el evento nativo "cancel"
      if (e.key !== "Tab") return;
      const focusables = dialog.querySelectorAll<HTMLElement>(SELECTOR_FOCUSEABLES);
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    dialog.addEventListener("keydown", alTecla);

    const alCancelarNativo = (e: Event) => {
      e.preventDefault();
      alCancelar?.();
    };
    if (alCancelar) dialog.addEventListener("cancel", alCancelarNativo);

    return () => {
      dialog.removeEventListener("keydown", alTecla);
      if (alCancelar) dialog.removeEventListener("cancel", alCancelarNativo);
      cancelAnimationFrame(marco);
      previoFocoRef.current?.focus?.();
    };
  }, [abierto, focoInicial, alCancelar]);

  // Cierre al desmontar si quedó abierto.
  useEffect(
    () => () => {
      const dialog = dialogRef.current;
      if (dialog?.open) {
        try {
          dialog.close();
        } catch {
          /* ignorar */
        }
      }
    },
    []
  );

  return dialogRef;
}
