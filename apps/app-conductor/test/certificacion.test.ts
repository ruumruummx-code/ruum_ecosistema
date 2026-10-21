import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  evaluarChecklist,
  alertaLicencia15Dias,
  esSmartphoneCompatible,
} from "../src/lib/certificacion";

// Mock del módulo shared/validacion para controlar diasParaVencerLicencia
vi.mock("@ruum/shared/validacion", () => ({
  DIAS_ALERTA_VENCIMIENTO_LICENCIA: 15,
  diasParaVencerLicencia: vi.fn((vigencia: string) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(vigencia);
    venc.setHours(0, 0, 0, 0);
    return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }),
}));

describe("certificacion.ts", () => {
  describe("evaluarChecklist", () => {
    it("retorna todos los requisitos como false cuando nada está aprobado", () => {
      const resultado = evaluarChecklist({
        identificacionAprobada: false,
        licenciaAprobada: false,
        licenciaVigencia: null,
        comprobanteDomicilio: false,
        constanciaFiscal: false,
        cuentaBancariaPropia: false,
        smartphoneCompatible: false,
        consentimientoBiometricoGeo: false,
        consentimientoAntecedentes: false,
        capacitacionAprobada: false,
        evaluacionPracticaAprobada: false,
      });

      expect(resultado.identificacion_oficial).toBe(false);
      expect(resultado.licencia_vigente).toBe(false);
      expect(resultado.comprobante_domicilio).toBe(false);
      expect(resultado.constancia_fiscal).toBe(false);
      expect(resultado.cuenta_bancaria_propia).toBe(false);
      expect(resultado.smartphone_compatible).toBe(false);
      expect(resultado.consentimiento_biometrico_geo).toBe(false);
      expect(resultado.consentimiento_antecedentes).toBe(false);
      expect(resultado.capacitacion_aprobada).toBe(false);
      expect(resultado.evaluacion_practica_aprobada).toBe(false);
    });

    it("retorna todos los requisitos como true cuando todo está aprobado y licencia vigente", () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 30);

      const resultado = evaluarChecklist({
        identificacionAprobada: true,
        licenciaAprobada: true,
        licenciaVigencia: futuro.toISOString(),
        comprobanteDomicilio: true,
        constanciaFiscal: true,
        cuentaBancariaPropia: true,
        smartphoneCompatible: true,
        consentimientoBiometricoGeo: true,
        consentimientoAntecedentes: true,
        capacitacionAprobada: true,
        evaluacionPracticaAprobada: true,
      });

      expect(Object.values(resultado).every(Boolean)).toBe(true);
      expect(resultado.licencia_vigente).toBe(true);
    });

    it("marca licencia_vigente como false cuando la licencia está vencida", () => {
      const pasado = new Date();
      pasado.setDate(pasado.getDate() - 5);

      const resultado = evaluarChecklist({
        identificacionAprobada: true,
        licenciaAprobada: true,
        licenciaVigencia: pasado.toISOString(),
        comprobanteDomicilio: true,
        constanciaFiscal: true,
        cuentaBancariaPropia: true,
        smartphoneCompatible: true,
        consentimientoBiometricoGeo: true,
        consentimientoAntecedentes: true,
        capacitacionAprobada: true,
        evaluacionPracticaAprobada: true,
      });

      expect(resultado.licencia_vigente).toBe(false);
    });

    it("marca licencia_vigente como false cuando licenciaVigencia es null aunque licenciaAprobada sea true", () => {
      const resultado = evaluarChecklist({
        identificacionAprobada: true,
        licenciaAprobada: true,
        licenciaVigencia: null,
        comprobanteDomicilio: true,
        constanciaFiscal: true,
        cuentaBancariaPropia: true,
        smartphoneCompatible: true,
        consentimientoBiometricoGeo: true,
        consentimientoAntecedentes: true,
        capacitacionAprobada: true,
        evaluacionPracticaAprobada: true,
      });

      expect(resultado.licencia_vigente).toBe(false);
    });
  });

  describe("alertaLicencia15Dias", () => {
    it("retorna inactiva cuando vigencia es null", () => {
      const resultado = alertaLicencia15Dias(null);
      expect(resultado.activa).toBe(false);
      expect(resultado.dias).toBeNull();
      expect(resultado.mensaje).toBeNull();
    });

    it("retorna inactiva cuando vigencia es undefined", () => {
      const resultado = alertaLicencia15Dias(undefined);
      expect(resultado.activa).toBe(false);
    });

    it("retorna activa con mensaje de vencida cuando días < 0", () => {
      const pasado = new Date();
      pasado.setDate(pasado.getDate() - 10);

      const resultado = alertaLicencia15Dias(pasado.toISOString());
      expect(resultado.activa).toBe(true);
      expect(resultado.dias).toBeLessThan(0);
      expect(resultado.mensaje).toContain("vencida");
    });

    it("retorna activa con mensaje de alerta cuando días <= 15", () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 5);

      const resultado = alertaLicencia15Dias(futuro.toISOString());
      expect(resultado.activa).toBe(true);
      expect(resultado.dias).toBe(5);
      expect(resultado.mensaje).toContain("vence en");
      expect(resultado.mensaje).toContain("alerta 15 días");
    });

    it("retorna inactiva cuando días > 15", () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 30);

      const resultado = alertaLicencia15Dias(futuro.toISOString());
      expect(resultado.activa).toBe(false);
      expect(resultado.mensaje).toBeNull();
    });
  });

  describe("esSmartphoneCompatible", () => {
    const originalNavigator = global.navigator;
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
      Object.defineProperty(navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
        writable: true,
      });
    });

    it("retorna true en entorno sin navigator (SSR)", () => {
      vi.stubGlobal("navigator", undefined as unknown as Navigator);
      expect(esSmartphoneCompatible()).toBe(true);
      vi.unstubAllGlobals();
    });

    it("retorna true en escritorio (no móvil)", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        configurable: true,
      });
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });
      expect(esSmartphoneCompatible()).toBe(true);
    });

    it("retorna false en móvil sin cámara ni geolocalización", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 10; Mobile)",
        configurable: true,
      });
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });
      expect(esSmartphoneCompatible()).toBe(false);
    });

    it("retorna true en móvil con cámara y geolocalización", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 10; Mobile)",
        configurable: true,
      });
      Object.defineProperty(navigator, "mediaDevices", {
        value: { getUserMedia: vi.fn() },
        configurable: true,
      });
      Object.defineProperty(navigator, "geolocation", {
        value: {},
        configurable: true,
      });
      expect(esSmartphoneCompatible()).toBe(true);
    });
  });
});
