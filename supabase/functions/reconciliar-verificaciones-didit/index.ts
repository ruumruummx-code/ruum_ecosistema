import { manejarConciliacionDidit } from "./handler.ts";

Deno.serve((req) => manejarConciliacionDidit(req));
