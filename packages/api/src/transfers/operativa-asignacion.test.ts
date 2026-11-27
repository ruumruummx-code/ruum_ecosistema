import { describe, expect, it } from "vitest";
import { mensajeErrorAsignacion } from "./operativa";

describe("mensajeErrorAsignacion", () => {
  it("traduce los motivos de inelegibilidad que devuelve la base", () => {
    const error = mensajeErrorAsignacion({ message: "Conductor no elegible: expediente_no_aprobado, documentos_no_vigentes" });
    expect(error.message).toBe("No se puede asignar este conductor: su expediente aún no está aprobado; sus documentos no están vigentes.");
  });

  it("conserva un motivo desconocido de forma legible", () => {
    expect(mensajeErrorAsignacion({ message: "Conductor no elegible: motivo_nuevo" }).message)
      .toBe("No se puede asignar este conductor: motivo nuevo.");
  });

  it("propaga otros mensajes de la base tal cual", () => {
    expect(mensajeErrorAsignacion({ message: "No tienes permiso para asignar conductores." }).message)
      .toBe("No tienes permiso para asignar conductores.");
  });

  it("usa un mensaje genérico si no hay texto", () => {
    expect(mensajeErrorAsignacion({}).message).toBe("No pudimos asignar el conductor.");
  });
});
