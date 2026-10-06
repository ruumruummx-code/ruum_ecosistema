import { redirect } from "next/navigation";
import { crearClienteServidor } from "../../lib/supabase-server";
import { listarTrasladosDeUsuario, obtenerUsuarioActual } from "@ruum/api/services";

// El destino depende de la sesión y del traslado activo del usuario. Evita
// que el despliegue genere una versión estática compartida entre sesiones.
export const dynamic = "force-dynamic";

export default async function PaginaPasaporteRedirect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let destino = "/mis-viajes";
  let haySesion = false;

  if (url && anonKey) {
    try {
      const cliente = await crearClienteServidor();
      const usuario = await obtenerUsuarioActual(cliente);
      if (usuario) {
        haySesion = true;
        const traslados = await listarTrasladosDeUsuario(cliente, usuario.id);
        const activo = traslados.find(
          (t) =>
            t.traslado_id &&
            t.estado &&
            !["servicio_cerrado", "servicio_cancelado", "traslado_fallido"].includes(t.estado)
        );
        if (activo?.traslado_id) {
          destino = `/viajes/${activo.traslado_id}`;
        }
      }
    } catch {
      // Si falla o no hay sesión, va a mis Traslados
    }
  }

  /* CORRECCIÓN (auditoría F5): sin sesión, redirigir a /mis-viajes devolvía 404
     (ruta mal escrita) en vez de enviar a /login, enmascarando el motivo real del
     fallo de autenticación. */
  if (!haySesion) {
    const login = new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
    login.searchParams.set("reason", "authentication_required");
    login.searchParams.set("next", "/pasaporte");
    redirect(`${login.pathname}${login.search}`);
  }

  redirect(destino);
}
