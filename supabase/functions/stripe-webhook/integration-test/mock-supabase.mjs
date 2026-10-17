// Mock mínimo de PostgREST (lo que @supabase/supabase-js termina llamando)
// para poder correr el index.ts REAL del webhook de Stripe sin un proyecto
// de Supabase desplegado.
//
// RC-04: tras volver el webhook transaccional, el handler ya no hace PATCH
// sueltos: llama a la RPC `procesar_pago_stripe` (que en producción ejecuta la
// transacción real). Este mock emula esa RPC con el MISMO mapeo de estados que
// la función SQL / logica.ts, para poder verificar el resultado final.

import http from "node:http";
import { URL } from "node:url";

// pi_xxx -> { traslado_id, stripe_event_id, estado }
const PAGOS = new Map();
// traslado_id -> { estado, tipo_pago }
const TRASLADOS = new Map();
// sumidero de auditoría (el webhook registra eventos; el mock solo los guarda)
const AUDITORIA = [];

const requestsLog = [];

function semilla() {
  PAGOS.clear();
  TRASLADOS.clear();
  AUDITORIA.length = 0;
  requestsLog.length = 0;

  PAGOS.set("pi_test_alcierre", { traslado_id: "traslado-alcierre", stripe_event_id: null, estado: "pendiente" });
  TRASLADOS.set("traslado-alcierre", { estado: "pago_pendiente", tipo_pago: "al_cierre" });

  PAGOS.set("pi_test_anticipado", { traslado_id: "traslado-anticipado", stripe_event_id: null, estado: "pendiente" });
  TRASLADOS.set("traslado-anticipado", { estado: "solicitud_creada", tipo_pago: "anticipado" });

  PAGOS.set("pi_test_idem", { traslado_id: "traslado-idem", stripe_event_id: "evt_test_idem_1", estado: "completado" });
  TRASLADOS.set("traslado-idem", { estado: "pago_completado", tipo_pago: "al_cierre" });

  PAGOS.set("pi_test_fallido", { traslado_id: "traslado-fallido", stripe_event_id: null, estado: "pendiente" });
  TRASLADOS.set("traslado-fallido", { estado: "pago_pendiente", tipo_pago: "al_cierre" });
}
semilla();

// Mismo mapeo que logica.ts::estadoTrasladoSiguienteTrasPago y la función SQL.
function estadoTrasladoSiguiente(estadoActual, tipoPago, estadoPago) {
  if (estadoPago !== "completado") return null;
  if (tipoPago !== "anticipado" && tipoPago !== "al_cierre") return null;
  if ((estadoActual === "cotizacion_aceptada" || estadoActual === "cotizacion_generada") && tipoPago === "anticipado") {
    return "servicio_confirmado";
  }
  if (estadoActual === "solicitud_creada" && tipoPago === "anticipado") {
    return "documentacion_pendiente";
  }
  if (estadoActual === "entrega_confirmada" || estadoActual === "pago_pendiente") {
    return "pago_completado";
  }
  return null;
}

function procesarPagoStripe({ p_stripe_event_id, p_stripe_payment_intent_id, p_estado_pago }) {
  const pago = PAGOS.get(p_stripe_payment_intent_id);
  if (!pago) return { status: 404, body: { message: `Pago no encontrado para PaymentIntent ${p_stripe_payment_intent_id}` } };

  const traslado = TRASLADOS.get(pago.traslado_id);
  const nuevoEstado = estadoTrasladoSiguiente(traslado?.estado, traslado?.tipo_pago, p_estado_pago);

  if (pago.stripe_event_id === p_stripe_event_id && nuevoEstado === null) {
    return { status: 200, body: { ok: true, ya_procesado: true } };
  }

  const eventoCambia = pago.stripe_event_id !== p_stripe_event_id;
  pago.estado = p_estado_pago;
  pago.stripe_event_id = p_stripe_event_id;

  if (eventoCambia) {
    AUDITORIA.push({ traslado_id: pago.traslado_id, evento: "registro_pago", datos: { stripe_event_id: p_stripe_event_id, estado_pago: p_estado_pago } });
  }
  if (nuevoEstado) {
    const anterior = traslado.estado;
    traslado.estado = nuevoEstado;
    AUDITORIA.push({ traslado_id: pago.traslado_id, evento: "registro_pago", datos: { estado_anterior: anterior, estado_nuevo: nuevoEstado } });
  }

  return { status: 200, body: { ok: true, ya_procesado: false } };
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let parsedBody = null;
    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
    }

    requestsLog.push({ method: req.method, path: url.pathname, query: url.search, body: parsedBody });

    if (url.pathname === "/__requests" && req.method === "GET") {
      requestsLog.pop();
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(requestsLog));
      return;
    }
    if (url.pathname === "/__state" && req.method === "GET") {
      requestsLog.pop();
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({
        pagos: Object.fromEntries(PAGOS),
        traslados: Object.fromEntries(TRASLADOS),
        auditoria: AUDITORIA,
      }));
      return;
    }
    if (url.pathname === "/__reset" && req.method === "POST") {
      semilla();
      res.writeHead(200);
      res.end("ok");
      return;
    }

    if (url.pathname === "/rest/v1/rpc/procesar_pago_stripe" && req.method === "POST") {
      const resultado = procesarPagoStripe(parsedBody ?? {});
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(resultado.body));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `mock sin ruta para ${req.method} ${url.pathname}` }));
  });
});

const PUERTO = 8787;
servidor.listen(PUERTO, () => {
  console.log(`mock-supabase escuchando en :${PUERTO}`);
});
