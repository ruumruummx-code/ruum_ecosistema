"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Tema = "light" | "dark";
export type ModoTema = "auto" | Tema;
const STORAGE_KEYS = ["ruum-tema", "ruum-theme"];
const MODO_KEY = "ruum-tema-modo";

interface TemaContexto {
  tema: Tema;
  modo: ModoTema;
  alternar: () => void;
  fijar: (t: Tema) => void;
  fijarModo: (m: ModoTema) => void;
}

const TemaCtx = createContext<TemaContexto>({
  tema: "light",
  modo: "auto",
  alternar: () => {},
  fijar: () => {},
  fijarModo: () => {}
});

function obtenerTemaAlmacenado(): Tema | null {
  if (typeof window === "undefined") return null;
  for (const key of STORAGE_KEYS) {
    try {
      const val = localStorage.getItem(key);
      if (val === "light" || val === "dark") return val;
    } catch {
      // Ignorar restricciones de almacenamiento (p. ej. iframe o modo privado extremo)
    }
  }
  return null;
}

function guardarTema(t: Tema) {
  if (typeof window === "undefined") return;
  for (const key of STORAGE_KEYS) {
    try {
      localStorage.setItem(key, t);
    } catch {
      // ignore
    }
  }
}

function obtenerModoAlmacenado(): ModoTema | null {
  if (typeof window === "undefined") return null;
  try {
    const m = localStorage.getItem(MODO_KEY);
    if (m === "auto" || m === "light" || m === "dark") return m;
  } catch {
    // Ignorar restricciones de almacenamiento
  }
  return null;
}

function guardarModo(m: ModoTema) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MODO_KEY, m);
  } catch {
    // ignore
  }
}

function resolverTema(modo: ModoTema): Tema {
  if (modo === "light" || modo === "dark") return modo;
  return "light";
}

function aplicarTema(t: Tema) {
  try {
    document.documentElement.setAttribute("data-theme", t);
  } catch {
    // ignore
  }
}

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [modo, setModo] = useState<ModoTema>("auto");
  const [tema, setTema] = useState<Tema>("light");

  useEffect(() => {
    // Por defecto se usa tema claro; solo una selección manual activa el tema oscuro.
    const modoGuardado = obtenerModoAlmacenado();
    const temaGuardado = obtenerTemaAlmacenado();
    const inicial: ModoTema = modoGuardado ?? (temaGuardado ?? "auto");
    setModo(inicial);
    const resuelto = resolverTema(inicial);
    setTema(resuelto);
    aplicarTema(resuelto);

  }, []);

  const fijarModo = useCallback((m: ModoTema) => {
    setModo(m);
    guardarModo(m);
    if (m === "auto") {
      // Volver a automático: se eliminan fijaciones manuales previas.
      try {
        for (const key of STORAGE_KEYS) localStorage.removeItem(key);
      } catch {
        // ignore
      }
    } else {
      guardarTema(m);
    }
    const resuelto = resolverTema(m);
    setTema(resuelto);
    aplicarTema(resuelto);
  }, []);

  const fijar = useCallback((t: Tema) => {
    setModo(t);
    guardarModo(t);
    setTema(t);
    aplicarTema(t);
    guardarTema(t);
  }, []);

  const alternar = useCallback(() => {
    fijar(tema === "dark" ? "light" : "dark");
  }, [tema, fijar]);

  return <TemaCtx.Provider value={{ tema, modo, alternar, fijar, fijarModo }}>{children}</TemaCtx.Provider>;
}

export function useTema() {
  return useContext(TemaCtx);
}

export function BotonTema() {
  const { modo, fijarModo } = useTema();
  const opciones: Array<{ valor: ModoTema; etiqueta: string }> = [
    { valor: "light", etiqueta: "Claro" },
    { valor: "dark", etiqueta: "Oscuro" },
    { valor: "auto", etiqueta: "Automático (sistema)" },
  ];
  return (
    <fieldset className="rounded-[12px] border border-[var(--ruum-border)] p-3">
      <legend className="px-1 font-body text-xs font-semibold text-[var(--ruum-text-secondary)]">Apariencia</legend>
      <div className="flex flex-col gap-1">
        {opciones.map((o) => (
          <label key={o.valor} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 font-body text-sm text-[var(--ruum-text)]">
            <input
              type="radio"
              name="ruum-apariencia"
              value={o.valor}
              checked={modo === o.valor}
              onChange={() => fijarModo(o.valor)}
              className="size-5 shrink-0 accent-[#0066FF]"
            />
            {o.etiqueta}
          </label>
        ))}
      </div>
      <div aria-hidden className="mt-2 flex items-center gap-2 rounded-[12px] bg-[var(--ruum-surface-elevated)] p-2.5">
        <span className="size-6 shrink-0 rounded-full bg-[var(--ruum-gradient-cta)]" />
        <span className="font-body text-xs text-[var(--ruum-text-secondary)]">Navy profundo · texto humo · acento teal</span>
      </div>
    </fieldset>
  );
}
