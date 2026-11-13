import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  obtenerUsuarioActual: vi.fn(),
  listarResumen: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({ crearClienteServidor: async () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@ruum/api/services", () => ({ obtenerUsuarioActual: mocks.obtenerUsuarioActual, listarResumenTrasladosDeUsuario: mocks.listarResumen }));
vi.mock("@/lib/csp-rate-limit", () => ({ rateLimitConVentana: mocks.rateLimit }));

import { GET } from "./route";

describe("GET /api/traslados/resumen", () => {
  beforeEach(() => vi.clearAllMocks());
  it("devuelve sólo el resumen paginado del perfil autenticado", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-1" } } });
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.obtenerUsuarioActual.mockResolvedValue({ id: "perfil-1" });
    mocks.listarResumen.mockResolvedValue([{ traslado_id: "t1" }]);

    const res = await GET(new NextRequest("http://localhost/api/traslados/resumen?limite=1&desplazamiento=2"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ paginacion: { limite: 1, desplazamiento: 2, hayMas: true } });
    expect(mocks.listarResumen).toHaveBeenCalledWith(expect.anything(), "perfil-1", { limite: 1, desplazamiento: 2 });
  });

  it("rechaza una sesión sin perfil sin escribir", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-2" } } });
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.obtenerUsuarioActual.mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/traslados/resumen"));
    expect(res.status).toBe(409);
    expect(mocks.listarResumen).not.toHaveBeenCalled();
  });
});
