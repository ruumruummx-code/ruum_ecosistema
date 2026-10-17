import catalogo from "./sat-cfdi-4.json";

export type TipoPersonaFiscal = "fisica" | "moral";
export interface OpcionFiscalSat {
  clave: string;
  descripcion: string;
  fisica: boolean;
  moral: boolean;
  vigenteDesde: string;
  vigenteHasta: string | null;
  regimenes?: string[];
}
export const CATALOGO_FISCAL_SAT = catalogo;

/** Sólo para leer datos legados: al guardar se exige la clave exacta. */
export function claveFiscal(valor: string) {
  return valor.trim().split(/\s|·/)[0];
}

export function textoFiscal(opcion: Pick<OpcionFiscalSat, "clave" | "descripcion">) {
  return `${opcion.clave} - ${opcion.descripcion}`;
}

export function normalizarBusquedaFiscal(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function consultarCatalogosSat({ regimen, persona, busqueda = "", fecha = new Date().toISOString().slice(0, 10) }: {
  regimen?: string; persona?: TipoPersonaFiscal; busqueda?: string; fecha?: string;
} = {}) {
  const vigente = (o: OpcionFiscalSat) => o.vigenteDesde <= fecha && (!o.vigenteHasta || fecha <= o.vigenteHasta);
  const q = normalizarBusquedaFiscal(busqueda);
  const coincide = (o: OpcionFiscalSat) => vigente(o) && (!persona || o[persona]) &&
    normalizarBusquedaFiscal(`${textoFiscal(o)} ${o.clave === "626" ? "resico" : ""}`).includes(q);
  return {
    versionCfdi: catalogo.versionCfdi,
    fuente: catalogo.fuente,
    publicado: catalogo.publicado,
    sha256: catalogo.sha256,
    regimenes: catalogo.regimenes.filter(coincide),
    usos: catalogo.usos.filter(o => coincide(o) && (!regimen || o.regimenes.includes(regimen))),
  };
}

export function validarSeleccionFiscalSat(regimen: string, uso: string, rfc: string): string | null {
  const persona = rfc.trim().length === 12 ? "moral" : rfc.trim().length === 13 ? "fisica" : undefined;
  if (!persona) return "Captura un RFC válido de 12 o 13 caracteres.";
  const opciones = consultarCatalogosSat({ regimen, persona });
  if (!opciones.regimenes.some(o => o.clave === regimen)) return "El régimen fiscal no es válido para el RFC.";
  if (!opciones.usos.some(o => o.clave === uso)) return "El uso de CFDI no es compatible con el régimen fiscal y RFC.";
  return null;
}
