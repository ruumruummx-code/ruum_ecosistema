import { describe, it, expect } from "vitest";
import {
  resumirPuntualidad,
  compararCandidatosAsignacion,
  ordenarCandidatosAsignacion
} from "./asignacion-traslado";
import {
  nivelPorCalificacion,
  calcularCalificacionPromedio
} from "./calificacion-nivel";
import { calcularCargoCancelacion } from "./politica-cancelacion";
import { chatDisponible } from "./chat-disponible";
import { consecuenciaCancelacionConductor } from "./cancelacion-conductor";
import { puedeAgregarMiembroEmpresa } from "./limite-empresa";
import { determinarMomentoPago } from "./pago-anticipado";
import {
  puedeAbrirseDisputa,
  slaRevisionAdmin,
  slaResolucionDisputa,
  puedeEscalarse
} from "./sla-disputas";

describe("packages/shared/src/rules", () => {
  describe("asignacion-traslado", () => {
    it("resumirPuntualidad: clasifica categoría a, b, c o sin_datos", () => {
      expect(resumirPuntualidad(0, 0).categoria).toBe("sin_datos");
      expect(resumirPuntualidad(3, 3).categoria).toBe("sin_datos"); // total < muestraMinima (5)
      expect(resumirPuntualidad(10, 10).categoria).toBe("a");
      expect(resumirPuntualidad(9, 10).categoria).toBe("b");
      expect(resumirPuntualidad(7, 10).categoria).toBe("c");
    });

    it("resumirPuntualidad: lanza error si valores son inválidos", () => {
      expect(() => resumirPuntualidad(5, 3)).toThrow("La muestra de puntualidad es inválida.");
      expect(() => resumirPuntualidad(-1, 5)).toThrow();
    });

    it("compararCandidatosAsignacion: ordena lexicográficamente por puntualidad y equidad", () => {
      const candA = {
        conductor_id: "c-1",
        nombre: "Conductor 1",
        puntualidad: { categoria: "a" as const, porcentaje: 1, muestra: 10 },
        asignaciones_7d: 2,
        ultima_asignacion_en: "2026-11-19T10:00:00Z",
        desempate: "aaa"
      };
      const candB = {
        conductor_id: "c-2",
        nombre: "Conductor 2",
        puntualidad: { categoria: "b" as const, porcentaje: 0.9, muestra: 10 },
        asignaciones_7d: 0,
        ultima_asignacion_en: null,
        desempate: "bbb"
      };
      const ordenados = ordenarCandidatosAsignacion([candB, candA]);
      expect(ordenados[0].conductor_id).toBe("c-1");
    });
  });

  describe("calificacion-nivel", () => {
    it("nivelPorCalificacion: mapea correctamente según rangos PRD §4.13", () => {
      expect(nivelPorCalificacion(5.0)).toBe("coleccion");
      expect(nivelPorCalificacion(4.9)).toBe("coleccion");
      expect(nivelPorCalificacion(4.85)).toBe("luxury");
      expect(nivelPorCalificacion(4.6)).toBe("ejecutivo");
      expect(nivelPorCalificacion(4.2)).toBe("basico");
      expect(nivelPorCalificacion(3.9)).toBeNull();
    });

    it("calcularCalificacionPromedio: inicia en 5.0 sin calificaciones en ventana", () => {
      expect(calcularCalificacionPromedio([])).toBe(5.0);
    });

    it("calcularCalificacionPromedio: promedia calificaciones dentro de los últimos 6 meses", () => {
      const ahora = new Date("2026-11-20T12:00:00Z");
      const calificaciones = [
        { estrellas: 5, calificado_en: "2026-11-10T10:00:00Z" },
        { estrellas: 4, calificado_en: "2026-10-10T10:00:00Z" }
      ];
      expect(calcularCalificacionPromedio(calificaciones as any, ahora)).toBe(4.5);
    });
  });

  describe("politica-cancelacion", () => {
    it("calcularCargoCancelacion: calcula 0% antes de conductor asignado", () => {
      const res = calcularCargoCancelacion(1000, 10, false, false);
      expect(res.porcentaje_cargo).toBe(0);
      expect(res.monto_cargo).toBe(0);
    });

    it("calcularCargoCancelacion: 20% si faltan >= 6h", () => {
      const res = calcularCargoCancelacion(1000, 6, true, false);
      expect(res.porcentaje_cargo).toBe(20);
      expect(res.monto_cargo).toBe(200);
    });

    it("calcularCargoCancelacion: 35% si faltan entre 4h y <6h", () => {
      const res = calcularCargoCancelacion(1000, 4.5, true, false);
      expect(res.porcentaje_cargo).toBe(35);
      expect(res.monto_cargo).toBe(350);
    });

    it("calcularCargoCancelacion: 50% si faltan entre 2h y <4h", () => {
      const res = calcularCargoCancelacion(1000, 2.5, true, false);
      expect(res.porcentaje_cargo).toBe(50);
      expect(res.monto_cargo).toBe(500);
    });

    it("calcularCargoCancelacion: 75% si faltan < 2h", () => {
      const res = calcularCargoCancelacion(1000, 1, true, false);
      expect(res.porcentaje_cargo).toBe(75);
      expect(res.monto_cargo).toBe(750);
    });

    it("calcularCargoCancelacion: 100% si el conductor ya llegó al punto de recolección", () => {
      const res = calcularCargoCancelacion(1000, 0, true, true);
      expect(res.porcentaje_cargo).toBe(100);
      expect(res.monto_cargo).toBe(1000);
    });
  });

  describe("chat-disponible", () => {
    it("valida disponibilidad en estados operativos válidos", () => {
      expect(chatDisponible("conductor_asignado")).toBe(true);
      expect(chatDisponible("traslado_en_curso")).toBe(true);
      expect(chatDisponible("llegada_a_destino")).toBe(true);
      expect(chatDisponible("solicitado")).toBe(false);
      expect(chatDisponible("cancelado")).toBe(false);
    });
  });

  describe("cancelacion-conductor", () => {
    it("consecuenciaCancelacionConductor: suspende 30 días en 1ra ocurrencia", () => {
      const res = consecuenciaCancelacionConductor(1);
      expect(res.nuevoEstado).toBe("suspendido_30d");
      expect(res.diasSuspension).toBe(30);
    });

    it("consecuenciaCancelacionConductor: bloqueo permanente en reincidencia", () => {
      const res = consecuenciaCancelacionConductor(2);
      expect(res.nuevoEstado).toBe("bloqueado_permanente");
    });
  });

  describe("limite-empresa", () => {
    it("puedeAgregarMiembroEmpresa: valida rol duplicado", () => {
      expect(puedeAgregarMiembroEmpresa([{ rol: "titular_empresa" }], "usuario_autorizado")).toBe(true);
      expect(puedeAgregarMiembroEmpresa([{ rol: "titular_empresa" }], "titular_empresa")).toBe(false);
    });
  });

  describe("pago-anticipado", () => {
    it("determinarMomentoPago: siempre retorna anticipado", () => {
      const res = determinarMomentoPago({} as any);
      expect(res.momento).toBe("anticipado");
    });
  });

  describe("sla-disputas", () => {
    it("puedeAbrirseDisputa: permite dentro de las 72 horas (+ gracia)", () => {
      expect(puedeAbrirseDisputa(70)).toBe(true);
      expect(puedeAbrirseDisputa(72.2, true)).toBe(true);
      expect(puedeAbrirseDisputa(73, false)).toBe(false);
    });

    it("puedeEscalarse: dentro de 48 horas tras resolución", () => {
      expect(puedeEscalarse(24)).toBe(true);
      expect(puedeEscalarse(49)).toBe(false);
    });

    it("slaRevisionAdmin y slaResolucionDisputa evalúan SLA", () => {
      expect(slaRevisionAdmin(24).dentro_de_sla).toBe(true);
      expect(slaRevisionAdmin(50).dentro_de_sla).toBe(false);
      expect(slaResolucionDisputa(3, false).dentro_de_sla).toBe(true);
      expect(slaResolucionDisputa(6, false).dentro_de_sla).toBe(false);
      expect(slaResolucionDisputa(8, true).dentro_de_sla).toBe(true);
    });
  });
});
