"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Contenido403() {
  const params = useSearchParams();
  const esUsuario = params.get("reason") === "rol_usuario";

  return (
    <section aria-labelledby="acceso-restringido-title" className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <span className="font-mono text-sm font-bold uppercase tracking-widest text-warning">
        403 — Acceso Restringido
      </span>
      <h1 id="acceso-restringido-title" tabIndex={-1} className="mt-4 font-display text-2xl font-bold text-text-primary">
        Cuenta no autorizada para operar
      </h1>
      <p className="mt-3 max-w-md font-body text-sm text-text-secondary">
        {esUsuario
          ? "Esta sesión pertenece a una cuenta de pasajero/cliente. Para gestionar traslados, por favor inicia sesión con tu cuenta de conductor certificada."
          : "Tu cuenta actual no cuenta con los permisos de conductor requeridos para acceder a esta sección."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-route-action px-5 py-2.5 font-display text-sm font-bold text-text-inverse transition hover:opacity-90"
        >
          Cambiar de cuenta
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 font-body text-sm font-medium text-text-primary transition hover:bg-surface-elevated"
        >
          Ir al inicio
        </Link>
      </div>
    </section>
  );
}

export default function PaginaProhibida() {
  return (
    <Suspense fallback={null}>
      <Contenido403 />
    </Suspense>
  );
}
