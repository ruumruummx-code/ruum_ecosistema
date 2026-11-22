"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

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
    <html lang="es">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-ui-bg p-6 text-center text-ui-fg">
        <h2 className="mb-2 text-2xl font-semibold text-ui-fg">
          Ha ocurrido un error crítico
        </h2>
        <p className="mb-6 max-w-md text-sm text-ui-fg-muted">
          La aplicación experimentó un problema inesperado. Por favor, intenta recargar la pantalla.
        </p>
        <button
          onClick={() => reset()}
          className="h-11 cursor-pointer rounded-md bg-ui-brand px-5 text-sm font-semibold text-ui-on-brand hover:bg-ui-brand-hover"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
