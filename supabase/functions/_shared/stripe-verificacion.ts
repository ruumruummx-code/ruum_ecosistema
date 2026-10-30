export interface IntentoStripe {
  id: string; status: string; amount: number; amount_received: number;
  currency: string; livemode: boolean; metadata: Record<string,string>;
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
