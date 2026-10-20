"use client";

import { useEffect, useState } from "react";

type TemaAdmin = "light" | "dark";

function temaActual(): TemaAdmin {
  try {
    const stored = localStorage.getItem("ruum-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Continuar con el atributo aplicado por el inicializador.
  }
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function SelectorTemaAdmin() {
  // El primer render debe coincidir con el servidor; el efecto lee el tema guardado.
  const [tema, setTema] = useState<TemaAdmin>("light");

  useEffect(() => {
    setTema(temaActual());
  }, []);

  function alternarTema() {
    const siguiente: TemaAdmin = tema === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = siguiente;
    try {
      localStorage.setItem("ruum-theme", siguiente);
    } catch {
      // El tema también funciona si el almacenamiento está bloqueado.
    }
    setTema(siguiente);
  }

  return (
    <button
      type="button"
      onClick={alternarTema}
      className="admin-theme-toggle"
      suppressHydrationWarning
      aria-label={`Cambiar a tema ${tema === "dark" ? "claro" : "oscuro"}`}
      title={`Cambiar a tema ${tema === "dark" ? "claro" : "oscuro"}`}
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {tema === "dark" ? (
          <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>
        ) : (
          <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
        )}
      </svg>
    </button>
  );
}
