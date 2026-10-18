import { describe, expect, it } from "vitest";
import { buildDocumentChecklist, REQUIRED_DOCUMENTS, type DriverDocument } from "../src/app/cuenta/documentos/document-checklist";
import type { ConductorCuenta } from "../src/app/cuenta/cuenta-utils";

const driver = { licencia_vigencia: "2027-12-31" } as ConductorCuenta;
const now = new Date("2026-10-18T12:00:00Z");
const document = (type: string, overrides: Partial<DriverDocument> = {}) => ({ tipo: type, es_actual: true, estado: "en_revision", id: type, version: 1, creado_en: "2026-10-18T12:00:00Z", expira_en: null, ...overrides }) as DriverDocument;
describe("expediente documental", () => {
  it("requiere los cinco documentos actuales y permite avanzar mientras están en revisión", () => {
    expect(buildDocumentChecklist([], driver, now).every(item => item.complete)).toBe(false);
    expect(buildDocumentChecklist(REQUIRED_DOCUMENTS.map(item => document(item.type)), driver, now).every(item => item.complete)).toBe(true);
  });
  it("elige la última versión actual y no usa una aprobación histórica para continuar", () => {
    const rows = buildDocumentChecklist([document("licencia_frente", { estado: "aprobado" }), document("licencia_frente", { version: 2, estado: "rechazado" }), document("licencia_frente", { version: 3, estado: "aprobado", es_actual: false })], driver, now);
    expect(rows[0]).toMatchObject({ status: "rechazado", complete: false, document: { version: 2 } });
  });
  it("bloquea vencidos por fecha del archivo o licencia y estados desconocidos", () => {
    expect(buildDocumentChecklist([document("documento_operativo", { expira_en: "2026-10-17" })], driver, now)[4]).toMatchObject({ status: "vencido", complete: false });
    expect(buildDocumentChecklist([document("licencia_frente")], { licencia_vigencia: "2026-10-17" } as ConductorCuenta, now)[0]).toMatchObject({ status: "vencido", complete: false });
    expect(buildDocumentChecklist([document("licencia_frente", { estado: "desconocido" })], driver, now)[0].complete).toBe(false);
  });
});
