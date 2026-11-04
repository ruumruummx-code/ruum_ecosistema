import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const raiz = path.resolve(__dirname, "..");
const leer = (rel: string) => fs.readFileSync(path.join(raiz, rel), "utf8");

describe("RUUM-USR-F1-001 — barrido de lectura pura y transición de rol", () => {
  it("mantiene obtenerUsuarioActual sin escrituras ni asignación de rol", () => {
    const fuente = fs.readFileSync(
      path.resolve(raiz, "../../packages/api/src/services/usuarios.ts"),
      "utf8"
    );
    const inicio = fuente.indexOf("export async function obtenerUsuarioActual");
    const fin = fuente.indexOf("\n}", inicio) + 2;
    const cuerpo = fuente.slice(inicio, fin);
    expect(cuerpo).not.toMatch(/\.(insert|update|upsert|delete)\s*\(/);
    expect(cuerpo).not.toMatch(/rol\s*:/);
    expect(cuerpo).toContain("buscarUsuarioPorAuthId");
  });

  it("no crea perfil ni asigna conductor desde la landing o /inicio", () => {
    const landing = leer("src/app/page.tsx");
    const inicio = leer("src/app/inicio/page.tsx");
    for (const fuente of [landing, inicio]) {
      expect(fuente).not.toContain("crearPerfilUsuarioActual");
      expect(fuente).not.toMatch(/rol\s*:\s*[\"']conductor/);
    }
  });

  it("documenta que sin_rol sólo transiciona por verificación documental/fiscal", () => {
    const contrato = fs.readFileSync(path.resolve(raiz, "../../docs/runbooks/FLUJO1-CIERRE.md"), "utf8");
    expect(contrato).toMatch(/sin_rol/i);
    expect(contrato).toMatch(/transici[oó]n permitida a conductor/i);
    expect(contrato).toMatch(/Flujo 13/i);
    expect(contrato).toMatch(/verificaci[oó]n documental.*fiscal/i);
  });
});
