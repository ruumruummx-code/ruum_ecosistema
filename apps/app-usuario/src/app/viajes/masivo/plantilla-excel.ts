import { COLUMNAS_REQUERIDAS, revisarCsv, type FilaCsv } from "@ruum/shared/utils";
import type { VehiculoGuardado } from "../nuevo/types";

// Mismo orden que PLANTILLA.xlsx; los campos calculados se excluyen de la captura.
export const COLUMNAS_EXCEL = [
  ["CODIGO_POSTAL_ORIGEN", "origen_codigo_postal"], ["ESTADO_ORIGEN", "origen_estado"],
  ["MUNICIPIO_ORIGEN", "origen_ciudad"], ["COLONIA_ORIGEN", "origen_colonia"],
  ["CALLE_ORIGEN", "origen_calle"], ["NUMERO_ORIGEN", "origen_numero"],
  ["CODIGO_POSTAL_DESTINO", "destino_codigo_postal"], ["ESTADO_DESTINO", "destino_estado"],
  ["MUNICIPIO_DESTINO", "destino_ciudad"], ["COLONIA_DESTINO", "destino_colonia"],
  ["CALLE_DESTINO", "destino_calle"], ["NUMERO_DESTINO", "destino_numero"],
  ["FECHA_HORA_PROGRAMADA", "fecha_hora_programada"], ["VENTANA_ENTREGA", "ventana_entrega"],
  ["MARCA", "vehiculo_marca"], ["MODELO", "vehiculo_modelo"], ["CONDICION", "condicion"],
  ["TIPO", "vehiculo_tipo"], ["TRANSMISION", "vehiculo_transmision"], ["AÑO", "vehiculo_anio"],
  ["COLOR", "vehiculo_color"], ["PLACAS", "vehiculo_placas"], ["NUMERO DE SERIE/VIN", "vehiculo_vin"],
  ["ESTADO GENERAL", "estado_general_declarado"], ["TARJETA DE CIRCULACION", "tiene_tarjeta_circulacion"],
  ["VERIFICACION", "tiene_verificacion"], ["PUEDE CIRCULAR", "puede_circular_rodando"],
  ["CONTACTO ENTREGA", "contacto_entrega_nombre"], ["TELEFONO ENTREGA", "contacto_entrega_telefono"],
  ["CONTACTO RECEPCION", "contacto_recepcion_nombre"], ["TELEFONO RECEPCION", "contacto_recepcion_telefono"],
  ["MODALIDAD", "modalidad_programacion"], ["TIPO RUTA", "tipo_ruta"],
  ["VENTANA RECOLECCION", "ventana_recoleccion"], ["REFERENCIAS ORIGEN", "origen_referencias"],
  ["REFERENCIAS DESTINO", "destino_referencias"], ["INSTRUCCIONES", "instrucciones_especiales"],
  ["REFERENCIA", "referencia_externa"]
] as const;

export const CAMPOS_COMUNES = COLUMNAS_EXCEL.filter(([, campo]) =>
  !campo.startsWith("vehiculo_") && !["condicion", "estado_general_declarado", "tiene_tarjeta_circulacion", "tiene_verificacion", "puede_circular_rodando", "referencia_externa"].includes(campo)
);

function normalizar(v: string) {
  return v.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s/]+/g, "_");
}

const aliases = new Map<string, string>(COLUMNAS_EXCEL.map(([titulo, campo]) => [normalizar(titulo), campo]));
aliases.set("a�o", "vehiculo_anio"); // Encabezado con codificación heredada en la referencia.
const booleanos = new Set(["tiene_tarjeta_circulacion", "tiene_verificacion", "puede_circular_rodando"]);
const listas: Record<string, string[]> = {
  condicion: ["nueva", "seminueva", "rescate_mecanico"],
  vehiculo_tipo: ["sedan", "suv", "pick_up", "van", "luxury", "coleccion"],
  vehiculo_transmision: ["manual", "automatica", "electrica"],
  modalidad_programacion: ["lo_antes_posible", "programado"], tipo_ruta: ["local", "foraneo"],
  tiene_tarjeta_circulacion: ["Sí", "No"], tiene_verificacion: ["Sí", "No"], puede_circular_rodando: ["Sí", "No"]
};

export function filasParaPlantilla(vehiculos: VehiculoGuardado[], comunes: FilaCsv, cantidad = 1): FilaCsv[] {
  if (vehiculos.length > 100 || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100) throw new Error("Selecciona entre 1 y 100 traslados.");
  const bases = vehiculos.length ? vehiculos : Array.from({ length: cantidad }, () => null);
  return bases.map((v) => ({
    modalidad_programacion: "lo_antes_posible", tipo_ruta: "local", ...comunes,
    ...(v ? {
      vehiculo_marca: v.marca ?? "", vehiculo_modelo: v.modelo ?? "", vehiculo_anio: String(v.anio ?? ""),
      vehiculo_color: v.color ?? "", vehiculo_placas: v.placas ?? "", vehiculo_vin: v.vin ?? "",
      vehiculo_tipo: v.tipo ?? "", vehiculo_transmision: v.transmision ?? "", condicion: v.condicion ?? "",
      estado_general_declarado: v.estado_general_declarado ?? "",
      tiene_tarjeta_circulacion: v.tiene_tarjeta_circulacion == null ? "" : String(v.tiene_tarjeta_circulacion),
      tiene_verificacion: v.tiene_verificacion == null ? "" : String(v.tiene_verificacion),
      puede_circular_rodando: v.puede_circular_rodando == null ? "" : String(v.puede_circular_rodando)
    } : {})
  }));
}

export async function generarPlantillaExcel(filas: FilaCsv[]): Promise<ArrayBuffer> {
  const { Workbook } = await import("exceljs");
  const libro = new Workbook();
  const hoja = libro.addWorksheet("Traslados", { views: [{ state: "frozen", ySplit: 1, xSplit: 1 }] });
  hoja.columns = COLUMNAS_EXCEL.map(([header, key]) => ({ header, key, width: header.includes("CONTACTO") || header.includes("REFERENCIAS") ? 30 : 23 }));
  hoja.addRows(filas.map((fila) => Object.fromEntries(Object.entries(fila).map(([campo, valor]) =>
    [campo, booleanos.has(campo) && valor ? (valor === "true" ? "Sí" : "No") : valor]
  ))));
  hoja.getRow(1).height = 34;
  hoja.getRow(1).eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14263B" } };
    c.alignment = { wrapText: true, vertical: "middle" };
  });
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(2, filas.length + 1), column: COLUMNAS_EXCEL.length } };
  for (let row = 2; row <= 101; row++) {
    COLUMNAS_EXCEL.forEach(([, campo], index) => {
      const cell = hoja.getCell(row, index + 1);
      cell.numFmt = "@";
      cell.font = { color: { argb: "FF165DAD" } };
      if (row <= filas.length + 1 && !cell.value && (COLUMNAS_REQUERIDAS as readonly string[]).includes(campo)) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF0C2" } };
      }
      if (listas[campo]) cell.dataValidation = { type: "list", allowBlank: true, formulae: ['"' + listas[campo].join(",") + '"'], showErrorMessage: true, errorTitle: "Selecciona una opción", error: "Usa uno de los valores de la lista." };
    });
  }
  const ayuda = libro.addWorksheet("Instrucciones");
  ayuda.getColumn(1).width = 115;
  ["Plantilla de traslados Ruum", "Completa una fila por traslado, hasta 100. Conserva los encabezados de Traslados.",
    "Los campos amarillos están pendientes. Escribe códigos postales de 5 dígitos; placas, VIN y teléfonos como texto.",
    "Placas o VIN son obligatorios. Selecciona las opciones disponibles en las listas.",
    "Si eliges programado, captura una fecha futura: 2026-12-01T10:00:00-06:00 (incluye la zona horaria).",
    "La aplicación calcula categoría, gama, distancia, tiempo y precio al importar; no los captures.",
    "Las fechas nativas de Excel se interpretan en hora de Ciudad de México (UTC-06:00).",
    "Las celdas azules se pueden editar. Los datos precargados provienen de los vehículos seleccionados y datos comunes.",
    "Para traslados con paradas intermedias, utiliza el traslado individual. Esta plantilla representa rutas directas."
  ].forEach((texto) => ayuda.addRow([texto]));
  ayuda.getCell("A1").font = { bold: true, size: 16 };
  const buffer = await libro.xlsx.writeBuffer();
  return new Uint8Array(buffer).buffer as ArrayBuffer;
}

export async function leerArchivoMasivo(archivo: File) {
  if (archivo.name.toLowerCase().endsWith(".csv")) return revisarCsv(await archivo.text());
  const { Workbook, ValueType } = await import("exceljs");
  const libro = new Workbook();
  await libro.xlsx.load(await archivo.arrayBuffer());
  const hoja = libro.getWorksheet("Traslados") ?? libro.worksheets[0];
  if (!hoja) throw new Error("El Excel no contiene hojas.");
  if (hoja.columnCount > 100 || hoja.rowCount > 1001) throw new Error("La hoja excede el tamaño permitido. Usa la plantilla de hasta 100 traslados.");
  const encabezados: string[] = [];
  hoja.getRow(1).eachCell({ includeEmpty: true }, (cell, index) => {
    const original = normalizar(cell.text);
    encabezados[index - 1] = aliases.get(original) ?? original;
  });
  const usados = encabezados.filter((c) => c && !["categoria", "gama"].includes(c));
  if (new Set(usados).size !== usados.length) throw new Error("El Excel contiene columnas repetidas. Usa un encabezado por campo.");
  const filas: FilaCsv[] = [];
  for (let numero = 2; numero <= hoja.rowCount; numero++) {
    const datos: FilaCsv = {};
    let tieneDatos = false;
    encabezados.forEach((campo, index) => {
      const cell = hoja.getCell(numero, index + 1);
      if (cell.type === ValueType.Formula) throw new Error("No se permiten fórmulas en los datos de traslado (fila " + numero + "). Pega solo valores.");
      let valor = cell.value instanceof Date ? cell.value.toISOString().replace(/Z$/, "-06:00") : cell.text.trim();
      if (valor) tieneDatos = true;
      if (["categoria", "gama"].includes(campo)) return;
      if (booleanos.has(campo)) valor = ["si", "true", "1"].includes(normalizar(valor)) ? "true" : ["no", "false", "0"].includes(normalizar(valor)) ? "false" : valor;
      if ((campo === "origen_codigo_postal" || campo === "destino_codigo_postal") && /^\d{1,5}$/.test(valor)) valor = valor.padStart(5, "0");
      if (campo) datos[campo] = valor;
    });
    if (tieneDatos) {
      if (!datos.modalidad_programacion) datos.modalidad_programacion = datos.fecha_hora_programada ? "programado" : "lo_antes_posible";
      filas.push(datos);
    }
  }
  const campos = encabezados.filter((c) => c && !["categoria", "gama"].includes(c));
  const escape = (v: string) => '"' + v.replaceAll('"', '""') + '"';
  const csv = [campos.map(escape).join(","), ...filas.map((f) => campos.map((c) => escape(f[c] ?? "")).join(","))].join("\n");
  // Reutilizar las mismas comprobaciones de encabezados para CSV y Excel.
  const revision = revisarCsv(csv);
  return { ...revision, filas: revision.errores.length ? [] : filas };
}
