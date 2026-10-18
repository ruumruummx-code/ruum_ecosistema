import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "../../lib/supabase-server";
import { listarTrasladosDeUsuario, obtenerUsuarioActual } from "@ruum/api/services";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { MobileShell, Icono } from "@ruum/ui";

// El destino depende de la sesión y del traslado activo del usuario. Evita
// que el despliegue genere una versión estática compartida entre sesiones.
export const dynamic = "force-dynamic";

export default async function PaginaPasaporte() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const login = new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
    login.searchParams.set("reason", "authentication_required");
    login.searchParams.set("next", "/pasaporte");
    redirect(`${login.pathname}${login.search}`);
  }

  let usuario = null;
  let traslados: Awaited<ReturnType<typeof listarTrasladosDeUsuario>> = [];

  try {
    const cliente = await crearClienteServidor();
    usuario = await obtenerUsuarioActual(cliente);
    if (usuario) {
      traslados = await listarTrasladosDeUsuario(cliente, usuario.id);
    }
  } catch {
    // Falla de red o sesión ausente
  }

  if (!usuario) {
    const login = new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
    login.searchParams.set("reason", "authentication_required");
    login.searchParams.set("next", "/pasaporte");
    redirect(`${login.pathname}${login.search}`);
  }

  const activo = traslados.find(
    (t) =>
      t.traslado_id &&
      t.estado &&
      !["servicio_cerrado", "servicio_cancelado", "traslado_fallido"].includes(t.estado)
  );

  if (activo?.traslado_id) {
    redirect(`/viajes/${activo.traslado_id}`);
  }

  // Empty-state dedicado: sin traslados activos informa claramente y da acceso a nuevo traslado
  return (
    <>
      <NavegacionUsuario variante="claro" nombreUsuario={usuario.nombre} />
      <MobileShell variant="compact" navInferiorVisible={true}>
        <main className="user-empty-passport flex min-h-[60vh] flex-col items-center justify-center p-6 text-center" aria-live="polite">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--user-color-card)] text-[var(--user-color-action)] shadow-sm border border-[var(--user-color-border)] mb-4">
            <Icono d="M9 12h6 M9 16h6 M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" className="size-8" />
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--user-color-primary)] sm:text-2xl">
            Aún no tienes traslados activos
          </h1>
          <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-[var(--user-color-muted)]">
            El Pasaporte Digital documenta la ruta, la custodia y la evidencia fotográfica en tiempo real de tu vehículo durante su traslado.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/viajes/nuevo"
              className="user-v2-primary-button inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold"
            >
              Solicitar nuevo traslado
            </Link>
            {traslados.length > 0 && (
              <Link
                href="/mis-viajes"
                className="user-v2-secondary-button inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold"
              >
                Ver historial de traslados ({traslados.length})
              </Link>
            )}
          </div>
        </main>
      </MobileShell>
    </>
  );
}
