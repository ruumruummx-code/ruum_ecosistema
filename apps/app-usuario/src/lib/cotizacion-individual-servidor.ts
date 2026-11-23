import "server-only";
import { crearClienteServicio } from "./supabase-servicio";
import { emitirCotizacionIndividualServidor, type SolicitudCotizadaIndividual } from "@ruum/api/services";

export type SolicitudCotizada = SolicitudCotizadaIndividual;

/** Solo el servidor puede emitir cotizaciones; nunca reutilizar cookies de sesión aquí. */
export async function cotizarSolicitudIndividual(authUserId: string, solicitud: SolicitudCotizada) {
  const cliente = crearClienteServicio();
  return emitirCotizacionIndividualServidor(cliente, authUserId, solicitud);
}
