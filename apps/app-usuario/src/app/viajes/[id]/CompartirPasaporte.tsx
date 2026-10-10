"use client";

import { useEffect, useRef, useState } from "react";

function IconoCompartir({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="5.5" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="18.5" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.3 10.8 6.9-4M8.3 13.2l6.9 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CompartirPasaporte({
  folio,
  variante = "barra",
}: {
  folio: string;
  variante?: "barra" | "cabecera";
}) {
  const [estado, setEstado] = useState<"ocioso" | "copiado" | "error">("ocioso");
  const temporizadorRef = useRef<number | null>(null);
  const montadoRef = useRef(true);

  /* El temporizador de 2,5 s vive dentro de `compartir()` (función async
     invocada por un evento), no dentro de un useEffect, así que el
     `return () => clearTimeout` no aplica. La guarda de montaje cubre los
     setState diferidos (los que siguen a un `await`: copiar al portapapeles o
     el diálogo nativo de compartir, que puede durar segundos abierto) y el
     clearTimeout suelta el temporizador al desmontar, para no dejarlo vivo
     hasta los 2,5 s. Se reinicia montadoRef en true porque el montaje doble de
     StrictMode ejecuta la limpieza antes del segundo montaje. */
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      if (temporizadorRef.current !== null) {
        window.clearTimeout(temporizadorRef.current);
        temporizadorRef.current = null;
      }
    };
  }, []);

  function cambiarEstado(nuevo: "ocioso" | "copiado" | "error") {
    if (montadoRef.current) setEstado(nuevo);
  }

  function programarRegresoAOcioso() {
    if (temporizadorRef.current !== null) window.clearTimeout(temporizadorRef.current);
    temporizadorRef.current = window.setTimeout(() => {
      temporizadorRef.current = null;
      cambiarEstado("ocioso");
    }, 2500);
  }

  async function compartir() {
    const url = window.location.href;
    const datos = {
      title: `Pasaporte Digital ${folio} · Ruum Ruum`,
      text: `Seguimiento y evidencia del traslado ${folio}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(datos);
        return;
      }
      await navigator.clipboard.writeText(url);
      cambiarEstado("copiado");
      programarRegresoAOcioso();
    } catch {
      // El usuario canceló el diálogo nativo: no es un error.
      if (estado === "error") cambiarEstado("ocioso");
      try {
        await navigator.clipboard.writeText(window.location.href);
        cambiarEstado("copiado");
        programarRegresoAOcioso();
      } catch {
        cambiarEstado("error");
      }
    }
  }

  if (variante === "cabecera") {
    return (
      <button
        type="button"
        onClick={compartir}
        aria-label={estado === "copiado" ? "Enlace copiado" : "Compartir pasaporte digital"}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#2e3a4b] transition-colors hover:bg-[#f2f6fc] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#1677ff]"
      >
        <IconoCompartir />
        <span className="sr-only" role="status">
          {estado === "copiado" ? "Enlace copiado al portapapeles" : estado === "error" ? "No se pudo compartir" : ""}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={compartir}
      className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-[16px] bg-[#0b1e33] px-4 text-[14px] font-bold text-[#fff] shadow-[0_8px_18px_-6px_rgba(11,30,51,0.3)] transition-transform active:scale-[0.98]"
    >
      <IconoCompartir />
      {estado === "copiado" ? "¡Enlace copiado!" : estado === "error" ? "Reintentar" : "Compartir"}
    </button>
  );
}
