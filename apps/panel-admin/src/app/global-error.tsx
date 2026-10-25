"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es" data-theme="dark">
      <body className="min-h-screen bg-[#070B14] text-[#E8EDF6] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-display text-2xl font-bold mb-4 text-[#FF6B6B]">
          Ha ocurrido un error crítico
        </h2>
        <p className="font-body text-sm text-[#B7C2D4] max-w-md mb-6">
          La aplicación experimentó un problema inesperado. Por favor, intenta recargar la pantalla.
        </p>
        <button
          onClick={() => reset()}
          className="min-h-11 px-6 py-2.5 rounded-xl bg-[#F5A623] text-[#070B14] font-display font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
