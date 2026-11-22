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

describe("RUUM-SEC-010 (F1.2) — Transición de allowlist temporal a RBAC definitivo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-anon-test");
  });

  it("el middleware ya no mantiene lista fija de endpoints sensibles sino que delega en route handlers y protege UI", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "usr_pasajero_1" } },
      error: null,
    });
    mocks.clasificarRolApp.mockResolvedValue("usuario");

    const req = new NextRequest("https://usuario.ruum.mx/viajes");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-nonce")).toBeTruthy();
  });

  it("un conductor o admin intentando acceder a ruta protegida de usuario es desviado a /403", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "usr_intruso" } },
      error: null,
    });

    mocks.clasificarRolApp.mockResolvedValueOnce("conductor");
    const reqConductor = new NextRequest("https://usuario.ruum.mx/cuenta");
    const resConductor = await middleware(reqConductor);
    expect(resConductor.status).toBe(307);
    expect(resConductor.headers.get("location")).toContain("/403?reason=rol_conductor");

    mocks.clasificarRolApp.mockResolvedValueOnce("admin");
    const reqAdmin = new NextRequest("https://usuario.ruum.mx/cuenta");
    const resAdmin = await middleware(reqAdmin);
    expect(resAdmin.status).toBe(307);
    expect(resAdmin.headers.get("location")).toContain("/403?reason=rol_admin");
  });

  it("la validación de endpoints sensibles se ejecuta por el helper único validarSesionYRolUsuario", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "usr_conductor_o_admin" } },
      error: null,
    });
    mocks.clasificarRolApp.mockResolvedValueOnce("conductor");

    const res = await validarSesionYRolUsuario();
    expect(res.ok).toBe(false);
    expect(res.errorResponse.status).toBe(403);
    const body = await res.errorResponse.json();
    expect(body.error).toMatch(/Acceso denegado/i);
  });
});
