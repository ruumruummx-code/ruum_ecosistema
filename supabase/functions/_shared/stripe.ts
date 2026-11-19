/**
 * Versión única del SDK y de la API de Stripe para todas las Edge Functions.
 *
 * Antes crear-payment-intent usaba `stripe@^17` (rango flotante, API
 * 2025-02-24.acacia) y el webhook `stripe@23.0.0` (2026-09-30.endive): el
 * mismo objeto podía llegar con formas distintas según quién lo leyera.
 * Cualquier cambio de versión se hace aquí y en un solo despliegue.
 */
import Stripe from "npm:stripe@23.0.0";

export { Stripe };
export const STRIPE_API_VERSION = "2026-09-30.endive" as const;

export function crearStripe(clave: string): Stripe {
  return new Stripe(clave, { apiVersion: STRIPE_API_VERSION, httpClient: Stripe.createFetchHttpClient() });
}
