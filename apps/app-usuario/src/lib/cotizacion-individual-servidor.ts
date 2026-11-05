import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { emitirCotizacionIndividualServidor, type SolicitudCotizadaIndividual } from "@ruum/api/services";

export type SolicitudCotizada = SolicitudCotizadaIndividual;

/** Solo el servidor puede emitir cotizaciones; nunca reutilizar cookies de sesión aquí. */
export async function cotizarSolicitudIndividual(authUserId: string, solicitud: SolicitudCotizada) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("No se pudo acceder al servicio de cotizaciones.");
  const cliente = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return emitirCotizacionIndividualServidor(cliente, authUserId, solicitud);
}
