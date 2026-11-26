import { manejarCancelarTraslado } from "./handler.ts";

Deno.serve((req) => manejarCancelarTraslado(req));
