import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../../..");

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("documentacion de Fase 5", () => {
  it("mantiene actualizado el README de App Conductor", () => {
    const readme = readRepoFile("apps/app-conductor/README.md");

    expect(readme).toContain("## Arquitectura actual");
    expect(readme).toContain("## Evidencia privada");
    expect(readme).toContain("signed URLs");
    expect(readme).toContain("## Cola offline");
    expect(readme).toContain("conductor_confirmar_llegada_destino");
    expect(readme).toContain("p_fuera_geocerca");
    expect(readme).toContain("## Temas y tarjetas");
    expect(readme).toContain("## Comandos de test");
    expect(readme).toContain("## Dispositivos probados");
    expect(readme).toContain("## Funcionalidades pendientes reales");
    expect(readme).toContain("no hay shell local completo");
    expect(readme).not.toContain("mientras Supabase Storage no esté conectado");
    expect(readme).not.toContain("URL de marcador de posición");
  });

  it("define el acta QA con campos obligatorios y decisiones pendientes", () => {
    const acta = readRepoFile("docs/qa/fase-5-validacion.md");

    for (const campo of [
      "Commit",
      "Fecha",
      "Ambiente",
      "Build",
      "Dispositivo",
      "Version Android",
      "Ejecutor",
      "Caso",
      "Resultado",
      "Evidencia",
      "Incidencias",
      "Decision"
    ]) {
      expect(acta).toContain(campo);
    }

    expect(acta).toContain("OP-OFF-01");
    expect(acta).toContain("EV-QUE-01");
    expect(acta).toContain("AND-BKP-01");
    expect(acta).toContain("Producto");
    expect(acta).toContain("Operacion");
    expect(acta).toContain("Tecnologia");
  });

  // PENDIENTE (deuda de Fase 5, ver tests/E2E_SETUP.md): CI todavía no
  // publica artifacts de evidencia (playwright-report, axe-results.json,
  // .lighthouse-ci, storybook-static) ni aplica retention-days por tipo de
  // rama. `git log -S retention-days -- .github/workflows/ci.yml` no arroja
  // resultados: nunca se implementó. Este test valida hoy lo que el pipeline
  // sí garantiza; ampliarlo exige crear los jobs de a11y/E2E/Lighthouse.
  it("ejecuta los controles de calidad que el pipeline garantiza", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");

    expect(ci).toContain("pnpm lint");
    expect(ci).toContain("pnpm typecheck");
    expect(ci).toContain("pnpm test:unit");
    expect(ci).toContain("pnpm --filter @ruum/app-usuario test");
    expect(ci).toContain("pnpm check:fronteras");
    expect(ci).toContain("pnpm check:migrations");
    expect(ci).toContain("pnpm scan:secrets");
  });
});

