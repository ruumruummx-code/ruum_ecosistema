import { describe, it, expect } from "vitest";
import {
  consultarInventarioPasaportesUsuario,
  consultarMontosPagosCompletados,
  sanitizarBusquedaPostgrest
} from "./viajes-usuario";
import { createMockSupabaseClient } from "../test-utils/mock-supabase";

describe("transfers / viajes-usuario", () => {
  it("sanitizarBusquedaPostgrest: remueve caracteres especiales y acota longitud", () => {
    expect(sanitizarBusquedaPostgrest("Ciudad de México, D.F. (Centro)%")).toBe("Ciudad de México D F Centro");
    expect(sanitizarBusquedaPostgrest(null)).toBe("");
  });

  it("consultarInventarioPasaportesUsuario: obtiene registros de pasaportes del usuario", async () => {
    const mockClient = createMockSupabaseClient({
      tableData: {
        pasaporte_digital: [
          { traslado_id: "t-1", estado: "creado", creado_en: "2026-11-20" }
        ]
      }
    });

    const respuesta = await consultarInventarioPasaportesUsuario(mockClient, "user-123");
    expect(respuesta.data).toHaveLength(1);
  });

  it("consultarMontosPagosCompletados: filtra solo pagos completados", async () => {
    const mockClient = createMockSupabaseClient({
      tableData: {
        pagos: [
          { monto: 1500, estado: "completado" },
          { monto: 2000, estado: "completado" }
        ]
      }
    });

    const respuesta = await consultarMontosPagosCompletados(mockClient);
    expect(respuesta.data).toHaveLength(2);
  });
});
