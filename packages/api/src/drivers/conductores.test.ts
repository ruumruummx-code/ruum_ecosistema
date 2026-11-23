import { describe, it, expect } from "vitest";
import { listarConductoresAdmin, validarDocumentoConductor } from "./conductores";
import { createMockSupabaseClient } from "../test-utils/mock-supabase";

describe("drivers / conductores", () => {
  it("listarConductoresAdmin: consulta lista acotada con range", async () => {
    const mockConductores = [
      { id: "c-1", nombre: "Conductor 1", creado_en: "2026-11-20" },
      { id: "c-2", nombre: "Conductor 2", creado_en: "2026-11-19" }
    ];
    const client = createMockSupabaseClient({
      user: { id: "user-sup" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-sup", rol_operativo: "supervisor" }],
        conductores: mockConductores
      },
      rpcData: { admin_tiene_permiso: true }
    });

    const conductores = await listarConductoresAdmin(client, { limite: 10, offset: 0 });
    expect(conductores).toHaveLength(2);
  });

  it("validarDocumentoConductor: ejecuta RPC admin_actualiza_conductor_documentos", async () => {
    let rpcEjecutada = false;
    const client = createMockSupabaseClient({
      user: { id: "user-sup" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-sup", rol_operativo: "supervisor" }]
      },
      rpcData: { admin_tiene_permiso: true }
    });
    client.rpc = (async (fn: string, args: any) => {
      if (fn === "admin_tiene_permiso") return { data: true, error: null };
      if (fn === "admin_actualiza_conductor_documentos") {
        rpcEjecutada = true;
        expect(args.p_conductor_id).toBe("c-123");
        expect(args.p_aprobado).toBe(true);
        return { data: null, error: null };
      }
      return { data: null, error: null };
    }) as any;

    await validarDocumentoConductor(client, "c-123", true);
    expect(rpcEjecutada).toBe(true);
  });
});
