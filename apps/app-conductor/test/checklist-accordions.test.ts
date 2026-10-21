import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const EVIDENCIA_PAGE_FILE = readFileSync(
  resolve(__dirname, "../src/app/viajes/[id]/evidencia/page.tsx"),
  "utf8"
);

const EVIDENCE_LOGIC_FILE = readFileSync(
  resolve(__dirname, "../src/app/viajes/[id]/evidencia/useEvidenciaPageLogic.ts"),
  "utf8"
);

const EVIDENCE_WIZARD_FILE = readFileSync(
  resolve(__dirname, "../src/app/viajes/[id]/evidencia/EvidenceWizard.tsx"),
  "utf8"
);

describe("Checklist de Evidencia - Acordeones de Documentos y Notas", () => {
  it("contiene los controles de acordeón para documentos y notas en el hook de lógica", () => {
    expect(EVIDENCE_LOGIC_FILE).toContain("acordeonDocsAbierto");
    expect(EVIDENCE_LOGIC_FILE).toContain("acordeonNotasAbierto");
  });

  it("renderiza las secciones de documentos y notas en la página", () => {
    expect(EVIDENCIA_PAGE_FILE).toContain("EvidenciaDocumentosSection");
    expect(EVIDENCIA_PAGE_FILE).toContain("EvidenciaNotasSection");
  });

  it("contiene los controles de acordeón para documentos y notas en EvidenceWizard.tsx", () => {
    expect(EVIDENCE_WIZARD_FILE).toContain("docsAbierto");
    expect(EVIDENCE_WIZARD_FILE).toContain("notasAbierto");
    expect(EVIDENCE_WIZARD_FILE).toContain("📄 Documentos y Placas");
    expect(EVIDENCE_WIZARD_FILE).toContain("📝 Notas o Comentarios");
  });
});
