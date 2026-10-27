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
import { randomUUID } from "node:crypto";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("====================================================================");
console.log("  VERIFICACIÓN DE PAGOS REALES — CARGA MASIVA (STAGING / TEST MODE) ");
console.log("====================================================================");

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("⚠️ Faltan variables de entorno para ejecutar contra servicios vivos:");
  if (!STRIPE_SECRET_KEY) console.warn("  - STRIPE_SECRET_KEY (requiere sk_test_...)");
  if (!SUPABASE_URL) console.warn("  - SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_KEY) console.warn("  - SUPABASE_SERVICE_ROLE_KEY");
  console.log("\nPara ejecutar la prueba en Staging, exporta las variables y vuelve a ejecutar.");
  console.log("Revisa la documentación en apps/app-usuario/docs/STAGING_PAGO_MASIVO_TEST_GUIDE.md");
  process.exit(0);
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
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Error en Stripe API (${endpoint}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function ejecutarValidacion() {
  const testUserId = randomUUID();
  const testCheckoutId = randomUUID();
  const testUserEmail = `qa_masivo_${Date.now()}@ruum.test`;

  console.log(`\n1. Creando usuario de prueba temporal: ${testUserEmail}...`);
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    id: testUserId,
    email: testUserEmail,
    email_confirm: true,
    user_metadata: { nombre: "QA Tester Masivo" },
  });

  if (authErr) {
    throw new Error(`No se pudo crear usuario auth en Supabase: ${authErr.message}`);
  }

  await supabase.from("usuarios").insert({
    id: randomUUID(),
    auth_user_id: testUserId,
    tipo_cuenta: "personal",
    estado_verificacion: "verificado",
  });

  try {
    console.log("2. Insertando lote de prueba en checkout_traslados_masivos...");
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

    console.log("3. Creando PaymentIntent en Stripe en modo test...");
    const intent = await llamarStripe("payment_intents", {
      amount: String(montoCentavos),
      currency: "mxn",
      payment_method_types: ["card"],
      description: `Lote QA Carga Masiva ${testCheckoutId}`,
      metadata: { checkout_id: testCheckoutId },
    });
    console.log(`   PaymentIntent creado: ${intent.id} por $${(montoCentavos / 100).toFixed(2)} MXN`);

    console.log("4. Confirmando pago en Stripe con tarjeta de prueba oficial (pm_card_visa)...");
    const intentConfirmado = await llamarStripe(`payment_intents/${intent.id}/confirm`, {
      payment_method: "pm_card_visa",
    });

    if (intentConfirmado.status !== "succeeded") {
      throw new Error(`El PaymentIntent no alcanzó el estado succeeded. Estado actual: ${intentConfirmado.status}`);
    }
    console.log("   ✓ Pago en Stripe exitoso (status: succeeded).");

    console.log("5. Registrando lote en Supabase...");
    const { error: insErr } = await supabase.from("checkout_traslados_masivos").insert({
      id: testCheckoutId,
      auth_user_id: testUserId,
      filas: filasPrueba,
      cotizaciones: cotizacionesPrueba,
      monto_centavos: montoCentavos,
      stripe_payment_intent_id: intent.id,
    });
    if (insErr) throw insErr;

    console.log("6. Ejecutando RPC de conciliación 'confirmar_checkout_masivo'...");
    const { data: cargaId1, error: rpcErr1 } = await supabase.rpc("confirmar_checkout_masivo", {
      p_id: testCheckoutId,
      p_intent: intent.id,
      p_monto: montoCentavos,
      p_moneda: "mxn",
    });
    if (rpcErr1) throw rpcErr1;
    console.log(`   ✓ Conciliación exitosa. Carga ID generado: ${cargaId1}`);

    console.log("7. Verificando integridad directa en la base de datos Supabase:");
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
      .eq("usuario_id", (await supabase.from("usuarios").select("id").eq("auth_user_id", testUserId).single()).data?.id);

    console.log(`   ✓ Conteo de traslados creados: ${conteoTraslados} (esperado: ${cantidadTraslados})`);
    if (conteoTraslados !== cantidadTraslados) {
      throw new Error(`ERROR: Discrepancia en traslados. Esperados: ${cantidadTraslados}, Creados: ${conteoTraslados}`);
    }

    const { count: conteoPagos } = await supabase
      .from("pagos")
      .select("*", { count: "exact", head: true })
      .eq("checkout_masivo_id", testCheckoutId)
      .eq("estado", "completado");

    console.log(`   ✓ Conteo de pagos completados: ${conteoPagos} (esperado: ${cantidadTraslados})`);
    if (conteoPagos !== cantidadTraslados) {
      throw new Error(`ERROR: Discrepancia en pagos. Esperados: ${cantidadTraslados}, Creados: ${conteoPagos}`);
    }

    console.log("8. Probando IDEMPOTENCIA (re-ejecución idéntica del webhook/conciliación)...");
    const { data: cargaId2, error: rpcErr2 } = await supabase.rpc("confirmar_checkout_masivo", {
      p_id: testCheckoutId,
      p_intent: intent.id,
      p_monto: montoCentavos,
      p_moneda: "mxn",
    });
    if (rpcErr2) throw rpcErr2;

    const { count: conteoTrasladosPostReintento } = await supabase
      .from("traslados")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", (await supabase.from("usuarios").select("id").eq("auth_user_id", testUserId).single()).data?.id);

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
    console.log("Limpiando datos temporales de prueba...");
    await supabase.auth.admin.deleteUser(testUserId);
  }
}

ejecutarValidacion().catch((err) => {
  console.error("\n❌ Error en la prueba de integración de staging:", err);
  process.exit(1);
});
