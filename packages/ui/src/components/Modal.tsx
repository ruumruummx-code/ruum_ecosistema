"use client";

import { useEffect, useRef, useId, type ReactNode } from "react";

/**
 * Modal V1.1 — Componente de diálogo modal accesible según especificaciones WAI-ARIA (APG Dialog Modal).
 *
 * Características implementadas:
 * - Trampa de foco bidireccional (Tab / Shift+Tab) confinada al contenedor del diálogo modal.
 * - Enfoque inicial automático en el primer control accionable del diálogo (o en el contenedor con tabindex="-1").
 * - Retorno garantizado de foco al elemento de origen (trigger activo al abrir) al cerrar por Escape, botón o acción interna.
 * - Cierre por tecla Escape y por pulsación en la capa de fondo (overlay).
 * - Bloqueo de desplazamiento del fondo (body scroll-lock) mientras el modal permanece abierto.
 * - Desplazamiento vertical interno (max-height con overflow-y: auto) con cabecera y botón de cierre
 *   siempre visibles en el viewport en anchos 320, 390, 768 y 1440 px.
 * - Semántica accesible completa: role="dialog", aria-modal="true", aria-labelledby vinculada al título.
 * - Estados visuales: default, loading (aria-busy) y error (role="alert").
 */
export interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  estado?: "default" | "loading" | "error";
  className?: string;
  /** ID accesible opcional para descripción complementaria (aria-describedby). */
  descripcionId?: string;
}

const SELECTOR_ENFOCABLES = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'summary',
  'iframe',
].join(", ");

function obtenerEnfocables(contenedor: HTMLElement): HTMLElement[] {
  return Array.from(contenedor.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES)).filter(
    (el) => el.tabIndex !== -1 && !el.hasAttribute("disabled") && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)
  );
}

export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  estado = "default",
  className = "",
  descripcionId,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previoFocoRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!abierto) return;

    // Guardar el elemento que tenía el foco activo antes de abrir el modal
    previoFocoRef.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    if (!dialog) return;

    // Foco inicial: primer elemento accionable o el contenedor del diálogo
    const frame = requestAnimationFrame(() => {
      const enfocables = obtenerEnfocables(dialog);
      if (enfocables.length > 0) {
        enfocables[0].focus();
      } else {
        dialog.focus();
      }
    });

    // Trampa de foco bidireccional y tecla Escape
    const alKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCerrar();
        return;
      }

      if (e.key !== "Tab") return;

      const enfocables = obtenerEnfocables(dialog);
      if (enfocables.length === 0) {
        e.preventDefault();
        return;
      }

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === primero || !dialog.contains(document.activeElement)) {
          e.preventDefault();
          ultimo.focus();
        }
      } else {
        if (document.activeElement === ultimo || !dialog.contains(document.activeElement)) {
          e.preventDefault();
          primero.focus();
        }
      }
    };

    document.addEventListener("keydown", alKeyDown);

    // Bloquear scroll de fondo mientras el modal está abierto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alKeyDown);
      cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;

      // Devolver foco al elemento de origen al cerrar/desmontar
      const elemOrigen = previoFocoRef.current;
      if (elemOrigen && typeof elemOrigen.focus === "function") {
        elemOrigen.focus();
      }
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ruum-overlay)] p-3 sm:p-4 md:p-6"
      role="presentation"
      onClick={onCerrar}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descripcionId}
        aria-busy={estado === "loading" || undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-y-auto rounded-[20px] border border-[var(--ruum-border)] bg-[var(--ruum-surface-elevated)] p-5 shadow-[var(--ruum-elevation-2)] focus:outline-none sm:p-6 ${className}`}
      >
        <div className="sticky -top-5 z-10 -mx-5 -mt-5 mb-3 flex items-start justify-between gap-3 border-b border-[var(--ruum-border)]/60 bg-[var(--ruum-surface-elevated)] p-5 sm:-top-6 sm:-mx-6 sm:-mt-6 sm:p-6">
          <h2 id={titleId} className="font-body text-lg font-semibold text-[var(--ruum-text)]">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar diálogo"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[12px] text-[var(--ruum-text-secondary)] hover:bg-[var(--ruum-neutral-bg)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--ruum-focus)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {estado === "loading" ? (
          <div className="flex items-center gap-3 py-4" role="status">
            <span className="size-5 animate-spin rounded-full border-2 border-[var(--ruum-action)] border-t-transparent" aria-hidden />
            <span className="font-body text-sm text-[var(--ruum-text-secondary)]">Cargando…</span>
          </div>
        ) : estado === "error" ? (
          <div role="alert" className="mb-3 rounded-[12px] border border-[var(--ruum-error)]/30 bg-[var(--ruum-error-bg)] px-3 py-2 text-sm text-[var(--ruum-error-text)]">
            No pudimos completar esta acción. Inténtalo de nuevo o pide ayuda a soporte.
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
