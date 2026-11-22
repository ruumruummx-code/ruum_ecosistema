import { describe, it, expect } from "vitest";
import { listarEmpresasAdmin } from "./empresas";
import { createMockSupabaseClient } from "../test-utils/mock-supabase";

describe("organizations / empresas", () => {
  it("listarEmpresasAdmin: aplica rango acotado en las 9 consultas concurrentes", async () => {
    const client = createMockSupabaseClient({
      user: { id: "user-comp" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-comp", rol_operativo: "compliance" }],
        empresas: [{ id: "emp-1", nombre_comercial: "Empresa 1", creado_en: "2026-11-20" }],
        usuarios: [{ id: "u-1", rol: "titular_empresa", creado_en: "2026-11-20" }],
        traslados: [{ id: "t-1", creado_en: "2026-11-20" }],
        vehiculos: [{ id: "v-1", creado_en: "2026-11-20" }],
        conductores: [{ id: "c-1", creado_en: "2026-11-20" }],
        empresas_documentos: [{ id: "ed-1", creado_en: "2026-11-20" }],
        empresas_datos_fiscales_versiones: [{ id: "df-1", version: 1 }],
        empresas_condiciones_comerciales_versiones: [{ id: "cc-1", version: 1 }],
        empresas_cambios_sensibles: [{ id: "cs-1", solicitado_en: "2026-11-20" }]
      },
      rpcData: { admin_tiene_permiso: true }
    });

    const datos = await listarEmpresasAdmin(client, { limite: 25, offset: 0 });

    expect(datos.empresas).toHaveLength(1);
    expect(datos.usuarios).toHaveLength(1);
    expect(datos.traslados).toHaveLength(1);
    expect(datos.vehiculos).toHaveLength(1);
    expect(datos.conductores).toHaveLength(1);
    expect(datos.documentos).toHaveLength(1);
    expect(datos.versionesFiscales).toHaveLength(1);
    expect(datos.versionesCondiciones).toHaveLength(1);
    expect(datos.cambiosSensibles).toHaveLength(1);
  });
});
