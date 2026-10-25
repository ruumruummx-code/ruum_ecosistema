import { describe, expect, it } from "vitest";
import * as identity from "./index";
import * as admin from "../services/admin";
import { crearClienteFake } from "../services/__tests__/supabase-fake";

const ESPERADAS = [
  "obtenerAdminActual",
  "obtenerUsuarioAdmin",
  "actualizarUsuarioAdmin",
  "invitarUsuarioAdmin",
  "listarUsuariosAdmin",
  "listarUsuariosAdminPaginados",
  "listarSesionesUsuario",
  "revocarSesionUsuario",
  "listarPagosDeUsuario",
  "listarIncidenciasDeUsuario",
  "listarEmpresasDeUsuario"
];

describe("contrato módulo identity (Fase 6)", () => {
  it("expone su superficie", () => {
    for (const nombre of ESPERADAS) {
      expect((identity as Record<string, unknown>)[nombre], nombre).toBeDefined();
    }
  });

  it("el facade re-exporta la misma referencia", () => {
    const registroAdmin = admin as unknown as Record<string, unknown>;
    const registroMod = identity as unknown as Record<string, unknown>;
    for (const nombre of ESPERADAS) {
      expect(registroAdmin[nombre], nombre).toBe(registroMod[nombre]);
    }
  });

  it("genera URL firmada solo con permiso de lectura administrativa", async () => {
    const cliente = crearClienteFake({
      tablas: { admins: { data: { id: "admin-1", rol_operativo: "compliance" } } },
      rpcs: { admin_tiene_permiso: { data: true } }
    });

    const url = await identity.obtenerUrlDocumentoIdentidadUsuario(
      cliente as never,
      "usuario-1/identificacion.jpg"
    );

    expect(url).toContain("/documentos-identidad/usuario-1/identificacion.jpg");
    expect(cliente.llamadas).toContainEqual({
      table: "storage:documentos-identidad",
      action: "createSignedUrl",
      args: ["usuario-1/identificacion.jpg", 1800]
    });
  });
});
