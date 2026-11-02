import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizarFilaPlantilla, validarFila, valorCelda, parsearBufferPlantilla, numeroFilaExcel, motivosFilaMasiva } from "./carga-masiva";
import ExcelJS from "exceljs";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirActual = path.dirname(fileURLToPath(import.meta.url));
const rutaPlantilla = [
  path.resolve(process.cwd(), "public/docs-legales/plantilla-carga-masiva.xlsx"),
  path.resolve(process.cwd(), "apps/app-usuario/public/docs-legales/plantilla-carga-masiva.xlsx"),
  path.resolve(dirActual, "../../../public/docs-legales/plantilla-carga-masiva.xlsx"),
].find(existsSync) ?? path.resolve(process.cwd(), "public/docs-legales/plantilla-carga-masiva.xlsx");

describe("plantilla oficial masiva", () => {
  afterEach(() => vi.restoreAllMocks());
  it.each([["Automática", "automatica"], ["ELÉCTRICA", "electrica"], [" manual ", "manual"]])("normaliza transmisión %s antes de validar y cotizar", (valor, canonico) => {
    const datos = normalizarFilaPlantilla({ vehiculo_transmision: valor });
    expect(datos.vehiculo_transmision).toBe(canonico);
    expect(validarFila({ vehiculo_transmision: valor }, 0).datos.vehiculo_transmision).toBe(canonico);
    expect(validarFila(datos, 0).errores.vehiculo_transmision).toBeUndefined();
  });
  it("rechaza transmisiones desconocidas antes del pago", () => {
    expect(validarFila({ vehiculo_transmision: "desconocida" }, 0).errores.vehiculo_transmision).toContain("Selecciona");
  });
  it("conserva el número de fila Excel aunque existan filas vacías y detalla cada motivo", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Traslados");
    ws.addRow(["vehiculo_marca", "vehiculo_modelo", "origen_codigo_postal", "destino_codigo_postal"]);
    ws.getRow(7).values = ["Nissan", "Versa", "6700", "04360"];
    const buffer = await wb.xlsx.writeBuffer();
    const [datos] = await parsearBufferPlantilla(new Uint8Array(buffer).buffer);
    const fila = validarFila(datos!, 0);
    expect(numeroFilaExcel(fila)).toBe(7);
    expect(motivosFilaMasiva(fila)).toContain("Placas o VIN: Captura placas o VIN");
    expect(motivosFilaMasiva(fila)).toContain("Calle de origen: Campo requerido");
  });

  it("conserva campos canónicos al normalizar una fila ya normalizada", () => {
    expect(normalizarFilaPlantilla({ marca: "Honda", modelo: "Civic", origenCodigoPostal: "06700" })).toMatchObject({ marca: "Honda", modelo: "Civic", origenCodigoPostal: "06700" });
  });
  it("lee la hoja Traslados y omite las 499 filas con fórmulas vacías", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(new Uint8Array(readFileSync(rutaPlantilla)).buffer);
    expect(wb.worksheets[0]?.name).toBe("Instrucciones");
    const ws = wb.getWorksheet("Traslados")!;
    const headers: Record<number, string> = {};
    ws.getRow(1).eachCell((cell, col) => { headers[col] = valorCelda(cell.value); });
    const filas: Record<string, string>[] = [];
    ws.eachRow((row, i) => {
      if (i === 1) return;
      let capturada = false;
      const datos: Record<string, string> = {};
      row.eachCell((cell, col) => {
        datos[headers[col]!] = valorCelda(cell.value);
        if (cell.type !== 6 && valorCelda(cell.value)) capturada = true;
      });
      if (capturada) filas.push(normalizarFilaPlantilla(datos));
    });
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ origenCodigoPostal: "06700", marca: "Nissan", entregaTelefono: "5500000000" });
    // El ejemplo de la plantilla es histórico: debe marcarse para corrección.
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-02T18:00:00Z"));
    expect(validarFila(filas[0]!, 0).errores.fecha_hora_programada).toContain("2 horas");
    expect(validarFila({ ...filas[0]!, fecha_hora_programada: "2026-11-03T12:00:00-06:00" }, 0).estado).toBe("correcto");
    const invalida = { ...filas[0]!, anio: "1800", condicion: "incorrecta", entregaTelefono: "123" };
    const validada = validarFila(invalida, 0);
    expect(validada.errores).toHaveProperty("anio");
    expect(validada.errores).toHaveProperty("condicion");
    expect(validada.errores).toHaveProperty("entregaTelefono");
    expect(validarFila({ ...invalida, entregaTelefono: "5512345678" }, 0).estado).toBe("error");
    // RC-13: La plantilla oficial fue optimizada a ~200 KB (eliminando las hojas
    // de catálogo SEPOMEX innecesarias en cliente), permitiendo un parseo rápido (< 1 s)
    // y amplio margen bajo el límite de 5 MB para hasta 100 registros.
  }, 30000);
  it("conserva ceros de CP y no interpreta fórmulas ni objetos como texto", () => {
    expect(normalizarFilaPlantilla({ origen_codigo_postal: "6700" }).origenCodigoPostal).toBe("06700");
    expect(valorCelda({ formula: "SUM(A1)", result: "06700" })).toBe("06700");
    expect(valorCelda({ formula: "SUM(A1)" })).toBe("");
    expect(valorCelda({ error: "#N/A" })).toBe("");
  });
});


describe("fecha de los traslados masivos", () => {
  const ahora = Date.parse("2026-11-02T18:00:00Z"); // 12:00 en Ciudad de México
  afterEach(() => vi.restoreAllMocks());
  function programada(fecha: string) {
    vi.spyOn(Date, "now").mockReturnValue(ahora);
    return validarFila({ modalidad_programacion: "programado", fecha_hora_programada: fecha }, 0);
  }
  it.each(["2026-11-01T12:00:00-06:00", "2026-11-02T11:59:00-06:00", "2026-11-02T12:00:00-06:00", "2026-11-02T13:59:59-06:00"])("rechaza fecha pasada o sin anticipación: %s", fecha => {
    expect(programada(fecha).errores.fecha_hora_programada).toContain("2 horas");
  });
  it.each(["2026-11-02T14:00:00-06:00", "2026-11-03T12:00:00Z"])("acepta una fecha con anticipación suficiente: %s", fecha => {
    expect(programada(fecha).errores.fecha_hora_programada).toBeUndefined();
  });
  it.each(["", "no-es-fecha", "2026-11-03", "2027-02-30T15:00:00Z", "2026-13-03T15:00:00Z", "2026-11-03T24:00:00Z", "2026-11-03T15:60:00Z"])("rechaza fechas inválidas o sin hora: %s", fecha => {
    expect(programada(fecha).errores.fecha_hora_programada).toContain("válidas");
  });
  it("interpreta la fecha sin zona como hora de México y conserva la zona explícita", () => {
    const fila = programada("2026-11-02T14:00");
    expect(fila.errores.fecha_hora_programada).toBeUndefined();
    expect(fila.datos.fecha_hora_programada).toBe("2026-11-02T14:00-06:00");
    expect(programada("2026-11-02T14:00Z").errores.fecha_hora_programada).toContain("2 horas");
  });
  it("conserva la hora local de las celdas de fecha de Excel", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Traslados");
    ws.addRow(["vehiculo_marca", "vehiculo_modelo", "origen_codigo_postal", "destino_codigo_postal", "modalidad_programacion", "fecha_hora_programada"]);
    ws.addRow(["Nissan", "Versa", "06700", "04360", "programado", new Date("2026-11-02T14:00:00Z")]);
    ws.getCell("F2").numFmt = "yyyy-mm-dd hh:mm";
    const buffer = await wb.xlsx.writeBuffer();
    const [fila] = await parsearBufferPlantilla(new Uint8Array(buffer).buffer);
    expect(fila?.fecha_hora_programada).toBe("2026-11-02T14:00:00.000-06:00");
    expect(programada(fila!.fecha_hora_programada!).errores.fecha_hora_programada).toBeUndefined();
  });
  it("no exige fecha para lo antes posible y rechaza una fecha residual", () => {
    expect(validarFila({ modalidad_programacion: "lo_antes_posible" }, 0).errores.fecha_hora_programada).toBeUndefined();
    expect(validarFila({ modalidad_programacion: "lo_antes_posible", fecha_hora_programada: "2026-11-03T14:00Z" }, 0).errores.fecha_hora_programada).toContain("Borra la fecha");
  });
  it("detecta al volver a validar una fecha que ya perdió la anticipación mínima", () => {
    const fila = programada("2026-11-02T14:00:00-06:00");
    expect(fila.errores.fecha_hora_programada).toBeUndefined();
    vi.spyOn(Date, "now").mockReturnValue(ahora + 60_000);
    expect(validarFila(fila.datos, 0).errores.fecha_hora_programada).toContain("2 horas");
  });
});
