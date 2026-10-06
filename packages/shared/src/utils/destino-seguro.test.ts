import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./destino-seguro";

describe("destinoSeguro — open redirect", () => {
  it("acepta rutas internas válidas", () => {
    expect(destinoSeguro("/")).toBe("/");
    expect(destinoSeguro("/cuenta")).toBe("/cuenta");
    expect(destinoSeguro("/viajes/abc?tab=1#hito")).toBe("/viajes/abc?tab=1#hito");
  });

  /* Regresión S-1: "/\evil.com" pasa un guard que solo comprueba startsWith("//"),
     y el parser WHATWG normaliza "\" a "/" construyendo una URL cross-origin. */
  it("rechaza backslash que el parser WHATWG normaliza a cross-origin", () => {
    expect(destinoSeguro("/\\evil.com")).toBe("/");
    expect(destinoSeguro("/\\/evil.com")).toBe("/");
    expect(new URL(`https://app.test${destinoSeguro("/\\evil.com")}`).origin).toBe(
      "https://app.test"
    );
  });

  it("rechaza esquemas absolutos y protocolos relativos", () => {
    expect(destinoSeguro("https://evil.com")).toBe("/");
    expect(destinoSeguro("//evil.com")).toBe("/");
    expect(destinoSeguro("http://evil.com/ruta")).toBe("/");
    expect(destinoSeguro("javascript:alert(1)")).toBe("/");
    expect(destinoSeguro("evil.com")).toBe("/");
  });

  it("rechaza CR/LF y tabs que rompen la cabecera Location", () => {
    expect(destinoSeguro("/cuenta\r\nSet-Cookie: a=b")).toBe("/");
    expect(destinoSeguro("/cuenta\nLocation: https://evil.com")).toBe("/");
    expect(destinoSeguro("/cuenta\t")).toBe("/");
  });

  it("acepta undefined, null y vacío usando el destino por defecto", () => {
    expect(destinoSeguro(undefined)).toBe("/");
    expect(destinoSeguro(null)).toBe("/");
    expect(destinoSeguro("")).toBe("/");
    expect(destinoSeguro(undefined, "/nueva-password")).toBe("/nueva-password");
    // Una ruta inválida también cae al destino por defecto
    expect(destinoSeguro("//evil.com", "/nueva-password")).toBe("/nueva-password");
  });
});