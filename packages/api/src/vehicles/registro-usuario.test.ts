import { beforeEach, expect, it, vi } from "vitest";
import { registrarVehiculoUsuario } from "./vehiculos";
import { esquemaVehiculoPerfil } from "@ruum/shared/validacion";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
const rpc = vi.fn();
const cliente = { rpc } as unknown as SupabaseClient<Database>;
const datos = esquemaVehiculoPerfil.parse({ marca: "Nissan", modelo: "Versa", anio: 2024, tipo: "sedan", color: "Blanco", placas: "ABC123", vin: "", transmision: "automatica" });
beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: "id-confirmado", error: null }); });
it("registra mediante la RPC restringida sin crear traslados", async () => {
  expect(await registrarVehiculoUsuario(cliente, "id-solicitud", datos)).toBe("id-confirmado");
  expect(rpc).toHaveBeenCalledWith("usuario_registra_vehiculo", { p_id: "id-solicitud", p_datos: datos });
});
it("no devuelve éxito sin confirmación y valida antes de invocar", async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  await expect(registrarVehiculoUsuario(cliente, "id", datos)).rejects.toThrow("No se confirmó");
  rpc.mockClear();
  await expect(registrarVehiculoUsuario(cliente, "id", { ...datos, anio: 1800 })).rejects.toThrow();
  expect(rpc).not.toHaveBeenCalled();
});
