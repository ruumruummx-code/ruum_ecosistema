import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { emitirCotizacionIndividualServidor, type SolicitudCotizadaIndividual } from "./cotizacion-individual";
const solicitud = { vehiculo: { vehiculoId: "vehiculo-1" }, traslado: { distancia_km: 100 }, paradas: [] } as unknown as SolicitudCotizadaIndividual;
describe("emisión de cotización individual", () => {
  it("conserva el monto SQL y vincula el usuario autenticado y payload exacto", async () => {
    const snapshot = { monto: 8864.5, nonce: "nonce-sql" };
    const rpc = vi.fn().mockResolvedValue({ data: snapshot, error: null });
    const respuesta = await emitirCotizacionIndividualServidor({ rpc } as unknown as SupabaseClient<Database>, "auth-1", solicitud);
    expect(respuesta.traslado.snapshot_tarifa).toBe(snapshot);
    expect(rpc).toHaveBeenCalledWith("servidor_cotizar_traslado_individual", {
      p_auth_user_id: "auth-1", p_vehiculo_id: "vehiculo-1", p_vehiculo: null, p_traslado: solicitud.traslado, p_paradas: [],
    });
  });
  it("un error SQL no asigna otra categoría ni un precio alternativo", async () => {
    const error = { message: "Vehículo requiere clasificación" };
    const rpc = vi.fn().mockResolvedValue({ data: null, error });
    await expect(emitirCotizacionIndividualServidor({ rpc } as unknown as SupabaseClient<Database>, "auth-1", solicitud)).rejects.toBe(error);
  });
  it.each([null, { monto: 0, nonce: "x" }, { monto: 10 }, { monto: NaN, nonce: "x" }])("rechaza respuestas sin autorización válida %j", async (data) => {
    const rpc = vi.fn().mockResolvedValue({ data, error: null });
    await expect(emitirCotizacionIndividualServidor({ rpc } as unknown as SupabaseClient<Database>, "auth-1", solicitud)).rejects.toThrow();
  });
});
