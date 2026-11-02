import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ auth: vi.fn(), listar: vi.fn(), modificar: vi.fn(), agregar: vi.fn(), sesion: vi.fn(), limite: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({ crearClienteServidor: async () => ({ auth: { getUser: m.auth } }) }));
vi.mock("@/lib/billetera-server", () => ({ listarTarjetasBilletera: m.listar, modificarTarjetaBilletera: m.modificar, iniciarAltaTarjeta: m.agregar, sesionBilleteraCheckout: m.sesion }));
vi.mock("@/lib/csp-rate-limit", () => ({ rateLimitConVentana: m.limite }));
import { GET, POST } from "./route";
const url = "https://usuario.test/api/cuenta/metodos-pago";
function peticion(body: unknown, csrf = true) {
  return new NextRequest(url, { method: "POST", headers: { origin: "https://usuario.test", cookie: `ruum_csrf_token=${"a".repeat(64)}`, ...(csrf ? { "x-csrf-token": "a".repeat(64) } : {}) }, body: JSON.stringify(body) });
}
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ data: { user: { id: "auth1" } }, error: null }); m.limite.mockResolvedValue({ allowed: true }); m.listar.mockResolvedValue({ tarjetas: [] }); m.modificar.mockResolvedValue(undefined); });
it("exige sesión y nunca acepta el cliente Stripe del navegador", async () => {
  m.auth.mockResolvedValue({ data: { user: null }, error: null });
  expect((await GET(new NextRequest(url))).status).toBe(401);
  expect(m.listar).not.toHaveBeenCalled();
});
it("protege mutaciones con CSRF", async () => {
  expect((await POST(peticion({ accion: "eliminar", id: "pm_valido" }, false))).status).toBe(403);
  expect(m.modificar).not.toHaveBeenCalled();
});
it("rechaza un customer inyectado e identificadores inválidos", async () => {
  for (const body of [{ accion: "eliminar", id: "pm_valido", customer: "cus_ajeno" }, { accion: "eliminar", id: "../otro" }]) expect((await POST(peticion(body))).status).toBe(400);
  expect(m.modificar).not.toHaveBeenCalled();
});
it("usa exclusivamente la identidad autenticada y evita caché", async () => {
  const res = await GET(new NextRequest(url));
  expect(res.headers.get("Cache-Control")).toBe("no-store");
  expect(m.listar).toHaveBeenCalledWith("auth1");
  expect((await POST(peticion({ accion: "predeterminar", id: "pm_valido" }))).status).toBe(200);
  expect(m.modificar).toHaveBeenCalledWith("auth1", "pm_valido", "predeterminar");
});
it("limita operaciones y no expone errores de proveedores", async () => {
  m.limite.mockResolvedValueOnce({ allowed: false });
  expect((await GET(new NextRequest(url))).status).toBe(429);
  m.modificar.mockRejectedValue(new Error("dato privado"));
  const res = await POST(peticion({ accion: "eliminar", id: "pm_valido" }));
  expect(res.status).toBe(503); expect(await res.text()).not.toContain("dato privado");
});
it("inicia el alta en Stripe sin aceptar URLs de retorno del navegador", async () => {
  m.agregar.mockResolvedValue({ url: "https://checkout.stripe.com/prueba" });
  const res = await POST(peticion({ accion: "agregar", clave: "92200000-0000-4000-8000-000000000001" }));
  expect(res.status).toBe(200);
  expect(m.agregar).toHaveBeenCalledWith("auth1", "https://usuario.test", "92200000-0000-4000-8000-000000000001");
});
