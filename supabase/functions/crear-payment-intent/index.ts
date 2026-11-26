import { manejarCrearPaymentIntent } from "./handler.ts";

Deno.serve((req) => manejarCrearPaymentIntent(req));
