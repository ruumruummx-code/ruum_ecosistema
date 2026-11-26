import { construirCabecerasCors } from "../_shared/cors-documentos.ts";

/** Conserva el origen de la petición en todas las respuestas, incluidos errores. */
export function crearRespuestaJson(req: Request) {
  return (body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...extraHeaders,
        ...construirCabecerasCors(req),
        "Content-Type": "application/json"
      }
    });
}
