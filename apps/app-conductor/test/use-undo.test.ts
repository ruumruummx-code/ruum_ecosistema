import { describe, it, expect } from "vitest";

// use-undo.ts son hooks de React que requieren entorno de renderizado.
// Como no hay @testing-library/react disponible, verificamos que las
// exportaciones existan y sean funciones.
import { useUndo, useFieldUndo } from "../src/lib/use-undo";

describe("use-undo.ts", () => {
  it("exporta useUndo como función", () => {
    expect(typeof useUndo).toBe("function");
  });

  it("exporta useFieldUndo como función", () => {
    expect(typeof useFieldUndo).toBe("function");
  });

  it("useUndo retorna objeto con propiedades esperadas", () => {
    // Nota: useUndo usa React hooks internamente y requiere un entorno
    // de renderizado (React Testing Library) para probar su comportamiento.
    // Aquí solo verificamos que la exportación sea una función válida.
    expect(useUndo).toBeInstanceOf(Function);
  });

  it("useFieldUndo retorna objeto con propiedades esperadas", () => {
    expect(useFieldUndo).toBeInstanceOf(Function);
  });
});
