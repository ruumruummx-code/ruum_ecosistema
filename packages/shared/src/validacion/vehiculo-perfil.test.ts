import { expect, it } from "vitest";
import { esquemaVehiculoPerfil } from "./vehiculo-perfil";
const entrada = { marca: "Nissan", modelo: "Versa", color: "Blanco", anio: 2024, tipo: "sedan", placas: "abc-123", vin: "", transmision: "automatica" };
it("normaliza identificadores y conserva las declaraciones como pendientes por defecto", () => {
  expect(esquemaVehiculoPerfil.parse(entrada)).toMatchObject({ placas: "ABC123", tiene_verificacion: false, tiene_tarjeta_circulacion: false, puede_circular_rodando: false });
});
it("exige identificador y rechaza datos inválidos o privilegios inyectados", () => {
  for (const cambio of [{ placas: "", vin: "" }, { anio: 1900 }, { anio: 9999 }, { vin: "INVALIDO" }, { transmision: "desconocida" }, { usuario_id: "ajeno" }]) expect(esquemaVehiculoPerfil.safeParse({ ...entrada, ...cambio }).success).toBe(false);
});
