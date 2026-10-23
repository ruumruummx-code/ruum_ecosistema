import { describe, expect, it } from "vitest";
import {
  ETIQUETA_DOCUMENTO,
  OPCIONES_LICENCIA_SELECT,
  PASOS_REGISTRO,
  TIPOS_ARCHIVO_PERMITIDOS,
  TEXTO_GUARDADO_REMOTO,
  estadoInicialDocumentos,
} from "../src/app/registro/registration-types";

describe("contratos del flujo de registro", () => {
  it("mantiene la secuencia completa y su paso final de revisión", () => {
    expect(PASOS_REGISTRO.map(({ shortTitle }) => shortTitle)).toEqual([
      "Cuenta", "Identidad", "Licencia", "Documentos", "Confirmación",
    ]);
    expect(PASOS_REGISTRO.at(-1)?.titulo).toBe("Revisión y envío");
  });

  it("inicia todos los documentos pendientes y etiqueta cada requisito", () => {
    expect(estadoInicialDocumentos()).toEqual({
      licenciaFrente: "pendiente",
      licenciaReverso: "pendiente",
      identificacionOficial: "pendiente",
    });
    expect(Object.keys(ETIQUETA_DOCUMENTO)).toHaveLength(3);
  });

  it("ofrece opciones de licencia y tipos de archivo permitidos", () => {
    expect(OPCIONES_LICENCIA_SELECT.length).toBeGreaterThan(20);
    expect(OPCIONES_LICENCIA_SELECT.find(({ valor }) => valor.includes("CDMX — Tipo A"))?.grupo).toContain("Ciudad de México");
    expect([...TIPOS_ARCHIVO_PERMITIDOS]).toEqual(expect.arrayContaining([
      "image/jpeg", "image/png", "image/webp", "application/pdf",
    ]));
  });

  it("presenta estados de guardado remoto con texto explícito", () => {
    expect(TEXTO_GUARDADO_REMOTO).toEqual({
      inactivo: "",
      guardando: "Guardando…",
      guardado: "Guardado",
      sin_conexion: "Sin conexión",
      error: "Error al guardar",
    });
  });
});
