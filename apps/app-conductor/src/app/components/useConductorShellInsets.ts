"use client";

import { useLayoutEffect, useRef } from "react";

/** Publica el tamaño completo de las barras, incluidas las safe areas y el viaje activo. */
export function useConductorShellInsets(headerVisible: boolean, mobileNavVisible: boolean) {
  const headerRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!headerVisible && !mobileNavVisible) return;
    const root = document.documentElement;
    const measure = () => {
      root.style.setProperty("--conductor-shell-header-height", `${Math.ceil(headerRef.current?.getBoundingClientRect().height ?? 0)}px`);
      root.style.setProperty("--conductor-shell-bottom-height", `${Math.ceil(mobileNavRef.current?.getBoundingClientRect().height ?? 0)}px`);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (headerRef.current) observer?.observe(headerRef.current);
    if (mobileNavRef.current) observer?.observe(mobileNavRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      root.style.removeProperty("--conductor-shell-header-height");
      root.style.removeProperty("--conductor-shell-bottom-height");
    };
  }, [headerVisible, mobileNavVisible]);

  return { headerRef, mobileNavRef };
}
