import { describe, expect, it } from "vitest";
import { resolverDisputaAdmin } from "@ruum/api/services";
import { clienteFinanzas, rechazoBd } from "../../test-utils/supabase-finanzas";

describe("panel-admin / disputas", () => {
  it("envía la resolución parcial de una disputa por cobro", async () => {
    const { cliente, solicitudes } = clienteFinanzas(() => Response.json(null));
    await expect(resolverDisputaAdmin(cliente, "disputa-1", "resuelta", "solucion_parcial", "Ajuste validado", true)).resolves.toBeUndefined();
    expect(solicitudes.at(-1)).toMatchObject({
      metodo: "POST", recurso: "rpc/admin_resuelve_disputa",
      datos: {
        p_disputa_id: "disputa-1", p_estado: "resuelta", p_resolucion: "solucion_parcial",
        p_detalle: "Ajuste validado", p_mantener_estado: true,
      },
    });
  });

  it("rechaza cerrar una disputa sin resolución", async () => {
    const { cliente, solicitudes } = clienteFinanzas();
    await expect(resolverDisputaAdmin(cliente, "disputa-1", "resuelta_senior", null, "")).rejects.toThrow("Selecciona una resolución");
    expect(solicitudes.some(({ recurso }) => recurso === "rpc/admin_resuelve_disputa")).toBe(false);
  });

  it("propaga una resolución rechazada por la base de datos", async () => {
    const { cliente } = clienteFinanzas(() => rechazoBd("Resolución fuera del alcance del administrador"));
    await expect(resolverDisputaAdmin(cliente, "disputa-1", "resuelta", "favor_reclamante", "Cobro improcedente"))
      .rejects.toMatchObject({ code: "42501" });
  });
});
