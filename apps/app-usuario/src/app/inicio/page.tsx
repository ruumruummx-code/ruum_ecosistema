import Link from "next/link";
import { redirect } from "next/navigation";
import { MobileShell } from "@ruum/ui";
import { crearClienteServidor } from "../../lib/supabase-server";
import { obtenerUsuarioActual } from "@ruum/api/services";

/**
 * Entrada protegida del dashboard. El dashboard histórico sigue viviendo en
 * `/` para conservar compatibilidad de enlaces; esta ruta fija el contrato de
 * navegación autenticada y evita que una identidad sin perfil se convierta en
 * landing pública o dispare una escritura implícita.
 */
export default async function PaginaInicioProtegido() {
  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) redirect("/login?next=/inicio");

  const usuario = await obtenerUsuarioActual(cliente);
  if (usuario) redirect("/");

  return (
    <MobileShell as="main" variant="compact" navInferiorVisible={false}>
      <section className="mx-auto max-w-xl p-6 text-center" role="alert">
        <h1 className="text-xl font-bold">Estamos preparando tu cuenta</h1>
        <p className="mt-3 text-sm text-[var(--user-color-muted)]">
          Tu sesión es válida, pero todavía no encontramos el perfil asociado.
          No se creó ningún perfil automáticamente durante esta lectura.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="user-v2-primary-button px-5 py-3">Reintentar</Link>
          <Link href="/soporte" className="user-v2-secondary-button px-5 py-3">Soporte público</Link>
        </div>
      </section>
    </MobileShell>
  );
}
