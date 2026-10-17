// Firma eventos exactamente como lo hace Stripe (esquema documentado:
// signed_payload = "{timestamp}.{payload}", v1 = HMAC-SHA256 hex), y los
// envía por HTTP al index.ts REAL del webhook (corriendo de verdad con
// `deno serve`, no importado como módulo) — para probar el handler completo,
// no solo logica.ts.
//
// RC-04: el webhook ahora delega en la RPC transaccional `procesar_pago_stripe`.
// El mock emula esa RPC; aquí verificamos la llamada y el estado final.

import crypto from "node:crypto";

const WEBHOOK_URL = "http://localhost:8000";
const WEBHOOK_SECRET = "whsec_test_local_12345";

function firmar(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const payloadFirmado = `${timestamp}.${payload}`;
  const firma = crypto.createHmac("sha256", secret).update(payloadFirmado).digest("hex");
  return `t=${timestamp},v1=${firma}`;
}

async function enviarEvento(evento, { secret = WEBHOOK_SECRET, timestamp } = {}) {
  const payload = JSON.stringify(evento);
  const stripeSignature = firmar(payload, secret, timestamp);

  const respuesta = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": stripeSignature },
    body: payload
  });

  const texto = await respuesta.text();
  return { status: respuesta.status, texto };
}

function eventoPaymentIntent(tipo, { id, paymentIntentId, trasladoId, monto = 150000 }) {
  return {
    id,
    object: "event",
    api_version: "2025-02-24.acacia",
    created: Math.floor(Date.now() / 1000),
    type: tipo,
    data: {
      object: {
        id: paymentIntentId,
        object: "payment_intent",
        amount: monto,
        currency: "mxn",
        status: tipo === "payment_intent.succeeded" ? "succeeded" : "requires_payment_method",
        metadata: { traslado_id: trasladoId }
      }
    }
  };
}

async function obtenerRequestsMock() {
  const r = await fetch("http://localhost:8787/__requests");
  return r.json();
}

async function obtenerEstado() {
  const r = await fetch("http://localhost:8787/__state");
  return r.json();
}

async function resetMock() {
  await fetch("http://localhost:8787/__reset", { method: "POST" });
}

function assert(cond, msg) {
  if (!cond) throw new Error(`FALLÓ: ${msg}`);
  console.log(`OK: ${msg}`);
}

async function main() {
  // --- Caso 1: pago al cierre, completado -> pago_pendiente -> pago_completado ---
  await resetMock();
  const ev1 = eventoPaymentIntent("payment_intent.succeeded", {
    id: "evt_test_alcierre_1",
    paymentIntentId: "pi_test_alcierre",
    trasladoId: "traslado-alcierre"
  });
  const r1 = await enviarEvento(ev1);
  assert(r1.status === 200, `caso al_cierre: respuesta 200 (fue ${r1.status}: ${r1.texto})`);
  const reqs1 = await obtenerRequestsMock();
  const rpc1 = reqs1.find((r) => r.path === "/rest/v1/rpc/procesar_pago_stripe");
  assert(Boolean(rpc1), "caso al_cierre: el webhook llamó a la RPC transaccional procesar_pago_stripe");
  const estado1 = await obtenerEstado();
  assert(estado1.pagos.pi_test_alcierre.estado === "completado", "caso al_cierre: pagos.estado -> completado");
  assert(estado1.traslados["traslado-alcierre"].estado === "pago_completado", "caso al_cierre: traslados.estado -> pago_completado");

  // --- Caso 2: pago anticipado, completado -> solicitud_creada -> documentacion_pendiente ---
  await resetMock();
  const ev2 = eventoPaymentIntent("payment_intent.succeeded", {
    id: "evt_test_anticipado_1",
    paymentIntentId: "pi_test_anticipado",
    trasladoId: "traslado-anticipado"
  });
  const r2 = await enviarEvento(ev2);
  assert(r2.status === 200, `caso anticipado: respuesta 200 (fue ${r2.status})`);
  const estado2 = await obtenerEstado();
  assert(
    estado2.traslados["traslado-anticipado"].estado === "documentacion_pendiente",
    `caso anticipado: traslados.estado -> documentacion_pendiente (fue ${estado2.traslados["traslado-anticipado"].estado})`
  );

  // --- Caso 3: pago fallido -> pagos.estado = fallido, SIN tocar traslados ---
  await resetMock();
  const ev3 = eventoPaymentIntent("payment_intent.payment_failed", {
    id: "evt_test_fallido_1",
    paymentIntentId: "pi_test_fallido",
    trasladoId: "traslado-fallido"
  });
  const r3 = await enviarEvento(ev3);
  assert(r3.status === 200, `caso fallido: respuesta 200 (fue ${r3.status})`);
  const estado3 = await obtenerEstado();
  assert(estado3.pagos.pi_test_fallido.estado === "fallido", "caso fallido: pagos.estado -> fallido");
  assert(estado3.traslados["traslado-fallido"].estado === "pago_pendiente", "caso fallido: NO debe avanzar el estado del traslado");

  // --- Caso 4: idempotencia — mismo evento ya procesado, no debe cambiar nada ---
  await resetMock();
  const ev4 = eventoPaymentIntent("payment_intent.succeeded", {
    id: "evt_test_idem_1", // coincide con el stripe_event_id ya guardado en el seed
    paymentIntentId: "pi_test_idem",
    trasladoId: "traslado-idem"
  });
  const r4 = await enviarEvento(ev4);
  assert(r4.status === 200, `caso idempotencia: respuesta 200 (fue ${r4.status})`);
  const estado4 = await obtenerEstado();
  assert(estado4.pagos.pi_test_idem.estado === "completado", "caso idempotencia: el pago no cambia");
  assert(estado4.traslados["traslado-idem"].estado === "pago_completado", "caso idempotencia: el traslado no cambia");
  assert(estado4.auditoria.length === 0, "caso idempotencia: no se registra auditoría duplicada");

  // --- Caso 5: tipo de evento no manejado -> 200, sin tocar el mock para nada ---
  await resetMock();
  const ev5 = { id: "evt_test_no_manejado", object: "event", type: "charge.refunded", data: { object: {} } };
  const r5 = await enviarEvento(ev5);
  assert(r5.status === 200, `caso no-manejado: respuesta 200 (fue ${r5.status})`);
  const reqs5 = await obtenerRequestsMock();
  assert(reqs5.length === 0, "caso no-manejado: el webhook no debe llamar a Supabase para nada");

  // --- Caso 6: firma inválida -> 400, sin tocar el mock para nada ---
  await resetMock();
  const ev6 = eventoPaymentIntent("payment_intent.succeeded", {
    id: "evt_test_firma_mala",
    paymentIntentId: "pi_test_alcierre",
    trasladoId: "traslado-alcierre"
  });
  const r6 = await enviarEvento(ev6, { secret: "whsec_secreto_incorrecto" });
  assert(r6.status === 400, `caso firma inválida: respuesta 400 (fue ${r6.status}: ${r6.texto})`);
  const reqs6 = await obtenerRequestsMock();
  assert(reqs6.length === 0, "caso firma inválida: el webhook no debe llamar a Supabase para nada");

  console.log("\nTodos los casos del webhook real (index.ts, vía HTTP, firma real) pasaron.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
