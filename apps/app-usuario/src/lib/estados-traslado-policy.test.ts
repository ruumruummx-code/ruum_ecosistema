import { describe, expect, it, vi } from "vitest";
import {
  clasificarEstadoTraslado,
  evaluarConsistenciaPasaporte,
  obtenerEtiquetaLegibleEstado,
  puedeEjecutarAccionFlujo10,
  puedeFacturarFlujo13,
  ESTADOS_ACTIVOS,
  ESTADOS_PROGRAMADOS,
  ESTADOS_FINALIZADOS,
  ESTADOS_CANCELADOS,
} from "./estados-traslado-policy";

describe("estados-traslado-policy (RUUM-USR-F8-001 CB-2)", () => {
  it("clasifica correctamente estados programados conocidos", () => {
    for (const estado of ESTADOS_PROGRAMADOS) {
      expect(clasificarEstadoTraslado(estado)).toBe("programados");
    }
  });

  it("clasifica correctamente estados activos conocidos", () => {
    for (const estado of ESTADOS_ACTIVOS) {
      expect(clasificarEstadoTraslado(estado)).toBe("activos");
    }
  });

  it("clasifica correctamente estados finalizados conocidos", () => {
    for (const estado of ESTADOS_FINALIZADOS) {
      expect(clasificarEstadoTraslado(estado)).toBe("finalizados");
    }
  });

  it("clasifica correctamente estados cancelados conocidos", () => {
    for (const estado of ESTADOS_CANCELADOS) {
      expect(clasificarEstadoTraslado(estado)).toBe("cancelados");
    }
  });

  it("prioriza el cierre operativo explícito (closed o cerrado_en)", () => {
    expect(
      clasificarEstadoTraslado("traslado_en_curso", "closed", null)
    ).toBe("finalizados");

    expect(
      clasificarEstadoTraslado("disputa_abierta", null, "2026-11-04T12:00:00Z")
    ).toBe("finalizados");
  });

  it("FAIL-CLOSED: estado desconocido o corrupto nunca cae en 'activos', clasifica como 'en_revision'", () => {
    const estadoInvalido = "estado_inexistente_xyz";
    const res = clasificarEstadoTraslado(estadoInvalido, null, null, "traslado-123");
    expect(res).toBe("en_revision");
    expect(res).not.toBe("activos");
  });

  it("FAIL-CLOSED: estado nulo o vacío clasifica como 'en_revision'", () => {
    expect(clasificarEstadoTraslado(null)).toBe("en_revision");
    expect(clasificarEstadoTraslado("")).toBe("en_revision");
    expect(clasificarEstadoTraslado("   ")).toBe("en_revision");
    expect(clasificarEstadoTraslado(undefined)).toBe("en_revision");
  });

  describe("evaluarConsistenciaPasaporte", () => {
    it("detecta pasaporte huérfano (sin traslado o sin traslado_id) y clasifica como 'en_revision'", () => {
      const huerfano = evaluarConsistenciaPasaporte(
        null,
        false,
        "solicitud_creada",
        null,
        null
      );
      expect(huerfano.esHuerfano).toBe(true);
      expect(huerfano.categoria).toBe("en_revision");
      expect(huerfano.requiereAtencionSoporte).toBe(true);
      expect(huerfano.etiquetaEstado).toBe("En verificación técnica");
    });

    it("clasifica pasaporte consistente con traslado asociado", () => {
      const consistente = evaluarConsistenciaPasaporte(
        "t-123",
        true,
        "traslado_en_curso",
        "in_transit",
        null
      );
      expect(consistente.esHuerfano).toBe(false);
      expect(consistente.categoria).toBe("activos");
      expect(consistente.requiereAtencionSoporte).toBe(false);
      expect(consistente.etiquetaEstado).toBe("En traslado");
    });
  });

  describe("obtenerEtiquetaLegibleEstado", () => {
    it("retorna 'En revisión técnica' para categoría en_revision", () => {
      expect(obtenerEtiquetaLegibleEstado("estado_raro", "en_revision")).toBe("En revisión técnica");
    });

    it("retorna etiquetas amigables para estados conocidos", () => {
      expect(obtenerEtiquetaLegibleEstado("servicio_confirmado", "programados")).toBe("Confirmado");
      expect(obtenerEtiquetaLegibleEstado("traslado_en_curso", "activos")).toBe("En traslado");
      expect(obtenerEtiquetaLegibleEstado("servicio_cerrado", "finalizados")).toBe("Finalizado");
      expect(obtenerEtiquetaLegibleEstado("servicio_cancelado", "cancelados")).toBe("Cancelado");
    });
  });

  describe("Alineación transversal con F10 y F13", () => {
    it("F10: bloquea acciones operativas si el estado clasifica como 'en_revision'", () => {
      const res = puedeEjecutarAccionFlujo10("estado_invalido_xyz", null, null, "t-1");
      expect(res.puedeAccionar).toBe(false);
      expect(res.motivoBloqueo).toMatch(/verificación técnica/i);
    });

    it("F10: permite acciones operativas en estados válidos", () => {
      const res = puedeEjecutarAccionFlujo10("traslado_en_curso", "in_transit", null, "t-2");
      expect(res.puedeAccionar).toBe(true);
    });

    it("F13: bloquea facturación si el estado clasifica como 'en_revision'", () => {
      const res = puedeFacturarFlujo13("estado_invalido_xyz", null, null, "t-1");
      expect(res.puedeFacturar).toBe(false);
      expect(res.motivoBloqueo).toMatch(/verificación técnica/i);
    });

    it("F13: solo permite facturación en traslados finalizados", () => {
      const resActivo = puedeFacturarFlujo13("traslado_en_curso", "in_transit", null, "t-2");
      expect(resActivo.puedeFacturar).toBe(false);
      expect(resActivo.motivoBloqueo).toMatch(/finalizado y liquidado/i);

      const resFinalizado = puedeFacturarFlujo13("servicio_cerrado", "closed", "2026-10-27T00:00:00Z", "t-3");
      expect(resFinalizado.puedeFacturar).toBe(true);
    });
  });
});
