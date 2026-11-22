import { describe, it, expect } from "vitest";
import { listarTrasladosAdmin, listarTrasladosAdminPaginados } from "./viajes";
import { createMockSupabaseClient } from "../test-utils/mock-supabase";

describe("transfers / viajes", () => {
  it("listarTrasladosAdmin: aplica límite y range correctamente", async () => {
    const mockPasaportes = [
      { traslado_id: "t-1", estado: "en_curso", creado_en: "2026-11-20" },
      { traslado_id: "t-2", estado: "completado", creado_en: "2026-11-19" }
    ];
    const client = createMockSupabaseClient({
      user: { id: "user-op" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-op", rol_operativo: "operador" }],
        pasaporte_digital: mockPasaportes
      },
      rpcData: { admin_tiene_permiso: true }
    });

    const traslados = await listarTrasladosAdmin(client, "todos", { limite: 10, offset: 0 });
    expect(traslados).toHaveLength(2);
  });

  it("listarTrasladosAdminPaginados: procesa respuesta de RPC paginada", async () => {
    const mockPaginacion = {
      data: [{ traslado_id: "t-10", estado: "creado" }],
      paginacion: { pagina: 1, tamano: 25, total: 1, total_paginas: 1 }
    };

    const client = createMockSupabaseClient({
      user: { id: "user-sup" },
      tableData: {
        admins: [{ id: "adm-1", auth_user_id: "user-sup", rol_operativo: "supervisor" }]
      },
      rpcData: {
        admin_tiene_permiso: true,
        listar_Traslados_admin_paginados: mockPaginacion
      }
    });

    const resultado = await listarTrasladosAdminPaginados(client, 1, 25, "todos");
    expect(resultado.data).toHaveLength(1);
    expect(resultado.paginacion.total).toBe(1);
  });
});
