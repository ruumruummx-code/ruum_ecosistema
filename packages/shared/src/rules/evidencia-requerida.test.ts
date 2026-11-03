import { describe, it, expect } from "vitest";
import {
  evidenciaCompleta,
  debeAbrirIncidenciaDanoNoReportado,
  normalizarIdentificadorVehicular,
  evaluarVerificacionRepuveLocal
} from "./evidencia-requerida";
import type { FotoEvidencia } from "../types/evidencia";

function foto(angulo: FotoEvidencia["angulo"], sincronizada = true): FotoEvidencia {
  return {
    id: `f-${angulo}`,
    traslado_id: "t1",
    tipo: "inicial",
    angulo,
    timestamp: new Date().toISOString(),
    sincronizada
  };
}

describe("evidenciaCompleta — PRD §4.4", () => {
  it("completa con los 5 ángulos obligatorios sincronizados", () => {
    const fotos = ["frente", "lado_piloto", "lado_copiloto", "trasera", "tablero"].map((a) =>
      foto(a as FotoEvidencia["angulo"])
    );
    const r = evidenciaCompleta(fotos, "inicial");
    expect(r.completa).toBe(true);
    expect(r.angulosFaltantes).toHaveLength(0);
  });

  it("incompleta si falta un ángulo obligatorio", () => {
    const fotos = ["frente", "lado_piloto", "trasera", "tablero"].map((a) => foto(a as FotoEvidencia["angulo"]));
    const r = evidenciaCompleta(fotos, "inicial");
    expect(r.completa).toBe(false);
    expect(r.angulosFaltantes).toEqual(["lado_copiloto"]);
  });

  it("una foto no sincronizada (PRD §4.15) no cuenta como evidencia completa", () => {
    const fotos = [
      foto("frente"),
      foto("lado_piloto"),
      foto("lado_copiloto", false), // aún en proceso de sincronización
      foto("trasera"),
      foto("tablero")
    ];
    const r = evidenciaCompleta(fotos, "inicial");
    expect(r.completa).toBe(false);
    expect(r.angulosFaltantes).toEqual(["lado_copiloto"]);
  });

  it("daño previo y adicional son condicionales, no obligatorios", () => {
    const fotos = ["frente", "lado_piloto", "lado_copiloto", "trasera", "tablero"].map((a) =>
      foto(a as FotoEvidencia["angulo"])
    );
    expect(evidenciaCompleta(fotos, "inicial").completa).toBe(true);
  });
});

describe("debeAbrirIncidenciaDanoNoReportado — PRD §4.4", () => {
  it("abre incidencia si hay daño nuevo no reportado durante el traslado", () => {
    expect(debeAbrirIncidenciaDanoNoReportado(true, false, false)).toBe(true);
  });

  it("no abre incidencia si el daño ya estaba en la evidencia inicial", () => {
    expect(debeAbrirIncidenciaDanoNoReportado(true, true, false)).toBe(false);
  });

  it("no abre incidencia si ya fue reportada como incidencia durante el traslado", () => {
    expect(debeAbrirIncidenciaDanoNoReportado(true, false, true)).toBe(false);
  });

  it("no abre incidencia si no hay daño detectado en la evidencia final", () => {
    expect(debeAbrirIncidenciaDanoNoReportado(false, false, false)).toBe(false);
  });
});

describe("evaluarVerificacionRepuveLocal — verificación REPUVE y VIN/placas", () => {
  it("normaliza guiones y espacios en placas y VIN", () => {
    expect(normalizarIdentificadorVehicular(" pom-365 a ")).toBe("POM365A");
    const r = evaluarVerificacionRepuveLocal({
      vinEsperado: "3N1AB7AP0HY123456",
      placasEsperadas: "ABC-123-A",
      vinFisico: "3n1ab7ap0hy123456",
      placasFisicas: "ABC 123 A",
      resultado: "limpio"
    });
    expect(r.coincideVin).toBe(true);
    expect(r.coincidePlacas).toBe(true);
    expect(r.coincide).toBe(true);
    expect(r.puedeAvanzar).toBe(true);
  });

  it("bloquea el avance si el resultado REPUVE no es limpio aunque coincida el VIN", () => {
    const r = evaluarVerificacionRepuveLocal({
      vinEsperado: "3N1AB7AP0HY123456",
      placasEsperadas: "ABC123A",
      vinFisico: "3N1AB7AP0HY123456",
      placasFisicas: "ABC123A",
      resultado: "con_reporte_robo"
    });
    expect(r.coincide).toBe(true);
    expect(r.puedeAvanzar).toBe(false);
    expect(r.motivoBloqueo).toMatch(/REPUVE no es limpio/i);
  });

  it("bloquea el avance si hay discrepancia de VIN físico", () => {
    const r = evaluarVerificacionRepuveLocal({
      vinEsperado: "3N1AB7AP0HY123456",
      placasEsperadas: "ABC123A",
      vinFisico: "3N1AB7AP0HY999999",
      placasFisicas: "ABC123A",
      resultado: "limpio"
    });
    expect(r.coincideVin).toBe(false);
    expect(r.coincide).toBe(false);
    expect(r.puedeAvanzar).toBe(false);
    expect(r.motivoBloqueo).toMatch(/VIN físico no coincide/i);
  });
});
