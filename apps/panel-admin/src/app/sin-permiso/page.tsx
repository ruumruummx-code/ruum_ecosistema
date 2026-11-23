import Link from "next/link";

export default function SinPermisoPage() {
  return (
    <main className="admin-page-shell">
      <section className="mx-auto max-w-lg rounded-lg border border-ui-line bg-ui-card px-6 py-10 text-center shadow-ui-sm sm:px-8">
        <p className="font-mono-ruum text-xs uppercase tracking-[0.16em] text-ui-brand">
          Acceso restringido
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ui-fg">
          No tienes permiso para abrir esta sección
        </h1>
        <p className="mt-3 font-body text-sm leading-6 text-ui-fg-muted">
          Tu sesión es válida, pero el rol administrativo asignado no incluye esta operación.
          Si necesitas acceso, contacta a un supervisor o a dirección.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-ui-brand px-4 py-2.5 font-body text-sm font-semibold text-ui-fg shadow-sm transition-colors hover:bg-ui-brand-hover"
          >
            Volver al dashboard
          </Link>
          <Link
            href="/viajes"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ui-line-strong bg-ui-card px-4 py-2.5 font-body text-sm font-semibold text-ui-fg-muted transition-colors hover:border-ui-brand/50 hover:text-ui-fg"
          >
            Ver traslados
          </Link>
        </div>
      </section>
    </main>
  );
}
