import { describe, expect, it } from "vitest";
import {
  esActivoParaAsignacionMCE,
  puedeAscenderNivel,
  DIAS_ALERTA_VENCIMIENTO_LICENCIA,
} from "./certificacion-conductor";
import {
  NIVELES_CERTIFICACION_SERVICIO,
  serviciosHabilitadosPorNivel,
} from "../constants/niveles-certificacion";

describe("modelo 11 certificacion-conductor", () => {
  it("alerta 15 días", () => expect(DIAS_ALERTA_VENCIMIENTO_LICENCIA).toBe(15));
  it("niveles acumulativos", () => {
    expect(NIVELES_CERTIFICACION_SERVICIO).toHaveLength(3);
    expect(serviciosHabilitadosPorNivel(1)).toEqual(["Traslado urbano"]);
    expect(serviciosHabilitadosPorNivel(3)).toHaveLength(3);
  });
  it("MCE bloquea sin Didit/licencia/capacitación", () => {
    const base = {
      identidadValidada: true, licenciaValidada: true, licenciaVigente: true,
      capacitacionAprobada: true, evaluacionPracticaAprobada: true,
      pruebaManejoAprobada: true, estado: "activo",
    };
    expect(esActivoParaAsignacionMCE(base).activo).toBe(true);
    expect(esActivoParaAsignacionMCE({ ...base, identidadValidada: false }).activo).toBe(false);
    expect(esActivoParaAsignacionMCE({ ...base, capacitacionAprobada: false }).motivo).toMatch(/Capacitación/);
  });
  it("ascenso exige criterios objetivos", () => {
    const r = puedeAscenderNivel({
      nivelActual: 1, trasladosCompletados: 5, puntualidadPct: 0.99,
      calidadEvidenciaPct: 0.99, incidentesGravesImputables: 0,
      evaluacionComplementariaAprobada: true,
    });
    expect(r.puede).toBe(false);
    expect(r.faltantes.join(" ")).toMatch(/traslados/);
  });
});
