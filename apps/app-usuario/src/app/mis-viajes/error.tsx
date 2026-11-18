"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { MobileShell } from "@ruum/ui";
import { Button, EmptyState } from "@ruum/ui/base";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { reportarErrorBoundary } from "../../lib/reportar-error-boundary";

export default function ErrorMisTraslados({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // FIX C3: reportar a Sentry antes de mostrar el fallback.
    reportarErrorBoundary(error, "mis-viajes");
  }, [error]);
  return (
    <>
      <NavegacionUsuario variante="claro" />
      <MobileShell variant="wide" padding="none" conFondoCanvas={false} navInferiorVisible className="bg-ui-bg">
        <div className="px-4 pt-6 sm:px-6">
          <EmptyState
            icono={<CircleAlert />}
            titulo="No pudimos cargar tus traslados"
            descripcion="Puede ser una falla temporal de conexión. Intenta de nuevo en unos segundos."
            accion={
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={reset}>Reintentar</Button>
                <Button asChild variant="outline">
                  <Link href="/">Inicio</Link>
                </Button>
              </div>
            }
          />
        </div>
      </MobileShell>
    </>
  );
}
