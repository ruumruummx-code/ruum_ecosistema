import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  clasificarRolApp: vi.fn(),
}));

vi.mock("@ruum/api/supabase/server-client", () => ({
  crearClienteServidor: vi.fn((_url: string, _key: string, _cookies: unknown) => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock("@ruum/api/identity", () => ({
  clasificarRolApp: mocks.clasificarRolApp,
}));

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

import { middleware } from "./middleware";
import { validarSesionYRolUsuario } from "./lib/guardia-rol-usuario";

const ROLES_ADMIN = ["operador", "supervisor", "finanzas", "compliance", "direccion"] as const;

describe("F1.2 — RBAC Definitivo Integración: app-usuario por Rol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-anon-test");
  });

  describe("Middleware de rutas protegidas de usuario (/inicio, /viajes, /cuenta)", () => {
    it("redirecciona a /login si no hay sesión autenticada", async () => {
      mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const req = new NextRequest("https://usuario.ruum.mx/viajes");
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login?next=%2Fviajes");
    });

    it("permite el acceso si el rol clasificado es 'usuario'", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "usr_pasajero_1" } }, error: null });
      mocks.clasificarRolApp.mockResolvedValue("usuario");

      for (const ruta of ["/inicio", "/viajes", "/mis-viajes", "/cuenta"]) {
        const req = new NextRequest(`https://usuario.ruum.mx${ruta}`);
        const res = await middleware(req);
        expect(res.status).toBe(200);
      }
    });

    it("devuelve 403 (redirección a /403?reason=rol_conductor) para rol 'conductor'", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "drv_123" } }, error: null });
      mocks.clasificarRolApp.mockResolvedValue("conductor");

      const req = new NextRequest("https://usuario.ruum.mx/viajes");
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/403?reason=rol_conductor");
    });

    it.each(ROLES_ADMIN)(
      "devuelve 403 (redirección a /403?reason=rol_admin) para admin con rol '%s'",
      async (rolAdmin) => {
        mocks.getUser.mockResolvedValue({ data: { user: { id: `adm_${rolAdmin}_123` } }, error: null });
        mocks.clasificarRolApp.mockResolvedValue("admin");

        const req = new NextRequest("https://usuario.ruum.mx/viajes");
        const res = await middleware(req);
        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("/403?reason=rol_admin");
      }
    );
  });

  describe("Route Handlers / API con helper único de rol usuario", () => {
    it("devuelve 401 si no hay sesión en Route Handlers", async () => {
      mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const resultado = await validarSesionYRolUsuario();
      expect(resultado.ok).toBe(false);
      expect(resultado.errorResponse!.status).toBe(401);
      const json = await resultado.errorResponse!.json();
      expect(json.error).toMatch(/Inicia sesión/i);
    });

    it("permite acceso a endpoints si el rol es 'usuario'", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "usr_valido" } }, error: null });
      mocks.clasificarRolApp.mockResolvedValue("usuario");
      const resultado = await validarSesionYRolUsuario();
      expect(resultado.ok).toBe(true);
      expect(resultado.user?.id).toBe("usr_valido");
    });

    it("bloquea con 403 JSON al rol 'conductor'", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "drv_intruso" } }, error: null });
      mocks.clasificarRolApp.mockResolvedValue("conductor");
      const resultado = await validarSesionYRolUsuario();
      expect(resultado.ok).toBe(false);
      expect(resultado.errorResponse!.status).toBe(403);
      const json = await resultado.errorResponse!.json();
      expect(json.error).toMatch(/Acceso denegado/i);
    });

    it.each(ROLES_ADMIN)(
      "bloquea con 403 JSON al rol admin '%s'",
      async (rolAdmin) => {
        mocks.getUser.mockResolvedValue({ data: { user: { id: `adm_${rolAdmin}` } }, error: null });
        mocks.clasificarRolApp.mockResolvedValue("admin");
        const resultado = await validarSesionYRolUsuario();
        expect(resultado.ok).toBe(false);
        expect(resultado.errorResponse!.status).toBe(403);
        const json = await resultado.errorResponse!.json();
        expect(json.error).toMatch(/Acceso denegado/i);
      }
    );
  });
});
