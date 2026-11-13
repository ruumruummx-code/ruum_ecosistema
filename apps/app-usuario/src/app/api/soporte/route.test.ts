import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ auth: vi.fn(), crear: vi.fn(), limite: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({ crearClienteServidor: async () => ({ auth: { getUser: m.auth } }) }));
vi.mock("@ruum/api/services", () => ({ crearTicketSoporte: m.crear }));
vi.mock("@/lib/csp-rate-limit", () => ({ rateLimitConVentana: m.limite }));
import { POST } from "./route";
const datos = { id: "94800000-0000-4000-8000-000000000001", trasladoId: null, motivo: "Consulta general", descripcion: "Necesito ayuda con la plataforma." };
function pedir(body: unknown = datos, csrf = true) {
  return new NextRequest("https://usuario.test/api/soporte", { method: "POST", headers: { origin: "https://usuario.test", cookie: `ruum_csrf_token=${"a".repeat(64)}`, ...(csrf ? { "x-csrf-token": "a".repeat(64) } : {}) }, body: JSON.stringify(body) });
}
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ data: { user: { id: "auth1" } } }); m.limite.mockResolvedValue({ allowed: true }); m.crear.mockResolvedValue({ id: datos.id }); });
it("persiste una consulta sin traslado y devuelve el folio confirmado", async () => {
  const respuesta = await POST(pedir());
  expect(respuesta.status).toBe(200); expect(await respuesta.json()).toEqual({ id: datos.id });
  expect(m.crear).toHaveBeenCalledWith(expect.anything(), datos);
});
it("exige sesión, CSRF y límites de uso", async () => {
  expect((await POST(pedir(datos, false))).status).toBe(403);
  m.auth.mockResolvedValueOnce({ data: { user: null } });
  expect((await POST(pedir())).status).toBe(401);
  m.limite.mockResolvedValueOnce({ allowed: false });
  expect((await POST(pedir())).status).toBe(429);
  expect(m.crear).not.toHaveBeenCalled();
});
it("no permite inyectar autor, estado ni descripciones inválidas", async () => {
  for (const entrada of [{ ...datos, auth_user_id: "otro" }, { ...datos, estado: "resuelto" }, { ...datos, descripcion: "corta" }]) expect((await POST(pedir(entrada))).status).toBe(400);
  expect(m.crear).not.toHaveBeenCalled();
});
it("un fallo de persistencia nunca devuelve un folio ni éxito", async () => {
  m.crear.mockRejectedValue(new Error("privado"));
  const respuesta = await POST(pedir());
  expect(respuesta.status).toBe(503); expect(await respuesta.text()).not.toContain("privado");
});
