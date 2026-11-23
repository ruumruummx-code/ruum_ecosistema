"use client";

import Link from "next/link";

export default function ErrorTraslados({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-display text-xl font-semibold">No pudimos cargar los traslados</h1>
      <p className="mt-2 font-body text-sm text-ui-fg-muted">
        Falla temporal de conexión. Intenta de nuevo en unos segundos.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ui-line-strong bg-ui-card px-4 py-2 font-body text-sm font-medium text-ui-fg transition hover:border-ui-field">
          Reintentar
        </button>
        <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-display text-sm font-bold text-ui-fg transition hover:bg-ui-brand-hover">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
