"use client";
import { useEffect, type RefObject } from "react";
/** Keeps fixed account layers above the software keyboard without page scrolling. */
export function useAltoViewportCuenta(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    let marco = 0;
    const actualizar = (event?: Event) => {
      ref.current?.style.setProperty("--account-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
      const activo = document.activeElement;
      if (event?.type !== "scroll" && activo instanceof HTMLElement && ref.current?.contains(activo) && activo.matches("input, select, textarea")) {
        cancelAnimationFrame(marco);
        marco = requestAnimationFrame(() => activo.scrollIntoView?.({ block: "nearest", inline: "nearest" }));
      }
    };
    actualizar();
    viewport?.addEventListener("resize", actualizar);
    viewport?.addEventListener("scroll", actualizar);
    window.addEventListener("resize", actualizar);
    return () => { cancelAnimationFrame(marco); viewport?.removeEventListener("resize", actualizar); viewport?.removeEventListener("scroll", actualizar); window.removeEventListener("resize", actualizar); };
  }, [ref]);
}
