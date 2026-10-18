/// <reference lib="deno.ns" />

import { strictEqual as assertEquals } from "node:assert";
import { decidirAccionPagoIntent, decidirAccionCheckoutHuerfano } from "./logica.ts";

Deno.test("decidirAccionPagoIntent: completa PaymentIntent exitoso individual", () => {
  const accion = decidirAccionPagoIntent({
    id: "pi_123",
    status: "succeeded",
    amount_received: 150000
  });

  assertEquals(accion.tipo, "completar");
  assertEquals(accion.pagoEstado, "completado");
});

Deno.test("decidirAccionPagoIntent: completa PaymentIntent de carga masiva con su metadata", () => {
  const accion = decidirAccionPagoIntent({
    id: "pi_masivo_1",
    status: "succeeded",
    metadata: { carga_masiva_id: "cm-abc-123" }
  });

  assertEquals(accion.tipo, "completar");
  assertEquals(accion.pagoEstado, "completado");
  if (accion.tipo === "completar") {
    assertEquals(accion.cargaMasivaId, "cm-abc-123");
  }
});

Deno.test("decidirAccionPagoIntent: reembolsa si el cargo tiene refunded = true", () => {
  const accion = decidirAccionPagoIntent({
    id: "pi_ref_1",
    status: "succeeded",
    charges: {
      data: [{ refunded: true, amount_refunded: 150000 }]
    }
  });

  assertEquals(accion.tipo, "reembolsar");
  assertEquals(accion.pagoEstado, "reembolsado");
});

Deno.test("decidirAccionPagoIntent: marca como fallido si status es canceled", () => {
  const accion = decidirAccionPagoIntent({
    id: "pi_canc_1",
    status: "canceled"
  });

  assertEquals(accion.tipo, "fallar");
  assertEquals(accion.pagoEstado, "fallido");
});

Deno.test("decidirAccionPagoIntent: ignora si status es processing o requires_payment_method", () => {
  const accion1 = decidirAccionPagoIntent({
    id: "pi_proc_1",
    status: "processing"
  });
  assertEquals(accion1.tipo, "ignorar");

  const accion2 = decidirAccionPagoIntent({
    id: "pi_req_1",
    status: "requires_payment_method"
  });
  assertEquals(accion2.tipo, "ignorar");
});

Deno.test("decidirAccionCheckoutHuerfano: confirma si status es succeeded", () => {
  const accion = decidirAccionCheckoutHuerfano({ status: "succeeded" });
  assertEquals(accion.tipo, "confirmar");
});

Deno.test("decidirAccionCheckoutHuerfano: cancela en Stripe y expira si está pendiente", () => {
  const accion1 = decidirAccionCheckoutHuerfano({ status: "requires_payment_method" });
  assertEquals(accion1.tipo, "cancelar_stripe_y_expirar");

  const accion2 = decidirAccionCheckoutHuerfano({ status: "requires_confirmation" });
  assertEquals(accion2.tipo, "cancelar_stripe_y_expirar");
});

Deno.test("decidirAccionCheckoutHuerfano: expira directamente si ya está cancelado", () => {
  const accion = decidirAccionCheckoutHuerfano({ status: "canceled" });
  assertEquals(accion.tipo, "expirar");
});

