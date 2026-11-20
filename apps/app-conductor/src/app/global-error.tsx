"use client";

import { Button as BaseButton } from "@ruum/ui/base";
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

  // Error del layout raíz: puede renderizarse sin el CSS ni el tema del producto.
  // Conservar estos colores autónomos para que el mensaje siga siendo legible.
  return (
    <html lang="es" data-theme="dark">
      <body className="min-h-screen bg-ui-bg text-ui-fg flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-display text-2xl font-bold mb-4 text-ui-danger">
          Ha ocurrido un error crítico
        </h2>
        <p className="font-body text-sm text-ui-fg-muted max-w-md mb-6">
          La aplicación experimentó un problema inesperado. Por favor, intenta recargar la pantalla.
        </p>
        <BaseButton variant="ghost" type="submit"
          onClick={() => reset()}
          className="min-h-11 px-6 py-2.5 rounded-xl bg-ui-brand text-ui-on-brand font-display font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          Reintentar
        </BaseButton>
      </body>
    </html>
  );
}
