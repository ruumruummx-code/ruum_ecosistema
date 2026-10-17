import { describe, it, expect } from "vitest";
import { leerArchivoMasivo } from "./plantilla-excel";

describe("Plantilla RR-2026-021", () => {
  it("debe mapear correctamente los encabezados de la plantilla adjunta", async () => {
    // Crear un archivo Excel de prueba con los encabezados de la plantilla adjunta
    const { Workbook } = await import("exceljs");
    const libro = new Workbook();
    const hoja = libro.addWorksheet("Traslados");
    
    // Encabezados de la plantilla adjunta (34 columnas)
    const encabezados = [
      "CODIGO_POSTAL_ORIGEN", "CODIGO_POSTAL_DESTINO", "MARCA", "MODELO", "CONDICION",
      "FECHA", "HORA", "CATEGORIA", "GAMA", "TIPO", "TRANSMISION", "AÑO", "COLOR",
      "PLACAS", "NUMERO_SERIE/VIN", "ESTADO_GENERAL", "ESTADO_ORIGEN", "MUNICIPIO_ORIGEN",
      "COLONIA_ORIGEN", "CALLE_ORIGEN", "NUMERO_ORIGEN", "ESTADO_DESTINO", "MUNICIPIO_DESTINO",
      "COLONIA_DESTINO", "CALLE_DESTINO", "NUMERO_DESTINO", "NOMBRE_CONTACTO_ORIGEN",
      "TELEFONO_CONTACTO_ORIGEN", "NOMBRE_CONTACTO_DESTINO", "TELEFONO_CONTACTO_DESTINO",
      "TIPO_TRASLADO", "VENTANA_RECOLECCION", "VENTANA_ENTREGA", "MOTIVO_TRASLADO"
    ];
    
    hoja.addRow(encabezados);
    // Fila de ejemplo
    hoja.addRow([
      "06700", "04360", "Nissan", "Versa", "seminueva",
      "2026-12-01", "10:00", "ligero_a", "entrada", "sedan", "manual", "2024", "Blanco",
      "ABC123", "12345678901234567", "Excelente, sin daños visibles", "CDMX", "Benito Juárez",
      "Roma Norte", "Av. Reforma", "100", "CDMX", " Coyoacán",
      "Copilco Universidad", "Av. Universidad", "300", "Juan Pérez",
      "5512345678", "María López", "5512345679",
      "local", "Mañana 09:00–13:00", "Tarde 13:00–18:00", "Entrega de vehículo"
    ]);
    
    const buffer = await libro.xlsx.writeBuffer();
    const archivo = new File([buffer], "plantilla-traslados-masivos-ruum.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    
    const resultado = await leerArchivoMasivo(archivo);
    
    // Debug: ver qué errores hay
    if (resultado.errores.length > 0) {
      console.log("Errores:", resultado.errores);
    }
    
    expect(resultado.errores).toHaveLength(0);
    expect(resultado.filas).toHaveLength(1);
    
    const fila = resultado.filas[0];
    expect(fila.origen_codigo_postal).toBe("06700");
    expect(fila.destino_codigo_postal).toBe("04360");
    expect(fila.vehiculo_marca).toBe("Nissan");
    expect(fila.vehiculo_modelo).toBe("Versa");
    expect(fila.condicion).toBe("seminueva");
    expect(fila.vehiculo_placas).toBe("ABC123");
    expect(fila.vehiculo_vin).toBe("12345678901234567");
    expect(fila.origen_estado).toBe("CDMX");
    expect(fila.origen_ciudad).toBe("Benito Juárez");
    expect(fila.destino_estado).toBe("CDMX");
    expect(fila.destino_ciudad).toBe("Coyoacán");
    expect(fila.contacto_entrega_nombre).toBe("Juan Pérez");
    expect(fila.contacto_entrega_telefono).toBe("5512345678");
    expect(fila.contacto_recepcion_nombre).toBe("María López");
    expect(fila.contacto_recepcion_telefono).toBe("5512345679");
    expect(fila.tipo_ruta).toBe("local");
    expect(fila.ventana_recoleccion).toBe("Mañana 09:00–13:00");
    expect(fila.ventana_entrega).toBe("Tarde 13:00–18:00");
    expect(fila.instrucciones_especiales).toBe("Entrega de vehículo");
  });

  it("debe rechazar encabezados alterados", async () => {
    const { Workbook } = await import("exceljs");
    const libro = new Workbook();
    const hoja = libro.addWorksheet("Traslados");
    
    // Encabezados alterados (no coinciden con la plantilla)
    hoja.addRow(["CP_ORIGEN", "CP_DESTINO", "MARCA_VEHICULO", "MODELO_VEHICULO"]);
    hoja.addRow(["06700", "04360", "Nissan", "Versa"]);
    
    const buffer = await libro.xlsx.writeBuffer();
    const archivo = new File([buffer], "plantilla-alterada.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    
    const resultado = await leerArchivoMasivo(archivo);
    
    // Debe rechazar porque los encabezados no coinciden
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.filas).toHaveLength(0);
  });

  it("debe combinar FECHA y HORA en fecha_hora_programada", async () => {
    const { Workbook } = await import("exceljs");
    const libro = new Workbook();
    const hoja = libro.addWorksheet("Traslados");
    
    const encabezados = [
      "CODIGO_POSTAL_ORIGEN", "CODIGO_POSTAL_DESTINO", "MARCA", "MODELO", "CONDICION",
      "FECHA", "HORA", "CATEGORIA", "GAMA", "TIPO", "TRANSMISION", "AÑO", "COLOR",
      "PLACAS", "NUMERO_SERIE/VIN", "ESTADO_GENERAL", "ESTADO_ORIGEN", "MUNICIPIO_ORIGEN",
      "COLONIA_ORIGEN", "CALLE_ORIGEN", "NUMERO_ORIGEN", "ESTADO_DESTINO", "MUNICIPIO_DESTINO",
      "COLONIA_DESTINO", "CALLE_DESTINO", "NUMERO_DESTINO", "NOMBRE_CONTACTO_ORIGEN",
      "TELEFONO_CONTACTO_ORIGEN", "NOMBRE_CONTACTO_DESTINO", "TELEFONO_CONTACTO_DESTINO",
      "TIPO_TRASLADO", "VENTANA_RECOLECCION", "VENTANA_ENTREGA", "MOTIVO_TRASLADO"
    ];
    
    hoja.addRow(encabezados);
    hoja.addRow([
      "06700", "04360", "Nissan", "Versa", "seminueva",
      "2026-12-01", "10:00", "ligero_a", "entrada", "sedan", "manual", "2024", "Blanco",
      "ABC123", "12345678901234567", "Excelente, sin daños visibles", "CDMX", "Benito Juárez",
      "Roma Norte", "Av. Reforma", "100", "CDMX", " Coyoacán",
      "Copilco Universidad", "Av. Universidad", "300", "Juan Pérez",
      "5512345678", "María López", "5512345679",
      "local", "Mañana 09:00–13:00", "Tarde 13:00–18:00", "Entrega de vehículo"
    ]);
    
    const buffer = await libro.xlsx.writeBuffer();
    const archivo = new File([buffer], "plantilla-fecha-hora.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    
    const resultado = await leerArchivoMasivo(archivo);
    
    expect(resultado.errores).toHaveLength(0);
    expect(resultado.filas).toHaveLength(1);
    
    const fila = resultado.filas[0];
    expect(fila.fecha_hora_programada).toContain("2026-12-01");
    expect(fila.fecha_hora_programada).toContain("10:00");
  });
});
