import { createHmac } from "node:crypto";
import { STRIPE_API_VERSION } from "./stripe.ts";

export const traslado = "11000000-0000-4000-8000-000000000010";
export const intentoPagado = {
  object: "payment_intent",
  id: "pi_Fase1",
  status: "succeeded",
  amount: 100_000,
  amount_received: 100_000,
  currency: "mxn",
  livemode: false,
  metadata: { traslado_id: traslado },
  latest_charge: null,
};

export const cargoParcial = {
  object: "charge",
  id: "ch_Fase1",
  payment_intent: intentoPagado.id,
  refunded: false,
  amount: intentoPagado.amount,
  amount_refunded: 23_456,
  currency: "mxn",
  livemode: false,
};

export const reembolsoParcial = {
  object: "refund",
  id: "re_Fase1",
  status: "succeeded",
  charge: cargoParcial.id,
};

export function eventoStripe<T extends { id: string; object: string }>(
  type: string,
  objeto: T,
  id = "evt_Fase1",
) {
  return {
    id,
    object: "event",
    type,
    api_version: STRIPE_API_VERSION,
    livemode: false,
    created: Math.floor(Date.now() / 1000),
    data: { object: objeto },
  };
}

export function solicitudStripe(
  evento: ReturnType<typeof eventoStripe>,
  secreto: string,
) {
  const body = JSON.stringify(evento);
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac("sha256", secreto).update(`${timestamp}.${body}`)
    .digest("hex");
  return new Request("https://edge.ruum.test/stripe-webhook", {
    method: "POST",
    headers: { "stripe-signature": `t=${timestamp},v1=${digest}` },
    body,
  });
}
