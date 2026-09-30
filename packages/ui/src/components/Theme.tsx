"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useRuumTheme — activación del modo oscuro (Dark Mode v1.0 §5).
 * - Sistema en oscuro → oscuro automático; toggle manual prevalece.
 * - Sin preferencia → claro. Respeta cambios del sistema en modo "auto".
 * Escribe `data-theme` en <html>. Las apps Ruum ya lo integran
 * (TemaProvider en app-usuario, SelectorTemaAdmin en panel, theme-init.js);
 * este hook es la primitiva reutilizable para cualquier superficie.
 */

export type RuumTheme = "light" | "dark";
export type RuumThemeMode = "auto" | RuumTheme;

const THEME_KEY = "ruum-theme";
const MODE_KEY = "ruum-tema-modo";

function sistemaOscuro(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function leerModo(): RuumThemeMode {
  try {
    const m = localStorage.getItem(MODE_KEY) ?? localStorage.getItem(THEME_KEY);
    if (m === "light" || m === "dark" || m === "auto") return m;
  } catch {
    // almacenamiento no disponible
  }
  return "auto";
}

function resolver(modo: RuumThemeMode): RuumTheme {
  return modo === "auto" ? (sistemaOscuro() ? "dark" : "light") : modo;
}

export function useRuumTheme() {
  const [modo, setModo] = useState<RuumThemeMode>("auto");
  const [tema, setTema] = useState<RuumTheme>("light");

  useEffect(() => {
    const inicial = leerModo();
    setModo(inicial === "auto" ? "auto" : inicial);
    const resuelto = resolver(inicial);
    setTema(resuelto);
    document.documentElement.setAttribute("data-theme", resuelto);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = (e: MediaQueryListEvent) => {
      if (leerModo() !== "auto") return;
      const t: RuumTheme = e.matches ? "dark" : "light";
      setTema(t);
      document.documentElement.setAttribute("data-theme", t);
    };
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  const fijarModo = useCallback((m: RuumThemeMode) => {
    try {
      if (m === "auto") {
        localStorage.removeItem(THEME_KEY);
        localStorage.setItem(MODE_KEY, "auto");
      } else {
        localStorage.setItem(MODE_KEY, m);
        localStorage.setItem(THEME_KEY, m);
      }
    } catch {
      // el tema también funciona sin almacenamiento
    }
    setModo(m);
    const resuelto = resolver(m);
    setTema(resuelto);
    document.documentElement.setAttribute("data-theme", resuelto);
  }, []);

  return { tema, modo, fijarModo };
}
