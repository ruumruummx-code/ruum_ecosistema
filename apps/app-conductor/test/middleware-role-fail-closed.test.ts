import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  clasificarRolApp: vi.fn(),
  registrarFalloVerificacionRol: vi.fn(),
}));

vi.mock("@ruum/api/supabase", () => ({
  crearClienteServidor: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-1" } }, error: null }) },
  }),
}));
vi.mock("@ruum/api/identity", () => ({
  clasificarRolApp: mocks.clasificarRolApp,
  registrarFalloVerificacionRol: mocks.registrarFalloVerificacionRol,
}));

import { middleware } from "../src/middleware";

describe("middleware de rol de app-conductor", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("deniega con 503 y emite la métrica después de tres fallos de verificación", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-test-key");
    vi.stubEnv("RUUM_ROLE_COOKIE_SECRET", "");
    mocks.clasificarRolApp.mockRejectedValue(new Error("database unavailable"));
    mocks.registrarFalloVerificacionRol.mockResolvedValue(undefined);
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await middleware(new NextRequest("https://conductor.test/panel"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "No se pudo verificar el rol. Inténtalo de nuevo." });
    expect(mocks.clasificarRolApp).toHaveBeenCalledTimes(3);
    expect(mocks.registrarFalloVerificacionRol).toHaveBeenCalledWith(expect.anything(), {
      pathname: "/panel",
      motivo: "Error",
      ambito: "app-conductor",
    });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"event":"conductor_role_verification_failed"'));
  });
});
