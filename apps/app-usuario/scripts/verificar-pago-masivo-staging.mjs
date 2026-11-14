#!/usr/bin/env node
/**
 * Script de validación de pagos reales para Carga Masiva en Staging (Stripe Test Mode + Supabase)
 * Resuelve y verifica la recomendación del ticket F03.
 *
 * Requisitos en el entorno:
 * - STRIPE_SECRET_KEY: Clave sk_test_... de Stripe en modo test.
 * - NEXT_PUBLIC_SUPABASE_URL: URL del proyecto Supabase Staging.
 * - SUPABASE_SERVICE_ROLE_KEY: Clave de rol de servicio para validar tablas y ejecutar RPC.
 *
 * Ejecución:
 *   node apps/app-usuario/scripts/verificar-pago-masivo-staging.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { createHash, createHmac, randomUUID } from "node:crypto";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

console.log("====================================================================");
console.log("  VERIFICACIÓN DE PAGOS REALES — CARGA MASIVA (STAGING / TEST MODE) ");
console.log("====================================================================");

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_KEY || !WEBHOOK_SECRET) {
  console.warn("⚠️ Faltan variables de entorno para ejecutar contra servicios vivos:");
  if (!STRIPE_SECRET_KEY) console.warn("  - STRIPE_SECRET_KEY (requiere sk_test_...)");
  if (!SUPABASE_URL) console.warn("  - SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_KEY) console.warn("  - SUPABASE_SERVICE_ROLE_KEY");
  console.log("\nPara ejecutar la prueba en Staging, exporta las variables y vuelve a ejecutar.");
  console.log("Revisa la documentación en apps/app-usuario/docs/STAGING_PAGO_MASIVO_TEST_GUIDE.md");
  if (!WEBHOOK_SECRET) console.warn("  - STRIPE_WEBHOOK_SECRET");
  process.exit(1);
}

if (!STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  console.error("STRIPE_SECRET_KEY debe ser una clave de Stripe en modo test (sk_test_...).");
  process.exit(1);
}

if (!WEBHOOK_SECRET.startsWith("whsec_")) {
  console.error("STRIPE_WEBHOOK_SECRET debe corresponder al endpoint de staging.");
  process.exit(1);
}

if (SUPABASE_URL.replace(/\/$/, "") !== "https://ytqhzrbmiczzwzzuzgbq.supabase.co") {
  console.error("La URL debe corresponder al proyecto aislado ruum-ruum-staging.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function llamarStripe(endpoint, params) {
  const url = `https://api.stripe.com/v1/${endpoint}`;
  const res = await fetch(url, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Error en Stripe API (${endpoint}): ${data.error?.code ?? data.error?.type ?? res.status}`);
  }
  return data;
}

async function ejecutarValidacion() {
  const perfilId = randomUUID();
  const testCheckoutId = randomUUID();
  const testUserEmail = `qa_masivo_${Date.now()}@ruum.test`;

  console.log(`\n1. Creando usuario de prueba temporal: ${testUserEmail}...`);
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: testUserEmail,
    email_confirm: true,
    user_metadata: { nombre: "QA Tester Masivo" },
  });

  if (authErr) {
    throw new Error(`No se pudo crear usuario auth en Supabase: ${authErr.message}`);
  }

  const testUserId = authUser.user.id;
  try {
    const { data: perfil, error: perfilErr } = await supabase.from("usuarios").select("id").eq("auth_user_id", testUserId).maybeSingle();
    if (perfilErr) throw perfilErr;
    const usuarioId = perfil?.id ?? perfilId;
    const { error: usuarioErr } = await supabase.from("usuarios").upsert({
      id: usuarioId,
      auth_user_id: testUserId,
      tipo_cuenta: "personal",
      estado_verificacion: "verificado",
    });
    if (usuarioErr) throw usuarioErr;
    console.log(`Usuario: ${usuarioId}; checkout: ${testCheckoutId}`);
    const cantidadTraslados = 3;
    const tarifaPorTraslado = 1500; // $1,500 MXN
    const montoCentavos = cantidadTraslados * tarifaPorTraslado * 100; // 450,000 centavos

    const filasPrueba = Array.from({ length: cantidadTraslados }).map((_, i) => ({
      vehiculo_marca: "Nissan",
      vehiculo_modelo: "Versa",
      vehiculo_anio: "2024",
      vehiculo_tipo: "sedan",
      vehiculo_placas: `STG${i + 1}00`,
      categoria_tarifa: "ligero_a",
      gama: "media",
      condicion: "seminueva",
      origen_direccion: "Av. Insurgentes Sur 1200, CDMX",
      destino_direccion: "Av. Paseo de la Reforma 222, CDMX",
      origen_ciudad: "CDMX",
      destino_ciudad: "CDMX",
      origen_lat: "19.37",
      origen_lng: "-99.17",
      destino_lat: "19.43",
      destino_lng: "-99.16",
    }));

    const cotizacionesPrueba = Array.from({ length: cantidadTraslados }).map(() => ({
      tarifa: tarifaPorTraslado,
    }));

    console.log("2. Creando PaymentIntent en Stripe en modo test...");
    const intent = await llamarStripe("payment_intents", {
      amount: String(montoCentavos),
      currency: "mxn",
      "automatic_payment_methods[enabled]": "true",
      "automatic_payment_methods[allow_redirects]": "never",
      description: `Lote QA Carga Masiva ${testCheckoutId}`,
      "metadata[carga_masiva_id]": testCheckoutId,
    });
    console.log(`   PaymentIntent creado: ${intent.id} por $${(montoCentavos / 100).toFixed(2)} MXN`);

    if (intent.livemode !== false) throw new Error("El intento no corresponde al modo test.");
    const { error: insErr } = await supabase.from("checkout_traslados_masivos").insert({
      id: testCheckoutId,
      auth_user_id: testUserId,
      filas: filasPrueba,
      cotizaciones: cotizacionesPrueba,
      monto_centavos: montoCentavos,
      idempotency_key: testCheckoutId,
      route_hash: createHash("sha256").update(JSON.stringify(filasPrueba)).digest("hex"),
      stripe_payment_intent_id: intent.id,
    });
    if (insErr) throw insErr;

    const confirmado = await llamarStripe(`payment_intents/${intent.id}/confirm`, {
      payment_method: "pm_card_visa",
    });
    if (confirmado.status !== "succeeded" || confirmado.livemode !== false ||
        confirmado.amount_received !== montoCentavos || confirmado.currency !== "mxn") {
      throw new Error(`Stripe devolvió un pago inesperado: ${confirmado.status}.`);
    }
    console.log(`Stripe confirmó ${confirmado.id}: ${confirmado.amount_received} centavos MXN, livemode=false.`);

    const limite = Date.now() + 60_000;
    let evento;
    while (!evento && Date.now() < limite) {
      const eventos = await llamarStripe("events?type=payment_intent.succeeded&limit=100");
      evento = eventos.data.find(item => item.livemode === false && item.data.object.id === intent.id);
      if (!evento) await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (!evento) throw new Error("Stripe no devolvió el evento payment_intent.succeeded del intento.");
    const body = JSON.stringify(evento);
    async function entregarWebhook() {
      const timestamp = Math.floor(Date.now() / 1000);
      const firma = createHmac("sha256", WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest("hex");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": `t=${timestamp},v1=${firma}` },
        body,
        signal: AbortSignal.timeout(30_000),
      });
      const respuesta = await res.text();
      console.log(`Webhook HTTPS ${evento.id}: HTTP ${res.status}, ${respuesta}`);
      if (!res.ok || respuesta !== "ok") throw new Error("Falló la entrega al webhook de staging.");
    }

    await entregarWebhook();
    console.log("3. Verificando integridad directa en la base de datos Supabase:");
    const { data: checkoutDb } = await supabase
      .from("checkout_traslados_masivos")
      .select("pagado_en, carga_id")
      .eq("id", testCheckoutId)
      .single();

    if (!checkoutDb?.pagado_en) {
      throw new Error("ERROR: El registro checkout_traslados_masivos no tiene 'pagado_en' poblado.");
    }
    console.log(`   ✓ checkout_traslados_masivos.pagado_en: ${checkoutDb.pagado_en}`);

    const { count: conteoTraslados } = await supabase
      .from("traslados")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuarioId);

    console.log(`   ✓ Conteo de traslados creados: ${conteoTraslados} (esperado: ${cantidadTraslados})`);
    if (conteoTraslados !== cantidadTraslados) {
      throw new Error(`ERROR: Discrepancia en traslados. Esperados: ${cantidadTraslados}, Creados: ${conteoTraslados}`);
    }

    const { data: pagos, error: pagosErr } = await supabase
      .from("pagos")
      .select("id, traslado_id, monto, estado")
      .eq("checkout_masivo_id", testCheckoutId);
    if (pagosErr) throw pagosErr;

    const totalCentavos = pagos.reduce((total, pago) => total + Math.round(Number(pago.monto) * 100), 0);
    if (pagos.length !== cantidadTraslados || pagos.some(pago => pago.estado !== "completado") ||
        new Set(pagos.map(pago => pago.traslado_id)).size !== cantidadTraslados || totalCentavos !== montoCentavos) {
      throw new Error("Los pagos no coinciden con los tres traslados y el importe cotizado.");
    }
    console.log(`   ✓ ${pagos.length} pagos completados por ${totalCentavos} centavos MXN.`);

    console.log("4. Reenviando el mismo evento de Stripe al webhook de staging...");
    await entregarWebhook();

    const { count: conteoTrasladosPostReintento } = await supabase
      .from("traslados")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuarioId);

    const { count: conteoPagosPostReintento } = await supabase
      .from("pagos")
      .select("*", { count: "exact", head: true })
      .eq("checkout_masivo_id", testCheckoutId);

    console.log(`   ✓ Traslados post reintento: ${conteoTrasladosPostReintento} (sin duplicaciones)`);
    console.log(`   ✓ Pagos post reintento: ${conteoPagosPostReintento} (sin duplicaciones)`);

    if (conteoTrasladosPostReintento !== cantidadTraslados || conteoPagosPostReintento !== cantidadTraslados) {
      throw new Error("ERROR DE IDEMPOTENCIA: La repetición del webhook generó registros duplicados.");
    }

    console.log("\n====================================================================");
    console.log("  RESULTADO: TODAS LAS PRUEBAS EN STAGING PASARON SATISFACTORIAMENTE");
    console.log("  - Cobro real con Stripe Test Mode: Confirmado.");
    console.log("  - Conciliación y creación exacta de N traslados: Validado.");
    console.log("  - Idempotencia ante eventos repetidos de Webhook: Comprobado.");
    console.log("====================================================================\n");
  } finally {
    console.log(`Datos del lote disponibles para auditoría SQL. Auth ID: ${testUserId}; checkout: ${testCheckoutId}.`);
  }
}

ejecutarValidacion().catch((err) => {
  console.error("\n❌ Error en la prueba de integración de staging:", err);
  process.exit(1);
});
