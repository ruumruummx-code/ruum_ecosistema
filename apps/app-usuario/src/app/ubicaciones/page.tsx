import type { Metadata } from "next";
import Link from "next/link";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { IconoUbicaciones } from "../../components/layout/user-navigation-icons";

export const metadata: Metadata = {
  title: "Mis ubicaciones — Ruum Ruum",
  robots: { index: false, follow: false },
};

async function obtenerUsuarioSesion() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const { crearClienteServidor } = await import("../../lib/supabase-server");
    const { obtenerUsuarioActual } = await import("@ruum/api/services");
    const cliente = await crearClienteServidor();
    return await obtenerUsuarioActual(cliente);
  } catch {
    return null;
  }
}

export default async function PaginaUbicaciones() {
  const usuario = await obtenerUsuarioSesion();

  return (
    <UserDashboardLayout
      usuario={usuario}
      nombre={usuario?.nombre}
      padding="compacto"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Cabecera de la sección */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ruum-text)]">
              Mis ubicaciones
            </h1>
            <p className="mt-1 text-xs text-[var(--ruum-text-secondary)]">
              Administra tus domicilios habituales de recolección y entrega para cotizar tus traslados en segundos.
            </p>
          </div>

          <Link
            href="/viajes/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--rr-sidebar-active,#075be8)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ruum-focus)]"
          >
            <IconoUbicaciones className="size-4" />
            Nuevo traslado con ubicación
          </Link>
        </div>

        {/* Estado inicial / Sin ubicaciones guardadas */}
        <div className="rounded-2xl border border-[var(--rr-border,#e3eaf3)] bg-[var(--rr-header-bg,#ffffff)] p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--ruum-action-bg,#e6f0ff)] text-[var(--rr-sidebar-active,#075be8)]">
            <IconoUbicaciones className="size-7" />
          </div>

          <h2 className="mt-4 font-display text-base font-bold text-[var(--ruum-text)]">
            Sin ubicaciones guardadas aún
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[var(--ruum-text-secondary)]">
            Tus puntos frecuentes de origen y destino en todo México se guardarán automáticamente
            aquí al registrar y gestionar tus traslados.
          </p>

          <div className="mt-6 flex justify-center">
            <Link
              href="/viajes/nuevo"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--rr-border,#e3eaf3)] bg-[var(--ruum-surface-subtle)] px-4 py-2 text-xs font-semibold text-[var(--ruum-text)] transition hover:bg-[var(--ruum-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ruum-focus)]"
            >
              Registrar primer traslado
            </Link>
          </div>
        </div>
      </div>
    </UserDashboardLayout>
  );
}
