import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "../../lib/supabase-server";
import { obtenerUsuarioActual } from "@ruum/api/services";
import { Button, MarcoPantalla } from "@ruum/ui/base";

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
    <MarcoPantalla as="main" variant="compact" navInferiorVisible={false}>
      <section className="mx-auto max-w-xl p-6 text-center" role="alert">
        <h1 className="text-xl font-bold">Estamos preparando tu cuenta</h1>
        <p className="mt-3 text-sm text-ui-fg-muted">
          Estamos terminando de preparar tu perfil. Intenta de nuevo en unos segundos o contacta a soporte si el problema persiste.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link href="/">Reintentar</Link></Button>
          <Button asChild variant="secondary"><Link href="/soporte">Ir a soporte</Link></Button>
        </div>
      </section>
    </MarcoPantalla>
  );
}
