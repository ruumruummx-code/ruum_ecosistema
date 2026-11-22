"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AdminButton } from "./admin-components";

export default function ErrorGlobalAdmin({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[panel-admin/error]", { digest: error.digest ?? "sin-digest" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-ui-danger-soft text-ui-danger">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
        </svg>
      </div>
      <h1 className="font-display text-2xl font-semibold">Algo salió mal</h1>
      <p className="mt-3 max-w-sm font-body text-sm leading-6 text-ui-fg-muted">
        Ocurrió un error inesperado en el panel. Puedes reintentar o volver al dashboard.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <p className="mt-4 max-w-lg font-mono text-xs text-ui-danger opacity-70">{error.message}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <AdminButton variant="secondary" onClick={reset}>
          Reintentar
        </AdminButton>
        <Link
          href="/"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ui-brand bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg transition-colors hover:bg-ui-brand-hover"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
