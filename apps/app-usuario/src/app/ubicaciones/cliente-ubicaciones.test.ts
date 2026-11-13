/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { guardarOperacionUbicacion } from "./cliente-ubicaciones";
import { libretaVacia } from "./libreta-ubicaciones";
const { headers } = vi.hoisted(() => ({ headers: vi.fn() }));
vi.mock("../../lib/csrf", () => ({ obtenerHeadersCsrfAsync: headers }));
beforeEach(() => {
  headers.mockResolvedValue({
    "Content-Type": "application/json",
    "x-csrf-token": "private-csrf",
  });
  vi.stubGlobal("fetch", vi.fn());
});
describe("Cliente privado de ubicaciones", () => {
  it("envía CSRF, cookie propia y datos al endpoint del mismo origen", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true, libreta: libretaVacia() })),
    );
    expect(
      (
        await guardarOperacionUbicacion({
          tipo: "favorita",
          id: "perfil",
          valor: true,
        })
      ).ok,
    ).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "/api/ubicaciones",
      expect.objectContaining({
        credentials: "same-origin",
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "private-csrf",
        },
      }),
    );
  });
  it.each([403, 500])("no comunica éxito con HTTP %s", async (status) => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: false }), { status }),
    );
    expect(
      (
        await guardarOperacionUbicacion({
          tipo: "favorita",
          id: "perfil",
          valor: true,
        })
      ).ok,
    ).toBe(false);
  });
  it("tolera una respuesta no JSON y la pérdida de conexión", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    expect(
      (
        await guardarOperacionUbicacion({
          tipo: "favorita",
          id: "perfil",
          valor: true,
        })
      ).ok,
    ).toBe(false);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("<html>error</html>", { status: 500 }),
    );
    expect(
      (
        await guardarOperacionUbicacion({
          tipo: "favorita",
          id: "perfil",
          valor: true,
        })
      ).ok,
    ).toBe(false);
  });
});
