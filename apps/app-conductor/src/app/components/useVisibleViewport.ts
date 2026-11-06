"use client";

import { useLayoutEffect, type RefObject } from "react";

/** Contrato local al marco; no modifica el viewport ni las variables de otra vista. */
export function useVisibleViewport(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const viewport = window.visualViewport;
    const measure = () => {
      const top = viewport?.offsetTop ?? 0;
      const height = viewport?.height ?? window.innerHeight;
      node.style.setProperty("--conductor-visible-top", `${top}px`);
      node.style.setProperty("--conductor-visible-height", `${height}px`);
      node.style.setProperty("--conductor-visible-bottom", `${Math.max(0, window.innerHeight - height - top)}px`);
      const active = document.activeElement;
      if (active instanceof HTMLElement && node.contains(active) && active.matches("input, textarea, select")) {
        active.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };
    measure();
    viewport?.addEventListener("resize", measure);
    viewport?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    return () => {
      viewport?.removeEventListener("resize", measure);
      viewport?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [ref]);
}
