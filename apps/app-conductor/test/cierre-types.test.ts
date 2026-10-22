import { describe, expect, it } from "vitest";
import { labelGasto, type GastoData } from "../src/app/viajes/[id]/cierre/cierre-types";

describe("cierre-types — etiquetas de gasto", () => {
  it("etiqueta cada tipo de gasto del cierre", () => {
    expect(labelGasto("combustible")).toBe("Gasolina");
    expect(labelGasto("caseta")).toBe("Caseta");
    expect(labelGasto("maniobra")).toBe("Maniobra");
    expect(labelGasto("estadia")).toBe("Estadía");
    expect(labelGasto("penalizacion")).toBe("Penalización");
    expect(labelGasto("otro")).toBe("Otro");
  });

  it("cubre todos los tipos declarados en GastoData", () => {
    const tipos: GastoData["tipo"][] = [
      "combustible",
      "caseta",
      "maniobra",
      "estadia",
      "penalizacion",
      "otro"
    ];
    for (const tipo of tipos) {
      expect(labelGasto(tipo)).toBeTruthy();
    }
  });
});
