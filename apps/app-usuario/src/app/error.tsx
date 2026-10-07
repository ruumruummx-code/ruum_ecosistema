"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { NavegacionUsuario } from "./NavegacionUsuario";

export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    console.error("[app/error]", { digest: error.digest ?? "sin-digest" });
  }, [error]);
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div
        className="user-v2-content user-v2-content--wide flex min-h-[60vh] flex-col items-center justify-center py-20 text-center"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-red-50">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <h1 ref={tituloRef} tabIndex={-1} className="font-display text-2xl font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2">Algo salió mal</h1>
        <p className="mt-3 max-w-sm font-body text-sm leading-6 text-ink/60">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-ink/50">
            Folio: {error.digest} · Menciona este folio al contactar <Link href="/soporte" className="underline underline-offset-2">soporte</Link>.
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink/20 bg-mist px-4 py-2 font-body text-sm font-medium text-ink transition hover:border-ink/40"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-signal px-4 py-2 font-display text-sm font-bold text-ink transition hover:bg-signal/90"
          >
            Ir al inicio
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="mt-6 max-w-lg font-mono text-xs text-red-600 opacity-70">
            {error.message}
          </p>
        )}
      </div>
    </main>
    </>
  );
}
