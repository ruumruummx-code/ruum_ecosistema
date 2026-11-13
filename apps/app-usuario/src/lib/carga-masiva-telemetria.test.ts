import { describe, expect, it, vi } from "vitest";
import {
  registrarMetricaInicioCarga,
  registrarMetricaValidacion,
  registrarMetricaCotizacion,
  registrarMetricaPago,
} from "./carga-masiva-telemetria";

describe("carga-masiva-telemetria — Métricas del flujo masivo", () => {
  it("registra métrica de inicio de carga", () => {
    const log = registrarMetricaInicioCarga({
      nombreArchivo: "traslados_nov.xlsx",
      tamanoBytes: 1048576,
      totalFilas: 50,
      usuarioId: "user-1",
    });

    expect(log.scope).toBe("telemetria/carga_masiva");
    expect(log.event).toBe("carga_masiva_iniciada");
    expect(log.level).toBe("info");
    expect(log.archivo).toBe("traslados_nov.xlsx");
    expect(log.totalFilas).toBe(50);
  });

  it("registra métrica de validación con cálculo de tasa de éxito", () => {
    const log = registrarMetricaValidacion({
      totalFilas: 100,
      filasValidas: 90,
      filasConError: 10,
      duracionMs: 150.4,
      usuarioId: "user-1",
    });

    expect(log.event).toBe("carga_masiva_validada");
    expect(log.tasaExitoPct).toBe(90);
    expect(log.duracionMs).toBe(150);
  });

  it("registra métrica de cotización masiva", () => {
    const log = registrarMetricaCotizacion({
      clave: "92200000-0000-4000-8000-000000000010",
      totalFilas: 20,
      cotizadas: 18,
      erroresRuta: 2,
      duracionMs: 3200,
      montoCentavos: 4500000,
      parcial: true,
      usuarioId: "user-1",
    });

    expect(log.event).toBe("carga_masiva_cotizada");
    expect(log.montoMXN).toBe(45000);
    expect(log.parcial).toBe(true);
    expect(log.cotizadas).toBe(18);
  });

  it("registra métrica de pago exitoso vía webhook y fallback", () => {
    const logWebhook = registrarMetricaPago({
      cargaId: "92200000-0000-4000-8000-000000000011",
      exito: true,
      fuente: "webhook",
      montoCentavos: 120000,
    });
    expect(logWebhook.event).toBe("carga_masiva_pago_exitoso");
    expect(logWebhook.fuente).toBe("webhook");

    const logFallback = registrarMetricaPago({
      cargaId: "92200000-0000-4000-8000-000000000012",
      exito: true,
      fuente: "fallback_stripe",
      montoCentavos: 120000,
    });
    expect(logFallback.event).toBe("carga_masiva_pago_exitoso");
    expect(logFallback.fuente).toBe("fallback_stripe");

    const logFallo = registrarMetricaPago({
      cargaId: "92200000-0000-4000-8000-000000000013",
      exito: false,
      fuente: "fallback_stripe",
      error: "Tarjeta rechazada",
    });
    expect(logFallo.event).toBe("carga_masiva_pago_fallido");
    expect(logFallo.level).toBe("warn");
  });
});
