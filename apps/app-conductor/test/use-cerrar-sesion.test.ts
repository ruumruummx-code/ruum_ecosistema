import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { mensajePendientesLogout } from "../src/lib/use-cerrar-sesion";

describe("use-cerrar-sesion.ts", () => {
  describe("mensajePendientesLogout", () => {
    it("retorna mensaje con conteos de evidencia y telemetría", () => {
      const mensaje = mensajePendientesLogout({
        ok: false,
        blocked: true,
        errorCount: 0,
        pendingEvidence: 3,
        pendingTelemetry: 2,
      });

      expect(mensaje).toContain("3 evidencia(s)");
      expect(mensaje).toContain("2 punto(s) de telemetría");
      expect(mensaje).toContain("Sincroniza antes de salir");
    });

    it("maneja conteos cero", () => {
      const mensaje = mensajePendientesLogout({
        ok: true,
        blocked: false,
        errorCount: 0,
        pendingEvidence: 0,
        pendingTelemetry: 0,
      });

      expect(mensaje).toContain("0 evidencia(s)");
      expect(mensaje).toContain("0 punto(s) de telemetría");
    });

    it("maneja conteos grandes", () => {
      const mensaje = mensajePendientesLogout({
        ok: false,
        blocked: true,
        errorCount: 1,
        pendingEvidence: 15,
        pendingTelemetry: 8,
      });

      expect(mensaje).toContain("15 evidencia(s)");
      expect(mensaje).toContain("8 punto(s) de telemetría");
    });
  });
});
