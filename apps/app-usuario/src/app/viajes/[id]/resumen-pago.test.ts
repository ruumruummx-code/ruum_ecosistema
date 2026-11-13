import { describe, expect, it } from "vitest";
import { resumirPagoPasaporte } from "./resumen-pago";
import type { Pago, Pasaporte } from "./tipos-pasaporte";

function pasaporteBase(over: Partial<Pasaporte> = {}): Pasaporte {
  return {
    monto_pagado: 0,
    tipo_pago: "anticipado",
    estado: "cotizacion_generada",
    ...over
  } as Pasaporte;
}

function pago(over: Partial<Pago> = {}): Pago {
  return {
    id: "p1",
    estado: "completado",
    monto: 1800,
    metodo: "tarjeta",
    momento: "anticipado",
    ...over
  } as Pago;
}

describe("resumirPagoPasaporte (FIX A1 Fase 4)", () => {
  it("caso reportado: cotizacion_generada con pago completado muestra Pagado", () => {
    const r = resumirPagoPasaporte(pasaporteBase(), [pago()], 1800, "cotizacion_generada");
    expect(r.pagoRealizado).toBe(true);
    expect(r.estadoPago).toBe("Pagado");
    expect(r.montoMostrado).toBe(1800);
    expect(r.saldoPendiente).toBe(0);
  });

  it("sin pagos ni avance muestra Pendiente con saldo total", () => {
    const r = resumirPagoPasaporte(pasaporteBase(), [], 1800, "cotizacion_generada");
    expect(r.pagoRealizado).toBe(false);
    expect(r.estadoPago).toBe("Pendiente");
    expect(r.montoMostrado).toBe(0);
    expect(r.saldoPendiente).toBe(1800);
  });

  it("cualquier pago completado marca Pagado aunque el monto sea menor (lógica original verbatim)", () => {
    const r = resumirPagoPasaporte(
      pasaporteBase({ estado: "pago_pendiente" }),
      [pago({ monto: 500 })],
      1800,
      "pago_pendiente"
    );
    expect(r.estadoPago).toBe("Pagado");
    expect(r.montoMostrado).toBe(500);
    expect(r.saldoPendiente).toBe(1300);
  });

  it("estado post-pago sin registros cuenta como realizado (monto base)", () => {
    const r = resumirPagoPasaporte(
      pasaporteBase({ estado: "traslado_en_curso" }),
      [],
      1800,
      "traslado_en_curso"
    );
    expect(r.pagoRealizado).toBe(true);
    expect(r.montoMostrado).toBe(1800);
  });

  it("prefiere el máximo entre vista y suma de completados", () => {
    const r = resumirPagoPasaporte(
      pasaporteBase({ monto_pagado: 1800 }),
      [pago({ monto: 500 })],
      1800,
      "pago_completado"
    );
    expect(r.montoMostrado).toBe(1800);
  });
});
