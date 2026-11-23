import { describe, it, expect } from "vitest";
import { listarDisputasAdmin, listarReclamosSeguroAdmin, resolverDisputaAdmin } from "./disputas";
import { createMockSupabaseClient } from "../test-utils/mock-supabase";

describe("claims / disputas y reclamos", () => {
  it("listarDisputasAdmin: aplica rango y obtiene disputas", async () => {
    const client = createMockSupabaseClient({
      user: { id: "user-sup" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-sup", rol_operativo: "supervisor" }],
        disputas: [{ id: "disp-1", motivo: "retraso", abierta_en: "2026-11-20" }]
      },
      rpcData: { admin_tiene_permiso: true }
    });

    const disputas = await listarDisputasAdmin(client, { limite: 25, offset: 0 });
    expect(disputas).toHaveLength(1);
    expect(disputas[0].id).toBe("disp-1");
  });

  it("listarReclamosSeguroAdmin: aplica rango y obtiene reclamos", async () => {
    const client = createMockSupabaseClient({
      user: { id: "user-fin" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-fin", rol_operativo: "finanzas" }],
        reclamos_seguro: [{ id: "rec-1", monto_reclamado: 5000, abierto_en: "2026-11-20" }]
      },
      rpcData: { admin_tiene_permiso: true }
    });

    const reclamos = await listarReclamosSeguroAdmin(client, { limite: 25, offset: 0 });
    expect(reclamos).toHaveLength(1);
  });

  it("resolverDisputaAdmin: exige resolución al cerrar una disputa", async () => {
    const client = createMockSupabaseClient({
      user: { id: "user-sup" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-sup", rol_operativo: "supervisor" }]
      },
      rpcData: { admin_tiene_permiso: true }
    });

    await expect(
      resolverDisputaAdmin(client, "disp-1", "resuelta", null, "Cierre sin resolucion")
    ).rejects.toThrow("Selecciona una resolución para cerrar la disputa.");
  });
});
