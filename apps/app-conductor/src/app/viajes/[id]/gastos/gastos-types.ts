export type GastoTipoDb =
  | "combustible"
  | "caseta"
  | "maniobra"
  | "estadia"
  | "penalizacion"
  | "otro";

export interface GastoRegistro {
  id: string;
  tipo: GastoTipoDb;
  monto: number;
  descripcion: string | null;
  comprobante_ruta: string | null;
  registrado_en: string;
}

export function obtenerEtiquetaGasto(tipo: GastoTipoDb): string {
  switch (tipo) {
    case "combustible":
      return "⛽ Combustible / Gasolina";
    case "caseta":
      return "🛣️ Casetas / Peaje";
    case "maniobra":
      return "🔄 Maniobra / Carga";
    case "estadia":
      return "⏱️ Estadía / Espera";
    case "penalizacion":
      return "⚠️ Penalización";
    case "otro":
    default:
      return "📝 Estacionamiento / Lavado / Otro";
  }
}
