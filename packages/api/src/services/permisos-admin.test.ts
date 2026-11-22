import { describe, it, expect, vi } from "vitest";
import {
  rolAdminTienePermiso,
  assertAdminPermission,
  assertAdminAnyPermission,
  tienePermisoAdmin,
  AdminAuthorizationError
} from "./permisos-admin";
import { createMockSupabaseClient } from "../test-utils/mock-supabase";

describe("permisos-admin", () => {
  describe("rolAdminTienePermiso", () => {
    it("valida permisos correctos para operador", () => {
      expect(rolAdminTienePermiso("operador", "Traslados:leer")).toBe(true);
      expect(rolAdminTienePermiso("operador", "incidencias:leer")).toBe(true);
      expect(rolAdminTienePermiso("operador", "pagos:leer")).toBe(false);
      expect(rolAdminTienePermiso("operador", "auditoria:leer")).toBe(false);
    });

    it("valida permisos correctos para supervisor", () => {
      expect(rolAdminTienePermiso("supervisor", "conductores:validar")).toBe(true);
      expect(rolAdminTienePermiso("supervisor", "disputas:resolver")).toBe(true);
      expect(rolAdminTienePermiso("supervisor", "pagos:ejecutar")).toBe(false);
    });

    it("valida permisos correctos para finanzas", () => {
      expect(rolAdminTienePermiso("finanzas", "pagos:leer")).toBe(true);
      expect(rolAdminTienePermiso("finanzas", "pagos:exportar")).toBe(true);
      expect(rolAdminTienePermiso("finanzas", "pagos:ejecutar")).toBe(true);
      expect(rolAdminTienePermiso("finanzas", "conductores:validar")).toBe(false);
    });

    it("valida permisos correctos para compliance", () => {
      expect(rolAdminTienePermiso("compliance", "conductores:validar")).toBe(true);
      expect(rolAdminTienePermiso("compliance", "auditoria:leer")).toBe(true);
      expect(rolAdminTienePermiso("compliance", "pagos:ejecutar")).toBe(false);
    });

    it("direccion tiene todos los permisos operativos", () => {
      expect(rolAdminTienePermiso("direccion", "capacidades:administrar")).toBe(true);
      expect(rolAdminTienePermiso("direccion", "pagos:ejecutar")).toBe(true);
      expect(rolAdminTienePermiso("direccion", "Traslados:gestionar")).toBe(true);
    });
  });

  describe("assertAdminPermission", () => {
    it("falla si no hay sesión autenticada", async () => {
      const client = createMockSupabaseClient({ user: null });
      await expect(assertAdminPermission(client, "pagos:leer")).rejects.toThrow(
        "No hay una sesión administrativa válida."
      );
    });

    it("falla con AdminAuthorizationError si la RPC admin_tiene_permiso devuelve false", async () => {
      const client = createMockSupabaseClient({
        user: { id: "user-1" },
        tableData: {
          admins: [{ id: "adm-1", auth_user_id: "user-1", rol_operativo: "operador" }]
        },
        rpcData: {
          admin_tiene_permiso: false
        }
      });

      await expect(assertAdminPermission(client, "pagos:leer")).rejects.toThrow(AdminAuthorizationError);
    });

    it("permite el acceso si la RPC admin_tiene_permiso devuelve true", async () => {
      const client = createMockSupabaseClient({
        user: { id: "user-finanzas" },
        tableData: {
          admins: [{ id: "adm-fin", auth_user_id: "user-finanzas", rol_operativo: "finanzas" }]
        },
        rpcData: {
          admin_tiene_permiso: true
        }
      });

      const admin = await assertAdminPermission(client, "pagos:leer");
      expect(admin).not.toBeNull();
      expect(admin?.rol_operativo).toBe("finanzas");
    });
  });

  describe("assertAdminAnyPermission", () => {
    it("falla si la lista de permisos está vacía", async () => {
      const client = createMockSupabaseClient();
      await expect(assertAdminAnyPermission(client, [])).rejects.toThrow(
        "No se indicó ningún permiso administrativo."
      );
    });

    it("concede acceso si al menos un permiso es válido", async () => {
      const client = createMockSupabaseClient({
        user: { id: "user-op" },
        tableData: {
          admins: [{ id: "adm-op", auth_user_id: "user-op", rol_operativo: "operador" }]
        },
        rpcData: {
          admin_tiene_permiso: true
        }
      });

      const admin = await assertAdminAnyPermission(client, ["pagos:leer", "Traslados:leer"]);
      expect(admin).not.toBeNull();
    });
  });

  describe("tienePermisoAdmin", () => {
    it("devuelve booleano según resultado de RPC", async () => {
      const clientTrue = createMockSupabaseClient({
        rpcData: { admin_tiene_permiso: true }
      });
      expect(await tienePermisoAdmin(clientTrue, "dashboard:leer")).toBe(true);

      const clientFalse = createMockSupabaseClient({
        rpcData: { admin_tiene_permiso: false }
      });
      expect(await tienePermisoAdmin(clientFalse, "pagos:ejecutar")).toBe(false);
    });
  });
});
