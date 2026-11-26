import { manejarWebhookDidit } from "./handler.ts";

Deno.serve((req) => manejarWebhookDidit(req));
