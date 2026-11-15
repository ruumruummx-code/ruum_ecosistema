"use client";

import { useSyncExternalStore } from "react";

/** Lee una media query sin desajuste de hidratación (en servidor devuelve false). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const media = typeof window !== "undefined" ? window.matchMedia?.(query) : undefined;
      media?.addEventListener("change", avisar);
      return () => media?.removeEventListener("change", avisar);
    },
    () => (typeof window !== "undefined" ? Boolean(window.matchMedia?.(query).matches) : false),
    () => false,
  );
}
