import { conciliarCheckouts } from "./_shared/stripe-checkouts.ts";
import { obtenerReembolsoCompletoStripe, type IntentoStripe } from "./_shared/stripe-verificacion.ts";
function assert(value: unknown, message = "assertion_failed"): asserts value { if (!value) throw new Error(message); }
const intent: IntentoStripe = { id: "pi_bulk", status: "succeeded", amount: 10000, amount_received: 10000, currency: "mxn", livemode: false, metadata: { carga_masiva_id: "bulk" } };
function backend() {
  const confirmations: unknown[] = [], expirations: unknown[] = [];
  const chain = { is: () => chain, order: () => chain, limit: async () => ({ data: [{ id: "bulk", stripe_payment_intent_id: "pi_bulk", monto_centavos: 10000, creado_en: "2026-01-01" }], error: null }) };
  const db = {
    from: () => ({ select: () => chain, update: (value: unknown) => ({ eq: () => ({ is: async () => { expirations.push(value); return { error: null }; } }) }) }),
    rpc: (_name: string, values: unknown) => { confirmations.push(values); return Promise.resolve({ error: null, data: { ok: true } }); }
  };
  return { db, confirmations, expirations };
}
Deno.test("bulk recovery confirms provider amount and never expires a paid checkout on retry", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(Response.json(intent));
  try {
    const api = backend();
    for (let i = 0; i < 2; i++) {
      const result = await conciliarCheckouts(api.db as never, "sk_test_unit");
      assert(result.confirmados === 1 && result.errores.length === 0);
    }
    assert(JSON.stringify(api.confirmations[0]) === JSON.stringify(api.confirmations[1]));
    assert(api.expirations.length === 0);
  } finally { globalThis.fetch = original; }
});
Deno.test("bulk mismatch and failed provider cancellation remain traceable without expiring", async () => {
  const original = globalThis.fetch;
  try {
    for (const snapshot of [{ ...intent, amount: 9999 }, { ...intent, status: "processing", amount_received: 0 }]) {
      const api = backend();
      globalThis.fetch = (input, init) => init?.method === "POST" || input instanceof Request && input.method === "POST"
        ? Promise.resolve(Response.json({ error: { message: "cannot_cancel", type: "invalid_request_error" } }, { status: 400 }))
        : Promise.resolve(Response.json(snapshot));
      const result = await conciliarCheckouts(api.db as never, "sk_test_unit");
      assert(result.errores.length === 1);
      assert(api.confirmations.length === 0 && api.expirations.length === 0);
    }
  } finally { globalThis.fetch = original; }
});
Deno.test("refund recovery checks current full-refund state and rejects identity mismatch", async () => {
  const original = globalThis.fetch;
  const snapshot = { ...intent, latest_charge: "ch_unit" };
  let charge = { id: "ch_unit", payment_intent: intent.id, livemode: false, currency: "mxn", amount: 10000, amount_refunded: 10000, refunded: true };
  globalThis.fetch = () => Promise.resolve(Response.json(charge));
  try {
    assert(await obtenerReembolsoCompletoStripe("sk_test_unit", snapshot) === "ch_unit");
    charge = { ...charge, refunded: false, amount_refunded: 1000 };
    assert(await obtenerReembolsoCompletoStripe("sk_test_unit", snapshot) === null);
    charge = { ...charge, livemode: true };
    let rejected = false;
    try { await obtenerReembolsoCompletoStripe("sk_test_unit", snapshot); } catch { rejected = true; }
    assert(rejected);
  } finally { globalThis.fetch = original; }
});
