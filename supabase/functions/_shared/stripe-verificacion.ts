export interface IntentoStripe {
  id: string; status: string; amount: number; amount_received: number;
  currency: string; livemode: boolean; metadata: Record<string,string>;
  latest_charge?: string | null;
}

export async function obtenerReembolsoCompletoStripe(clave: string, intent: IntentoStripe): Promise<string | null> {
  if (intent.status !== "succeeded" || !intent.latest_charge) return null;
  if (!/^ch_[a-zA-Z0-9]+$/.test(intent.latest_charge)) throw new Error("stripe_charge_id_invalid");
  const response = await fetch(`https://api.stripe.com/v1/charges/${intent.latest_charge}`, {
    headers: { Authorization: `Bearer ${clave}`, "Stripe-Version": "2026-09-30.endive" }, signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error("stripe_charge_retrieve_failed");
  const charge = await response.json();
  if (charge.id !== intent.latest_charge || charge.payment_intent !== intent.id || charge.livemode !== modoStripe(clave) || charge.currency !== intent.currency || charge.amount !== intent.amount) throw new Error("stripe_charge_identity_mismatch");
  return charge.refunded === true && charge.amount_refunded === charge.amount ? charge.id : null;
}

export function modoStripe(clave: string): boolean {
  const modo = clave.match(/^(?:sk|rk)_(test|live)_/);
  if (!modo) throw new Error("stripe_key_mode_unknown");
  return modo[1] === "live";
}

export async function obtenerIntentoStripe(clave: string, id: string): Promise<IntentoStripe> {
  if (!/^pi_[a-zA-Z0-9]+$/.test(id)) throw new Error("stripe_intent_id_invalid");
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${id}`, {
    headers: { Authorization: `Bearer ${clave}`, "Stripe-Version": "2026-09-30.endive" },
    signal: AbortSignal.timeout(20_000)
  });
  if (!res.ok) throw new Error(`stripe_retrieve_http_${res.status}`);
  const intent = await res.json() as IntentoStripe;
  if (intent.id !== id || intent.livemode !== modoStripe(clave)) throw new Error("stripe_environment_mismatch");
  return intent;
}

export function datosVerificacion(intent: IntentoStripe, modoEsperado: boolean, origen: "webhook" | "conciliacion", eventoId?: string) {
  if (intent.livemode !== modoEsperado) throw new Error("stripe_environment_mismatch");
  if (!intent.metadata?.traslado_id) throw new Error("stripe_transfer_metadata_missing");
  if (!Number.isSafeInteger(intent.amount) || !Number.isSafeInteger(intent.amount_received) || intent.amount < 0 || intent.amount_received < 0) throw new Error("stripe_amount_invalid");
  if (intent.currency !== "mxn") throw new Error("stripe_currency_mismatch");
  return {
    id: eventoId ?? `reconcile:${intent.id}:${intent.status}:${intent.amount_received}:${intent.livemode}`,
    intent_id: intent.id, traslado_id: intent.metadata.traslado_id, estado_proveedor: intent.status,
    monto_centavos: intent.amount, monto_recibido: intent.amount_received, moneda: intent.currency,
    livemode: intent.livemode, modo_esperado: modoEsperado, origen
  };
}
