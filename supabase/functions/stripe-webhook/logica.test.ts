/// <reference lib="deno.ns" />

import { strictEqual as assertEquals } from "node:assert";
import {
  esEventoYaProcesado,
  extraerTrasladoId,
  extraerPaymentIntentDeObjeto,
  esEventoManejado,
  estadoTrasladoSiguienteTrasPago
} from "./logica.ts";

Deno.test("extraerPaymentIntentDeObjeto: extrae id como string u objeto anidado", () => {
  assertEquals(extraerPaymentIntentDeObjeto({ payment_intent: "pi_123" }), "pi_123");
  assertEquals(extraerPaymentIntentDeObjeto({ payment_intent: { id: "pi_456" } }), "pi_456");
  assertEquals(extraerPaymentIntentDeObjeto({ payment_intent: null }), null);
  assertEquals(extraerPaymentIntentDeObjeto({}), null);
});

Deno.test("esEventoYaProcesado: false cuando nunca se guardó un evento", () => {
  assertEquals(esEventoYaProcesado("evt_123", null), false);
  assertEquals(esEventoYaProcesado("evt_123", undefined), false);
});

Deno.test("esEventoYaProcesado: false cuando el evento guardado es distinto (evento nuevo legítimo)", () => {
  assertEquals(esEventoYaProcesado("evt_nuevo", "evt_anterior"), false);
});

Deno.test("esEventoYaProcesado: true cuando Stripe reintenta el mismo evento", () => {
  assertEquals(esEventoYaProcesado("evt_123", "evt_123"), true);
});

Deno.test("extraerTrasladoId: null cuando no hay metadata", () => {
  assertEquals(extraerTrasladoId(null), null);
  assertEquals(extraerTrasladoId(undefined), null);
});

Deno.test("extraerTrasladoId: null cuando metadata existe pero sin traslado_id", () => {
  assertEquals(extraerTrasladoId({ otra_cosa: "x" }), null);
});

Deno.test("extraerTrasladoId: devuelve el id cuando está presente", () => {
  assertEquals(extraerTrasladoId({ traslado_id: "abc-123" }), "abc-123");
});

Deno.test("esEventoManejado: reconoce los eventos de PaymentIntent, Checkout Session y Refunds que sí procesamos", () => {
  assertEquals(esEventoManejado("payment_intent.succeeded"), true);
  assertEquals(esEventoManejado("payment_intent.payment_failed"), true);
  assertEquals(esEventoManejado("checkout.session.completed"), true);
  assertEquals(esEventoManejado("charge.refunded"), true);
  assertEquals(esEventoManejado("charge.refund.updated"), true);
  assertEquals(esEventoManejado("refund.created"), true);
  assertEquals(esEventoManejado("refund.updated"), true);
});

Deno.test("esEventoManejado: rechaza tipos de evento que no manejamos", () => {
  assertEquals(esEventoManejado("account.updated"), false);
  assertEquals(esEventoManejado("transfer.created"), false);
  assertEquals(esEventoManejado("customer.created"), false);
  assertEquals(esEventoManejado("invoice.payment_succeeded"), false);
});

Deno.test("estadoTrasladoSiguienteTrasPago: avanza solo desde estados válidos", () => {
  assertEquals(estadoTrasladoSiguienteTrasPago("cotizacion_aceptada", "anticipado", "completado"), "servicio_confirmado");
  assertEquals(estadoTrasladoSiguienteTrasPago("cotizacion_generada", "anticipado", "completado"), "servicio_confirmado");
  assertEquals(estadoTrasladoSiguienteTrasPago("entrega_confirmada", "anticipado", "completado"), "pago_completado");
  assertEquals(estadoTrasladoSiguienteTrasPago("entrega_confirmada", "al_cierre", "completado"), "pago_completado");
  assertEquals(estadoTrasladoSiguienteTrasPago("pago_pendiente", "al_cierre", "completado"), "pago_completado");
  assertEquals(estadoTrasladoSiguienteTrasPago("pendiente_de_conductor", "anticipado", "completado"), null);
  assertEquals(estadoTrasladoSiguienteTrasPago("solicitud_creada", "al_cierre", "completado"), null);
  assertEquals(estadoTrasladoSiguienteTrasPago("solicitud_creada", "anticipado", "completado"), "documentacion_pendiente");
  assertEquals(estadoTrasladoSiguienteTrasPago("entrega_confirmada", "anticipado", "fallido"), null);
});
