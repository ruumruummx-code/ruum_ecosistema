import { manejarInicioDidit } from "./handler.ts";

Deno.serve((req) => manejarInicioDidit(req));
