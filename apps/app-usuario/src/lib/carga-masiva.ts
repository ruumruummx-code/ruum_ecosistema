import { z } from "zod";

export const MAX_FILAS_MASIVAS = 100;
export const esquemaFilaMasiva = z.object({
  origenCodigoPostal: z.string().regex(/^\d{5}$/, "CP de 5 dígitos requerido"),
  destinoCodigoPostal: z.string().regex(/^\d{5}$/, "CP de 5 dígitos requerido"),
  marca: z.string().trim().min(1, "Marca requerida").max(80),
  modelo: z.string().trim().min(1, "Modelo requerido").max(80),
  anio: z.string().refine(v => /^\d{4}$/.test(v) && +v >= 1980 && +v <= new Date().getFullYear() + 1, "Año fuera del rango permitido"),
  condicion: z.enum(["nueva", "seminueva", "rescate_mecanico"], { message: "Usa nueva, seminueva o rescate_mecanico" }),
  entregaNombre: z.string().trim().min(1, "Nombre requerido").max(100),
  entregaTelefono: z.string().regex(/^\d{10}$/, "Teléfono de 10 dígitos requerido"),
  recepcionNombre: z.string().trim().min(1, "Nombre requerido").max(100),
  recepcionTelefono: z.string().regex(/^\d{10}$/, "Teléfono de 10 dígitos requerido"),
}).catchall(z.string().max(2000));
export type FilaMasivaEntrada = z.infer<typeof esquemaFilaMasiva>;
export interface FilaValidada {
  errorCotizacion?: string;
  indice: number;
  datos: FilaMasivaEntrada;
  errores: Record<string, string>;
  estado: "correcto" | "error";
}
export function validarFila(datos: Record<string, string>, indice: number): FilaValidada {
  const resultado = esquemaFilaMasiva.safeParse(datos);
  const errores: Record<string, string> = {};
  if (!resultado.success) for (const issue of resultado.error.issues) errores[String(issue.path[0])] = issue.message;
  if (!datos.vehiculo_placas && !datos.vehiculo_vin) errores.vehiculo_placas = "Captura placas o VIN";
  for (const lado of ["origen", "destino"]) {
    for (const campo of ["calle", "numero", "colonia"]) {
      const key = `${lado}_${campo}`;
      if (!datos[key]?.trim()) errores[key] = "Campo requerido";
    }
  }
  if (datos.modalidad_programacion === "programado" && !Number.isFinite(Date.parse(datos.fecha_hora_programada ?? ""))) errores.fecha_hora_programada = "Fecha y hora requeridas";
  if (datos.modalidad_programacion && !["programado", "lo_antes_posible"].includes(datos.modalidad_programacion)) errores.modalidad_programacion = "Selecciona programado o lo_antes_posible";
  if (datos.modalidad_programacion !== "programado" && datos.fecha_hora_programada) errores.fecha_hora_programada = "Borra la fecha para un traslado lo antes posible";
  if (datos.tipo_traslado && !["local", "foraneo"].includes(datos.tipo_traslado)) errores.tipo_traslado = "Selecciona local o foraneo";
  for (const ventana of ["recoleccion", "entrega"]) {
    const key = `ventana_${ventana}_horario`;
    if (datos[`ventana_${ventana}`] === "específica" && !/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/.test(datos[key] ?? "")) errores[key] = "Usa HH:MM-HH:MM (24 h)";
  }
  return { indice, datos: (resultado.success ? resultado.data : datos) as FilaMasivaEntrada, errores, estado: Object.keys(errores).length ? "error" : "correcto" };
}

const ALIAS: Record<string, string> = {
  vehiculo_marca: "marca", vehiculo_modelo: "modelo", vehiculo_anio: "anio",
  origen_codigo_postal: "origenCodigoPostal", destino_codigo_postal: "destinoCodigoPostal",
  contacto_entrega_nombre: "entregaNombre", contacto_entrega_telefono: "entregaTelefono",
  contacto_recepcion_nombre: "recepcionNombre", contacto_recepcion_telefono: "recepcionTelefono",
};
export function normalizarFilaPlantilla(original: Record<string, string>): Record<string, string> {
  const datos = { ...original };
  for (const [origen, destino] of Object.entries(ALIAS)) datos[destino] = original[origen] ?? "";
  for (const campo of ["origenCodigoPostal", "destinoCodigoPostal"]) if (/^\d{1,5}$/.test(datos[campo] ?? "")) datos[campo] = datos[campo]!.padStart(5, "0");
  for (const campo of ["entregaTelefono", "recepcionTelefono"]) datos[campo] = (datos[campo] ?? "").replace(/^\+52/, "").replace(/[\s()-]/g, "");
  return datos;
}

/** Las fórmulas nunca se ejecutan. Solo se leen sus resultados guardados. */
export function valorCelda(valor: unknown): string {
  if (valor == null) return "";
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === "object") {
    if ("formula" in valor || "sharedFormula" in valor) return "result" in valor ? valorCelda(valor.result) : "";
    if ("richText" in valor && Array.isArray(valor.richText)) return valor.richText.map(v => v.text).join("");
    return "";
  }
  return String(valor).trim();
}
