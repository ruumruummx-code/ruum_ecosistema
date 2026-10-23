import { describe, expect, it } from "vitest";
import { accountReturnLabel, accountReturnTarget } from "../src/app/components/context-return";

describe("retorno contextual de Cuenta", () => {
  it("conserva la ruta interna, los parámetros y el punto de lectura", () => {
    expect(accountReturnTarget("/cuenta/certificacion?seccion=rights#requisitos", "/cuenta")).toBe("/cuenta/certificacion?seccion=rights#requisitos");
    expect(accountReturnLabel("/cuenta/certificacion?seccion=rights")).toBe("Volver a Certificación");
    expect(accountReturnTarget("/login", "/cuenta/legal")).toBe("/login");
  });
  it.each([null, "https://example.test/cuenta", "//example.test/cuenta", "/\\example.test", "javascript:alert(1)", "/cuenta/certificacion/otra", "/viajes"])("descarta un origen no permitido: %s", value => {
    expect(accountReturnTarget(value, "/cuenta/legal")).toBe("/cuenta/legal");
  });
  it("evita retornar a la misma pantalla", () => {
    expect(accountReturnTarget("/cuenta/documentos?volver=x", "/cuenta", "/cuenta/documentos")).toBe("/cuenta");
  });
});
