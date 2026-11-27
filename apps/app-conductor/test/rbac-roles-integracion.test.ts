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
  registrarFalloVerificacionRol: vi.fn(),
}));

import { middleware } from "../src/middleware";

const ROLES_ADMIN = ["operador", "supervisor", "finanzas", "compliance", "direccion"] as const;

describe("F1.2 — RBAC Definitivo Integración: app-conductor por Rol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-anon-test");
  });

  describe("Peticiones no autenticadas", () => {
    it.each(["/", "/?code=confirmacion-de-prueba&type=signup"])(
      "deja la entrada %s a cargo de su página pública",
      async (ruta) => {
        const req = new NextRequest(`https://conductor.ruum.mx${ruta}`);
        const res = await middleware(req);

        expect(res.headers.get("x-middleware-next")).toBe("1");
        expect(mocks.getUser).not.toHaveBeenCalled();
      }
    );

    it("devuelve 401 JSON en endpoints /api/* protegidos", async () => {
      mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const req = new NextRequest("https://conductor.ruum.mx/api/perfil/documentos");
      const res = await middleware(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/No autorizado/i);
    });

    it("redirecciona a /login en rutas protegidas UI (/panel)", async () => {
      mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const req = new NextRequest("https://conductor.ruum.mx/panel");
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login?next=%2Fpanel");
    });
  });

  describe("Rol conductor", () => {
    it("permite el acceso a rutas protegidas", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "drv_valido" } }, error: null });
      mocks.clasificarRolApp.mockResolvedValue("conductor");

      const req = new NextRequest("https://conductor.ruum.mx/panel");
      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("x-nonce")).toBeTruthy();
    });
  });

  describe("Rol usuario (pasajero)", () => {
    beforeEach(() => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "usr_pasajero" } }, error: null });
      mocks.clasificarRolApp.mockResolvedValue("usuario");
    });

    it("devuelve 403 JSON en endpoints /api/*", async () => {
      const req = new NextRequest("https://conductor.ruum.mx/api/traslados/activos");
      const res = await middleware(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/cuenta no autorizada para operar en la app de conductores/i);
    });

    it("redirecciona a /403?reason=rol_usuario en rutas UI", async () => {
      const req = new NextRequest("https://conductor.ruum.mx/panel");
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/403?reason=rol_usuario");
    });
  });

  describe("Los 5 roles administrativos puro (admin)", () => {
    it.each(ROLES_ADMIN)(
      "admin con rol '%s' recibe 403 JSON en /api/* y 403 redirect en UI",
      async (rolAdmin) => {
        mocks.getUser.mockResolvedValue({ data: { user: { id: `adm_${rolAdmin}` } }, error: null });
        mocks.clasificarRolApp.mockResolvedValue("admin");

        const reqApi = new NextRequest("https://conductor.ruum.mx/api/traslados/activos");
        const resApi = await middleware(reqApi);
        expect(resApi.status).toBe(403);
        const json = await resApi.json();
        expect(json.error).toMatch(/cuenta no autorizada para operar en la app de conductores/i);

        const reqUi = new NextRequest("https://conductor.ruum.mx/panel");
        const resUi = await middleware(reqUi);
        expect(resUi.status).toBe(307);
        expect(resUi.headers.get("location")).toContain("/403?reason=rol_admin");
      }
    );
  });
});
