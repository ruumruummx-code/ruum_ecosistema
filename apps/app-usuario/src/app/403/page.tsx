"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { NavegacionUsuario } from "../NavegacionUsuario";

function Contenido403() {
  const params = useSearchParams();
  const esConductor = params.get("reason") === "rol_conductor";

  return (
    <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="user-v2-content user-v2-content--wide flex min-h-[60vh] flex-col items-center justify-center py-20 text-center" role="alert" aria-live="assertive" aria-atomic="true">
        <p className="font-mono-ruum text-xs font-medium uppercase tracking-widest text-ink/60" aria-hidden="true">
          403
        </p>
        <h1 tabIndex={-1} className="mt-4 font-display text-3xl font-semibold leading-tight">
          Acceso no autorizado
        </h1>
        <p className="mt-3 max-w-sm font-body text-sm leading-6 text-ink/60">
          {esConductor
            ? "Esta sesión pertenece a una cuenta de conductor. Usa la app de conductor para continuar u inicia sesión con tu cuenta de usuario."
            : "No tienes permiso para ver este contenido con tu sesión actual."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-signal px-5 py-2.5 font-display text-sm font-bold text-ink transition hover:bg-signal/90"
          >
            Cambiar de cuenta
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink/20 bg-mist px-5 py-2.5 font-body text-sm font-medium text-ink transition hover:border-ink/40"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
    </>
  );
}

export default function PaginaProhibida() {
  return (
    <Suspense>
      <Contenido403 />
    </Suspense>
  );
}
