import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// La UI de perfil se extrajo a DriverProfileView.tsx; page.tsx conserva la
// carga de datos. El contrato (calificación visible debajo del nombre con ★)
// vive en ambos archivos.
const PERFIL_PAGE_FILE = readFileSync(
  resolve(__dirname, "../src/app/cuenta/perfil/page.tsx"),
  "utf8"
);

const PERFIL_VIEW_FILE = readFileSync(
  resolve(__dirname, "../src/app/cuenta/perfil/DriverProfileView.tsx"),
  "utf8"
);

describe("Perfil del Conductor - Calificación", () => {
  it("muestra la calificación del conductor debajo del nombre", () => {
    expect(PERFIL_PAGE_FILE).toContain("calificacion_promedio");
    expect(PERFIL_VIEW_FILE).toContain("Calificación del conductor");
    expect(PERFIL_VIEW_FILE).toContain("★");
  });
});
