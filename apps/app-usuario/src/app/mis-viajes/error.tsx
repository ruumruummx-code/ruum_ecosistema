"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MobileShell } from "@ruum/ui";
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
      <MobileShell variant="compact" navInferiorVisible className="user-v2-scope user-transfers-shell" contentClassName="user-transfers-content"><div className="user-transfers-fallback text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-danger-soft">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            className="text-danger" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-semibold">No pudimos cargar tus Traslados</h2>
        <p className="mt-2 font-body text-sm text-ink/60">
          Puede ser una falla temporal de conexión. Intenta de nuevo en unos segundos.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-ink/20 bg-mist px-4 py-2 font-body text-sm font-medium text-ink transition hover:border-ink/40"
          >
            Reintentar
          </button>
          <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-signal px-4 py-2 font-display text-sm font-bold text-ink transition hover:bg-signal/90">
            Inicio
          </Link>
        </div>
      </div>
    </MobileShell>
    </>
  );
}
