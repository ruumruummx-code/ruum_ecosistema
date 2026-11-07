"use client";
import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useVisibleViewport } from "./useVisibleViewport";
import { conductorRouteContract } from "./route-contract";

/** Único propietario de área visible y de la reserva de navegación. */
export function ConductorShellBridge() {
  const pathname = usePathname();
  useVisibleViewport();
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.conductorVariant = conductorRouteContract(pathname).variant;
    const observer = new ResizeObserver(measure);
    function measure() {
      const nodes = document.querySelectorAll<HTMLElement>("[data-conductor-mobile-nav], [data-conductor-local-nav]");
      let height = 0;
      nodes.forEach(node => { observer.observe(node); height = Math.max(height, node.getBoundingClientRect().height); });
      const value = `${Math.ceil(height)}px`;
      if (root.style.getPropertyValue("--conductor-shell-bottom-height") !== value) root.style.setProperty("--conductor-shell-bottom-height", value);
    }
    measure();
    const mutations = new MutationObserver(measure);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); mutations.disconnect(); window.removeEventListener("resize", measure); root.style.removeProperty("--conductor-shell-bottom-height"); delete root.dataset.conductorVariant; };
  }, [pathname]);
  return null;
}
