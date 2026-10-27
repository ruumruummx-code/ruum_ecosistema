import { describe, expect, it } from "vitest";
import { normalizarFilaPlantilla, validarFila, valorCelda } from "./carga-masiva";
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
    expect(validarFila(filas[0]!, 0).estado).toBe("correcto");
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
