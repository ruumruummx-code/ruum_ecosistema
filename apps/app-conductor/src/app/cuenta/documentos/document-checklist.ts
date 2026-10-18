import type { Database } from "@ruum/shared/types";
import type { TipoDocumentoConductor } from "@ruum/api/services";
import { estadoVigenciaLicencia, vencimientoDocumentoDesdeLicencia } from "@ruum/shared/validacion";
import type { ConductorCuenta } from "../cuenta-utils";

export type DriverDocument = Database["public"]["Tables"]["documentos_conductor"]["Row"];
export const REQUIRED_DOCUMENTS: { type: TipoDocumentoConductor; title: string; icon: "id" | "passport" | "document" }[] = [
  { type: "licencia_frente", title: "Licencia - Frente", icon: "id" },
  { type: "licencia_reverso", title: "Licencia - Reverso", icon: "id" },
  { type: "identificacion_oficial", title: "Identificación Oficial (INE / Pasaporte)", icon: "passport" },
  { type: "constancia_situacion_fiscal", title: "Constancia de Situación Fiscal (SAT)", icon: "document" },
  { type: "documento_operativo", title: "Comprobante de Domicilio", icon: "document" },
];
export function buildDocumentChecklist(documents: DriverDocument[], driver: ConductorCuenta | null, now = new Date()) {
  return REQUIRED_DOCUMENTS.map(required => {
    const document = documents.filter(item => item.tipo === required.type && item.es_actual).sort((a, b) => b.version - a.version || Date.parse(b.creado_en) - Date.parse(a.creado_en))[0] ?? null;
    const licenseExpiry = vencimientoDocumentoDesdeLicencia(required.type, driver?.licencia_vigencia);
    const expired = [document?.expira_en, licenseExpiry].some(date => date && estadoVigenciaLicencia(date.slice(0, 10), now) === "vencida");
    const nearExpiry = [document?.expira_en, licenseExpiry].some(date => date && estadoVigenciaLicencia(date.slice(0, 10), now) === "por_vencer");
    const status = !document ? "pendiente" : expired ? "vencido" : document.estado === "rechazado" ? "rechazado" : document.estado === "aprobado" ? nearExpiry ? "por_vencer" : "aprobado" : document.estado === "en_revision" ? "en_revision" : document.estado === "cargado" ? "cargado" : "pendiente";
    const label = { pendiente: "Pendiente", vencido: "Vencido", rechazado: "Rechazado", aprobado: "Aprobado", por_vencer: "Por vencer", en_revision: "En revisión", cargado: "Cargado" }[status];
    return { ...required, document, status, label, complete: ["aprobado", "por_vencer", "en_revision", "cargado"].includes(status) };
  });
}
