import "server-only";
import Stripe from "stripe";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { obtenerClienteBilleteraServidor, vincularClienteBilleteraServidor } from "@ruum/api/services";

export function serviciosBilletera() {
  const key = process.env.STRIPE_SECRET_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const servicioKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !url || !servicioKey) throw new Error("La billetera no está disponible temporalmente.");
  const modo = /^(sk|rk)_test_/.test(key) ? "test" : "live";
  return {
    stripe: new Stripe(key, { timeout: 15000, maxNetworkRetries: 1 }),
    servicio: createClient(url, servicioKey, { auth: { persistSession: false, autoRefreshToken: false } }),
    modo: modo as "test" | "live",
  };
}

export async function clienteBilletera(authId: string, crear = false) {
  const { stripe, servicio, modo } = serviciosBilletera();
  let id = await obtenerClienteBilleteraServidor(servicio, authId, modo);
  if (!id && crear) {
    const nuevo = await stripe.customers.create({ metadata: { ruum_auth_user_id: authId } }, {
      idempotencyKey: `billetera-${modo}-${authId}`,
    });
    id = await vincularClienteBilleteraServidor(servicio, authId, modo, nuevo.id);
  }
  if (!id) return { stripe, customer: null };
  const customer = await stripe.customers.retrieve(id);
  if (customer.deleted || customer.metadata.ruum_auth_user_id !== authId) throw new Error("No se pudo verificar la billetera.");
  return { stripe, customer };
}

export async function listarTarjetasBilletera(authId: string) {
  const { stripe, customer } = await clienteBilletera(authId);
  if (!customer) return { tarjetas: [] };
  const tarjetas = [];
  for await (const pm of stripe.customers.listPaymentMethods(customer.id, { type: "card", limit: 100 })) {
    if (pm.card) tarjetas.push({ id: pm.id, marca: pm.card.brand, ultimos4: pm.card.last4,
      mes: pm.card.exp_month, anio: pm.card.exp_year, predeterminada: customer.invoice_settings.default_payment_method === pm.id });
  }
  return { tarjetas };
}

export async function modificarTarjetaBilletera(authId: string, id: string, accion: "eliminar" | "predeterminar") {
  const { stripe, customer } = await clienteBilletera(authId);
  if (!customer) throw new Error("Tarjeta no disponible.");
  const pm = await stripe.paymentMethods.retrieve(id);
  if (pm.customer !== customer.id || pm.type !== "card") throw new Error("Tarjeta no disponible.");
  if (accion === "predeterminar") {
    await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: id } });
  } else {
    // Stripe elimina también la referencia predeterminada al desvincular el método.
    await stripe.paymentMethods.detach(id);
  }
}

export async function iniciarAltaTarjeta(authId: string, origen: string, clave: string) {
  const { stripe, customer } = await clienteBilletera(authId, true);
  if (!customer) throw new Error("Billetera no disponible.");
  const etiqueta = Array.from(createHash("sha256").update(clave).digest().subarray(0, 8), n => String.fromCharCode(97 + n % 26)).join("");
  const session = await stripe.checkout.sessions.create({
    integration_identifier: `ruum-billetera-${etiqueta}`,
    mode: "setup", customer: customer.id, currency: "mxn",
    success_url: `${origen}/cuenta/metodos-pago?registro=regreso`,
    cancel_url: `${origen}/cuenta/metodos-pago`,
    setup_intent_data: { metadata: { ruum_auth_user_id: authId } },
  }, { idempotencyKey: `alta-tarjeta-${authId}-${clave}` });
  if (!session.url) throw new Error("No se pudo abrir el registro seguro.");
  return { url: session.url };
}

export async function sesionBilleteraCheckout(authId: string, intentId: string) {
  const { stripe, customer } = await clienteBilletera(authId);
  if (!customer) return { customerSessionClientSecret: null };
  const intent = await stripe.paymentIntents.retrieve(intentId);
  // Intents antiguos sin Customer continúan con su captura original; no recrearlos ni cobrar otra vez.
  if (!intent.customer) return { customerSessionClientSecret: null };
  if (intent.customer !== customer.id) throw new Error("Este pago no pertenece a la billetera.");
  const sesion = await stripe.customerSessions.create({ customer: customer.id,
    components: { payment_element: { enabled: true, features: { payment_method_redisplay: "enabled" } } },
  });
  return { customerSessionClientSecret: sesion.client_secret };
}
