import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ obtener: vi.fn(), vincular: vi.fn(),
  customer: { retrieve: vi.fn(), create: vi.fn(), update: vi.fn(), listPaymentMethods: vi.fn() },
  pm: { retrieve: vi.fn(), detach: vi.fn() }, checkout: vi.fn(), intent: vi.fn(), sesion: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({}) }));
vi.mock("@ruum/api/services", () => ({ obtenerClienteBilleteraServidor: m.obtener, vincularClienteBilleteraServidor: m.vincular }));
vi.mock("stripe", () => ({ default: class { customers = m.customer; paymentMethods = m.pm;
  checkout = { sessions: { create: m.checkout } }; paymentIntents = { retrieve: m.intent }; customerSessions = { create: m.sesion }; } }));
import { clienteBilletera, iniciarAltaTarjeta, listarTarjetasBilletera, modificarTarjetaBilletera, sesionBilleteraCheckout } from "./billetera-server";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_prueba"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "servidor-prueba");
  m.obtener.mockResolvedValue("cus_propio"); m.vincular.mockResolvedValue("cus_nuevo");
  m.customer.retrieve.mockResolvedValue({ id: "cus_propio", metadata: { ruum_auth_user_id: "auth1" }, invoice_settings: { default_payment_method: "pm_propio" } });
  m.pm.retrieve.mockResolvedValue({ id: "pm_propio", customer: "cus_propio", type: "card" });
  m.customer.update.mockResolvedValue({}); m.pm.detach.mockResolvedValue({});
});
it("solo devuelve datos enmascarados de las tarjetas del cliente verificado", async () => {
  m.customer.listPaymentMethods.mockReturnValue((async function* () { yield { id: "pm_propio", card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030, fingerprint: "privado" } }; })());
  expect(await listarTarjetasBilletera("auth1")).toEqual({ tarjetas: [{ id: "pm_propio", marca: "visa", ultimos4: "4242", mes: 12, anio: 2030, predeterminada: true }] });
  expect(m.customer.listPaymentMethods).toHaveBeenCalledWith("cus_propio", { type: "card", limit: 100 });
});
it.each(["eliminar", "predeterminar"] as const)("rechaza %s para una tarjeta ajena", async accion => {
  m.pm.retrieve.mockResolvedValue({ customer: "cus_ajeno", type: "card" });
  await expect(modificarTarjetaBilletera("auth1", "pm_ajeno", accion)).rejects.toThrow("Tarjeta no disponible");
  expect(m.customer.update).not.toHaveBeenCalled(); expect(m.pm.detach).not.toHaveBeenCalled();
});
it("predetermina en Stripe y elimina solo después de verificar la pertenencia", async () => {
  await modificarTarjetaBilletera("auth1", "pm_propio", "predeterminar");
  expect(m.customer.update).toHaveBeenCalledWith("cus_propio", { invoice_settings: { default_payment_method: "pm_propio" } });
  await modificarTarjetaBilletera("auth1", "pm_propio", "eliminar");
  expect(m.pm.detach).toHaveBeenCalledWith("pm_propio");
});
it("falla cerrado si la asociación del cliente no corresponde al usuario", async () => {
  m.customer.retrieve.mockResolvedValue({ id: "cus_propio", metadata: { ruum_auth_user_id: "otro" } });
  await expect(clienteBilletera("auth1")).rejects.toThrow("verificar");
  expect(m.customer.listPaymentMethods).not.toHaveBeenCalled();
});
it("no crea clientes al consultar una billetera vacía", async () => {
  m.obtener.mockResolvedValue(undefined);
  expect(await listarTarjetasBilletera("auth1")).toEqual({ tarjetas: [] });
  expect(m.customer.create).not.toHaveBeenCalled();
});
it("crea el cliente de forma idempotente y abre setup sin crear cobros", async () => {
  m.obtener.mockResolvedValue(undefined); m.customer.create.mockResolvedValue({ id: "cus_nuevo" });
  m.customer.retrieve.mockResolvedValue({ id: "cus_nuevo", metadata: { ruum_auth_user_id: "auth1" } });
  m.checkout.mockResolvedValue({ url: "https://checkout.stripe.com/setup" });
  await iniciarAltaTarjeta("auth1", "https://usuario.test", "clave");
  expect(m.customer.create).toHaveBeenCalledWith({ metadata: { ruum_auth_user_id: "auth1" } }, { idempotencyKey: "billetera-test-auth1" });
  expect(m.checkout).toHaveBeenCalledWith(expect.objectContaining({ mode: "setup", customer: "cus_nuevo", currency: "mxn", success_url: "https://usuario.test/cuenta/metodos-pago?registro=regreso" }), expect.anything());
});
it("no emite un secreto de sesión para un pago de otro cliente", async () => {
  m.intent.mockResolvedValue({ customer: "cus_ajeno" });
  await expect(sesionBilleteraCheckout("auth1", "pi_ajeno")).rejects.toThrow("no pertenece");
  expect(m.sesion).not.toHaveBeenCalled();
});
it("mantiene el flujo de los pagos antiguos sin cliente y habilita guardados solo para los propios", async () => {
  m.intent.mockResolvedValue({ customer: null });
  expect(await sesionBilleteraCheckout("auth1", "pi_antiguo")).toEqual({ customerSessionClientSecret: null });
  m.intent.mockResolvedValue({ customer: "cus_propio" }); m.sesion.mockResolvedValue({ client_secret: "secreto_sesion" });
  expect(await sesionBilleteraCheckout("auth1", "pi_propio")).toEqual({ customerSessionClientSecret: "secreto_sesion" });
});
it("no oculta errores de Stripe al modificar una tarjeta", async () => {
  m.pm.detach.mockRejectedValue(new Error("fallo"));
  await expect(modificarTarjetaBilletera("auth1", "pm_propio", "eliminar")).rejects.toThrow("fallo");
});
