import { describe, expect, it } from "vitest";
import { actualizarReclamoSeguroAdmin } from "@ruum/api/services";
import { clienteFinanzas, rechazoBd } from "../../test-utils/supabase-finanzas";

describe("panel-admin / reclamos-seguro", () => {
  it("registra el responsable de pago al resolver un reclamo", async () => {
    const { cliente, solicitudes } = clienteFinanzas(() => Response.json(null));
    await expect(actualizarReclamoSeguroAdmin(cliente, "reclamo-1", "resuelto", "aplicacion", "Cobertura confirmada", true)).resolves.toBeUndefined();
    expect(solicitudes.at(-1)).toMatchObject({
      metodo: "POST", recurso: "rpc/admin_actualiza_reclamo_seguro",
      datos: {
        p_reclamo_id: "reclamo-1", p_estado: "resuelto", p_responsable_pago: "aplicacion",
        p_notas_admin: "Cobertura confirmada", p_mantener_estado: true,
      },
    });
  });

  it("bloquea el cierre sin responsable de pago", async () => {
    const { cliente, solicitudes } = clienteFinanzas();
    await expect(actualizarReclamoSeguroAdmin(cliente, "reclamo-1", "resuelto", null, "")).rejects.toThrow("responsable de pago");
    expect(solicitudes.some(({ recurso }) => recurso === "rpc/admin_actualiza_reclamo_seguro")).toBe(false);
  });

  it("propaga el rechazo de la base de datos al asignar el pago", async () => {
    const { cliente } = clienteFinanzas(() => rechazoBd("El reclamo ya está resuelto"));
    await expect(actualizarReclamoSeguroAdmin(cliente, "reclamo-1", "resuelto", "conductor", "Dictamen"))
      .rejects.toMatchObject({ code: "42501" });
  });
});
