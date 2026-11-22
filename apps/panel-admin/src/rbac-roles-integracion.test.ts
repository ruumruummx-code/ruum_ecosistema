import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  obtenerAdminSesion: vi.fn(),
  verificarPermisoRuta: vi.fn(),
  registrarAccesoDenegado: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@ruum/api/supabase/server-client", () => ({
  crearClienteServidor: vi.fn((_url: string, _key: string, _cookies: unknown) => ({
    auth: {
      getUser: mocks.getUser,
      signOut: mocks.signOut,
    },
  })),
}));

vi.mock("@ruum/api/operations", () => ({
  obtenerAdminSesion: mocks.obtenerAdminSesion,
  verificarPermisoRuta: mocks.verificarPermisoRuta,
  registrarAccesoDenegado: mocks.registrarAccesoDenegado,
}));

import { middleware } from "./middleware";

describe("F1.2 — RBAC Definitivo Integración: panel-admin por Rol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-anon-test");
    mocks.verificarPermisoRuta.mockResolvedValue(true);
    mocks.registrarAccesoDenegado.mockResolvedValue(undefined);
  });

  describe("Peticiones no autenticadas", () => {
    it("devuelve 401 JSON en endpoints /api/*", async () => {
      mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const req = new NextRequest("https://admin.ruum.mx/api/auditoria");
      const res = await middleware(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/No autenticado/i);
    });

    it("redirecciona a /login en rutas UI", async () => {
      mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const req = new NextRequest("https://admin.ruum.mx/viajes");
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });
  });

  describe("Usuarios no admin (usuario o conductor con JWT válido)", () => {
    beforeEach(() => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "usr_no_admin" } }, error: null });
      mocks.obtenerAdminSesion.mockResolvedValue(null);
    });

    it("devuelve 403 JSON en endpoints /api/*", async () => {
      const req = new NextRequest("https://admin.ruum.mx/api/auditoria");
      const res = await middleware(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/no es administrador/i);
    });

    it("redirecciona a /login?error=no_autorizado en rutas UI", async () => {
      const req = new NextRequest("https://admin.ruum.mx/viajes");
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login?error=no_autorizado");
    });
  });

  describe("Los 5 roles administrativos en endpoints /api/* y UI", () => {
    it("rol 'direccion' tiene acceso irrestricto", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "adm_dir" } }, error: null });
      mocks.obtenerAdminSesion.mockResolvedValue({ id: "adm_dir", rol_operativo: "direccion" });

      const reqApi = new NextRequest("https://admin.ruum.mx/api/admin-auth/invitar-admin", { method: "POST" });
      const resApi = await middleware(reqApi);
      expect(resApi.status).toBe(200);

      const reqUi = new NextRequest("https://admin.ruum.mx/capacidades");
      const resUi = await middleware(reqUi);
      expect(resUi.status).toBe(200);
    });

    it("rol 'operador' puede ver /viajes pero es bloqueado de /api/auditoria con 403 JSON", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "adm_op" } }, error: null });
      mocks.obtenerAdminSesion.mockResolvedValue({ id: "adm_op", rol_operativo: "operador" });

      const reqPermitido = new NextRequest("https://admin.ruum.mx/viajes");
      const resPermitido = await middleware(reqPermitido);
      expect(resPermitido.status).toBe(200);

      const reqApiBloqueado = new NextRequest("https://admin.ruum.mx/api/auditoria");
      const resApiBloqueado = await middleware(reqApiBloqueado);
      expect(resApiBloqueado.status).toBe(403);
      const json = await resApiBloqueado.json();
      expect(json.error).toMatch(/Acceso denegado/i);

      const reqUiBloqueado = new NextRequest("https://admin.ruum.mx/capacidades");
      const resUiBloqueado = await middleware(reqUiBloqueado);
      expect(resUiBloqueado.status).toBe(307);
      expect(resUiBloqueado.headers.get("location")).toContain("/sin-permiso?ruta=%2Fcapacidades");
    });

    it("rol 'supervisor' puede acceder a /api/auditoria pero es bloqueado de /api/admin-auth/invitar-admin", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "adm_sup" } }, error: null });
      mocks.obtenerAdminSesion.mockResolvedValue({ id: "adm_sup", rol_operativo: "supervisor" });

      const reqPermitido = new NextRequest("https://admin.ruum.mx/api/auditoria");
      const resPermitido = await middleware(reqPermitido);
      expect(resPermitido.status).toBe(200);

      const reqBloqueado = new NextRequest("https://admin.ruum.mx/api/admin-auth/invitar-admin", { method: "POST" });
      const resBloqueado = await middleware(reqBloqueado);
      expect(resBloqueado.status).toBe(403);
    });

    it("rol 'finanzas' accede a /api/exportaciones/pagos y es bloqueado de /api/auditoria", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "adm_fin" } }, error: null });
      mocks.obtenerAdminSesion.mockResolvedValue({ id: "adm_fin", rol_operativo: "finanzas" });

      const reqPermitido = new NextRequest("https://admin.ruum.mx/api/exportaciones/pagos");
      const resPermitido = await middleware(reqPermitido);
      expect(resPermitido.status).toBe(200);

      const reqBloqueado = new NextRequest("https://admin.ruum.mx/api/auditoria");
      const resBloqueado = await middleware(reqBloqueado);
      expect(resBloqueado.status).toBe(403);
    });

    it("rol 'compliance' accede a /api/auditoria y es bloqueado de /api/exportaciones/pagos", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "adm_comp" } }, error: null });
      mocks.obtenerAdminSesion.mockResolvedValue({ id: "adm_comp", rol_operativo: "compliance" });

      const reqPermitido = new NextRequest("https://admin.ruum.mx/api/auditoria");
      const resPermitido = await middleware(reqPermitido);
      expect(resPermitido.status).toBe(200);

      const reqBloqueado = new NextRequest("https://admin.ruum.mx/api/exportaciones/pagos");
      const resBloqueado = await middleware(reqBloqueado);
      expect(resBloqueado.status).toBe(403);
    });
  });
});
