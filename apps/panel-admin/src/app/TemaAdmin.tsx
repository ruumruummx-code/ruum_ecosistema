"use client";

import { useEffect, useState } from "react";
import { Button } from "@ruum/ui/base";
import { Moon, Sun } from "lucide-react";

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

  const etiqueta = `Cambiar a tema ${tema === "dark" ? "claro" : "oscuro"}`;
  return (
    <Button variant="ghost" size="icon-sm" onClick={alternarTema} suppressHydrationWarning aria-label={etiqueta} title={etiqueta}>
      {tema === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
