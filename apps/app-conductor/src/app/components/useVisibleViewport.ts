"use client";
import { useLayoutEffect, type RefObject } from "react";

/** Una implementación compartida; sin cálculos particulares por pantalla. */
export function useVisibleViewport(ref?: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const node = ref ? ref.current : document.documentElement;
    if (!node) return;
    const viewport = window.visualViewport;
    let pending = 0;
    const measure = () => {
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportHeight = viewport?.height ?? innerHeight;
      const headerHeight = document.querySelector("[data-conductor-header]")?.getBoundingClientRect().height ?? 0;
      const top = viewportTop + headerHeight;
      const height = Math.max(0, viewportHeight - headerHeight);
      const bottom = Math.max(0, innerHeight - viewportHeight - viewportTop);
      node.style.setProperty("--conductor-visible-top", `${top}px`);
      node.style.setProperty("--conductor-visible-height", `${height}px`);
      node.style.setProperty("--conductor-visible-bottom", `${bottom}px`);
      const active = document.activeElement;
      const editing = active instanceof HTMLElement && active.matches("input,textarea,select,[contenteditable=true]");
      if (!ref) {
        const keyboard = editing && innerHeight - viewportHeight > 100;
        node.dataset.conductorKeyboard = String(keyboard);
        node.dataset.tripKeyboard = String(keyboard);
      }
      cancelAnimationFrame(pending);
      if (editing && node.contains(active)) pending = requestAnimationFrame(() => active.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" }));
    };
    const header = document.querySelector("[data-conductor-header]");
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    measure();
    viewport?.addEventListener("resize", measure); viewport?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure); document.addEventListener("focusin", measure); document.addEventListener("focusout", measure);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(pending);
      viewport?.removeEventListener("resize", measure); viewport?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure); document.removeEventListener("focusin", measure); document.removeEventListener("focusout", measure);
      for (const name of ["--conductor-visible-top", "--conductor-visible-height", "--conductor-visible-bottom"]) node.style.removeProperty(name);
      if (!ref) { delete node.dataset.conductorKeyboard; delete node.dataset.tripKeyboard; }
    };
  }, [ref]);
}
