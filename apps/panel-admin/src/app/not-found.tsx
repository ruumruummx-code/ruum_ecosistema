import Link from "next/link";

export default function PaginaNoEncontradaAdmin() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-mono-ruum text-xs font-medium uppercase tracking-widest text-ui-fg-muted">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold leading-tight">
        Página no encontrada
      </h1>
      <p className="mt-3 max-w-sm font-body text-sm leading-6 text-ui-fg-muted">
        La sección que buscas no existe o fue movida. Verifica el enlace o vuelve al dashboard.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ui-brand bg-ui-brand px-5 py-2.5 font-body text-sm font-semibold text-ui-fg transition-colors hover:bg-ui-brand-hover"
        >
          Ir al dashboard
        </Link>
        <Link
          href="/viajes"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ui-line bg-ui-card px-5 py-2.5 font-body text-sm font-semibold text-ui-fg transition-colors hover:bg-ui-muted"
        >
          Ver traslados
        </Link>
      </div>
    </div>
  );
}
