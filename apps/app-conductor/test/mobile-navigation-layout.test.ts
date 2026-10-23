import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const GLOBALS_CSS = readFileSync(resolve(__dirname, "../src/app/globals.css"), "utf8");

function mediaBlock(query: string) {
  const start = GLOBALS_CSS.indexOf(query);
  if (start === -1) throw new Error(`No se encontró ${query} en globals.css`);

  const open = GLOBALS_CSS.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < GLOBALS_CSS.length; index += 1) {
    const char = GLOBALS_CSS[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return GLOBALS_CSS.slice(open + 1, index);
  }

  throw new Error(`No se pudo cerrar ${query} en globals.css`);
}

describe("navegación móvil con viaje activo", () => {
  it("mantiene la interfaz en una columna y con controles táctiles bajo 768px", () => {
    const mobile = mediaBlock("@media (max-width: 767px)");

    expect(mobile).toContain(".conductor-responsive-grid");
    expect(mobile).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(mobile).toContain(".conductor-responsive-stack");
    expect(mobile).toContain("flex-direction: column");
    expect(mobile).toContain("min-height: 44px");
  });

  it("hace medios responsivos, tablas desplazables y titulares resistentes en móvil", () => {
    const mobile = mediaBlock("@media (max-width: 767px)");

    expect(mobile).toContain(":where(img, picture, video, canvas)");
    expect(mobile).toContain("max-width: 100%");
    expect(mobile).toContain(":where(table)");
    expect(mobile).toContain("overflow-x: auto");
    expect(mobile).toContain("font-size: clamp");
    expect(mobile).toContain("overflow-wrap: anywhere");
  });


});
