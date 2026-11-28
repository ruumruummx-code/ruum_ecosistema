import { describe, it, expect } from "vitest";
import { listarPagosAdmin, obtenerFinanzasTrasladoAdmin } from "./pagos";
import { createMockSupabaseClient } from "../test-utils/mock-supabase";

describe("billing / pagos", () => {
  it("listarPagosAdmin: aplica límite y range correctamente", async () => {
    const mockClient = createMockSupabaseClient({
      user: { id: "user-finanzas" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-finanzas", rol_operativo: "finanzas" }],
        pagos: [
          { id: "pago-1", monto: 1200, registrado_en: "2026-11-20" },
          { id: "pago-2", monto: 800, registrado_en: "2026-11-19" }
        ],
        pasaporte_digital: [{ traslado_id: "t-1", creado_en: "2026-11-20" }],
        payouts_conductor: [{ id: "pay-1", periodo_inicio: "2026-11-01" }],
        datos_bancarios_conductor: [{ id: "db-1", actualizado_en: "2026-11-01" }],
        conductores: [{ id: "c-1", creado_en: "2026-11-01" }]
      },
      rpcData: {
        admin_tiene_permiso: true
      }
    });

    const resultado = await listarPagosAdmin(mockClient, { limite: 20, offset: 0 });

    expect(resultado.pagosUsuarios).toHaveLength(2);
    expect(resultado.pasaportes).toHaveLength(1);
    expect(resultado.payoutsConductores).toHaveLength(1);
    expect(resultado.datosBancariosConductores).toHaveLength(1);
    expect(resultado.conductores).toHaveLength(1);
  });

  it("obtenerFinanzasTrasladoAdmin: procesa métricas financieras del traslado", async () => {
    const mockClient = createMockSupabaseClient({
      user: { id: "user-finanzas" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-finanzas", rol_operativo: "finanzas" }]
      },
      rpcData: {
        admin_tiene_permiso: true,
        admin_finanzas_traslado: {
          precio_operativo: 1500,
          ingresos_cobrados: 1500,
          gastos_operativos: 200,
          pago_conductor: 900,
          margen_estimado: 400,
          margen_contra_precio: 0.266,
          corte_en: "2026-11-20T12:00:00Z"
        }
      }
    });

    const finanzas = await obtenerFinanzasTrasladoAdmin(mockClient, "traslado-123");

    expect(finanzas.precioOperativo).toBe(1500);
    expect(finanzas.ingresosCobrados).toBe(1500);
    expect(finanzas.pagoConductor).toBe(900);
    expect(finanzas.margenEstimado).toBe(400);
  });
});
