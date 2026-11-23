import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  clasificarRolApp: vi.fn(),
}));

vi.mock("@ruum/api/identity", () => ({
  clasificarRolApp: mocks.clasificarRolApp,
}));

import { validarSesionYRolUsuario, exigirRolUsuario } from "./guardia-rol-usuario";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

describe("F1.2 — Guardia de Rol de Usuario (app-usuario)", () => {
  const clienteMock = {
    auth: {
      getUser: mocks.getUser,
    },
  } as unknown as SupabaseClient<Database>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 401 si no hay usuario autenticado", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const resultado = await validarSesionYRolUsuario(clienteMock);
    expect(resultado.ok).toBe(false);
    expect(resultado.errorResponse?.status).toBe(401);
    const body = await resultado.errorResponse?.json();
    expect(body.error).toMatch(/Inicia sesión/i);
  });

  it("permite el acceso si el rol es 'usuario'", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: { id: "usr_123" } }, error: null });
    mocks.clasificarRolApp.mockResolvedValueOnce("usuario");

    const resultado = await validarSesionYRolUsuario(clienteMock);
    expect(resultado.ok).toBe(true);
    expect(resultado.user?.id).toBe("usr_123");
    expect(resultado.errorResponse).toBeNull();
  });

  it.each(["conductor", "admin", "ninguno"] as const)(
    "devuelve 403 si el rol clasificado es '%s'",
    async (rol) => {
      mocks.getUser.mockResolvedValueOnce({ data: { user: { id: `usr_${rol}` } }, error: null });
      mocks.clasificarRolApp.mockResolvedValueOnce(rol);

      const resultado = await validarSesionYRolUsuario(clienteMock);
      expect(resultado.ok).toBe(false);
      expect(resultado.errorResponse?.status).toBe(403);
      const body = await resultado.errorResponse?.json();
      expect(body.error).toMatch(/Acceso denegado/i);
    }
  );

  it("exigirRolUsuario devuelve 403 si el rol no es usuario", async () => {
    mocks.clasificarRolApp.mockResolvedValueOnce("conductor");
    const denegadoConductor = await exigirRolUsuario(clienteMock, "usr_conductor");
    expect(denegadoConductor?.status).toBe(403);

    mocks.clasificarRolApp.mockResolvedValueOnce("admin");
    const denegadoAdmin = await exigirRolUsuario(clienteMock, "usr_admin");
    expect(denegadoAdmin?.status).toBe(403);

    mocks.clasificarRolApp.mockResolvedValueOnce("usuario");
    const permitido = await exigirRolUsuario(clienteMock, "usr_valido");
    expect(permitido).toBeNull();
  });
});
