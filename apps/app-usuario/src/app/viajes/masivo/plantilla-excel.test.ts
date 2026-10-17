import { describe, expect, it } from "vitest";
import { Workbook } from "exceljs";
import { COLUMNAS_REQUERIDAS } from "@ruum/shared/utils";
import { COLUMNAS_EXCEL, filasParaPlantilla, generarPlantillaExcel, leerArchivoMasivo } from "./plantilla-excel";
import type { VehiculoGuardado } from "../nuevo/types";

const vehiculo = {
  id: "v-1", marca: "Nissan", modelo: "Versa", anio: 2024, placas: "ABC123",
  vin: null, color: "Blanco", tipo: "sedan", transmision: "manual", condicion: "seminueva",
  estado_general_declarado: "Sin daños", tiene_tarjeta_circulacion: true,
  tiene_verificacion: false, puede_circular_rodando: true
} as VehiculoGuardado;

const comunes = {
  origen_codigo_postal: "06700", origen_calle: "Reforma", origen_numero: "100", origen_colonia: "Roma",
  destino_codigo_postal: "04360", destino_calle: "Universidad", destino_numero: "300", destino_colonia: "Copilco",
  contacto_entrega_telefono: "+525500000000", instrucciones_especiales: "Entregar en recepción\nPedir identificación"
};

describe("Plantilla Excel precargada", () => {
  it("conserva vehículos, datos comunes, ceros iniciales y valores booleanos al importar", async () => {
    const filas = filasParaPlantilla([vehiculo], comunes);
    const buffer = await generarPlantillaExcel(filas);
    const libro = new Workbook();
    await libro.xlsx.load(buffer);
    const hoja = libro.getWorksheet("Traslados")!;
    expect(hoja.getCell("A2").value).toBe("06700");
    expect(hoja.getCell("A2").numFmt).toBe("@");
    const condicion = COLUMNAS_EXCEL.findIndex(([, campo]) => campo === "condicion") + 1;
    expect(hoja.getCell(2, condicion).dataValidation.formulae).toEqual(['"nueva,seminueva,rescate_mecanico"']);
    const revision = await leerArchivoMasivo(new File([buffer], "precargada.xlsx"));
    expect(revision.errores).toEqual([]);
    expect(revision.filas).toHaveLength(1); // Ignorar las 99 filas vacías con validaciones.
    expect(revision.filas[0]).toMatchObject({ ...comunes, vehiculo_placas: "ABC123", vehiculo_transmision: "manual", tiene_tarjeta_circulacion: "true", tiene_verificacion: "false" });
  });

  it("genera filas vacías sin inventar vehículos ni condiciones", () => {
    const filas = filasParaPlantilla([], comunes, 3);
    expect(filas).toHaveLength(3);
    expect(filas[0].vehiculo_marca).toBeUndefined();
    expect(filas[0].condicion).toBeUndefined();
    expect(filas[0].origen_codigo_postal).toBe("06700");
    expect(() => filasParaPlantilla([], {}, 101)).toThrow(/100/);
  });

  it("importa encabezados de la referencia y fechas nativas con la zona horaria definida", async () => {
    const libro = new Workbook();
    const hoja = libro.addWorksheet("plantilla-traslados-masivos-ruu");
    hoja.addRow(COLUMNAS_EXCEL.map(([titulo]) => titulo));
    const datos = filasParaPlantilla([vehiculo], comunes)[0];
    hoja.addRow(COLUMNAS_EXCEL.map(([, campo]) => datos[campo] ?? ""));
    hoja.getCell("A2").value = 6700;
    hoja.getCell("M2").value = new Date("2027-01-01T10:00:00Z");
    const modalidad = COLUMNAS_EXCEL.findIndex(([, campo]) => campo === "modalidad_programacion") + 1;
    hoja.getCell(2, modalidad).value = "";
    const buffer = await libro.xlsx.writeBuffer();
    const revision = await leerArchivoMasivo(new File([new Uint8Array(buffer)], "referencia.xlsx"));
    expect(revision.errores).toEqual([]);
    expect(revision.filas[0]).toMatchObject({ origen_codigo_postal: "06700", fecha_hora_programada: "2027-01-01T10:00:00.000-06:00", modalidad_programacion: "programado" });
  });

  it("rechaza fórmulas y encabezados duplicados", async () => {
    const libro = new Workbook();
    const hoja = libro.addWorksheet("Traslados");
    hoja.addRow([...COLUMNAS_REQUERIDAS]);
    hoja.addRow(["Nissan"]);
    hoja.getCell("A2").value = { formula: '"Nissan"', result: "Nissan" };
    let buffer = await libro.xlsx.writeBuffer();
    await expect(leerArchivoMasivo(new File([new Uint8Array(buffer)], "formula.xlsx"))).rejects.toThrow(/fórmulas/);
    hoja.getCell("A2").value = "Nissan";
    hoja.getCell(1, COLUMNAS_REQUERIDAS.length + 1).value = "MARCA";
    buffer = await libro.xlsx.writeBuffer();
    await expect(leerArchivoMasivo(new File([new Uint8Array(buffer)], "duplicado.xlsx"))).rejects.toThrow(/repetidas/);
  });
});
