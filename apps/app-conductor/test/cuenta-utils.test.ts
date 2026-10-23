import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  obtenerConductorActual: vi.fn(),
  obtenerUrlFotoPerfilConductor: vi.fn(),
  tieneSupabaseConfigurado: vi.fn(),
}));

vi.mock("../src/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({ auth: { getUser: mocks.getUser } }),
  tieneSupabaseConfigurado: mocks.tieneSupabaseConfigurado,
}));

vi.mock("@ruum/api/services", () => ({
  obtenerConductorActual: mocks.obtenerConductorActual,
  obtenerUrlFotoPerfilConductor: mocks.obtenerUrlFotoPerfilConductor,
}));

import { cargarConductorCuenta, fechaCuenta, telefonoE164 } from "../src/app/cuenta/cuenta-utils";

describe("utilidades de cuenta del conductor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tieneSupabaseConfigurado.mockReturnValue(true);
  });

  it("no intenta cargar la cuenta cuando Supabase no está configurado", async () => {
    mocks.tieneSupabaseConfigurado.mockReturnValue(false);
    await expect(cargarConductorCuenta()).resolves.toBeNull();
    expect(mocks.obtenerConductorActual).not.toHaveBeenCalled();
  });

  it("retorna null cuando no existe un conductor asociado a la sesión", async () => {
    mocks.obtenerConductorActual.mockResolvedValue(null);
    await expect(cargarConductorCuenta()).resolves.toBeNull();
    expect(mocks.obtenerUrlFotoPerfilConductor).not.toHaveBeenCalled();
  });

  it("carga conductor, foto y correo de la sesión", async () => {
    mocks.obtenerConductorActual.mockResolvedValue({ id: "driver-1", foto_perfil_url: "foto-antigua" });
    mocks.obtenerUrlFotoPerfilConductor.mockResolvedValue("https://cdn.ruum.mx/foto.jpg");
    mocks.getUser.mockResolvedValue({ data: { user: { email: "driver@ruum.mx", new_email: "nuevo@ruum.mx" } } });

    await expect(cargarConductorCuenta()).resolves.toMatchObject({
      id: "driver-1",
      foto_perfil_url: "https://cdn.ruum.mx/foto.jpg",
      email: "driver@ruum.mx",
      new_email: "nuevo@ruum.mx",
    });
  });

  it("formatea fechas de cuenta y señala fechas pendientes", () => {
    expect(fechaCuenta(null)).toBe("Pendiente");
    expect(fechaCuenta("2026-07-15T12:00:00.000Z")).toContain("2026");
  });

  it("normaliza teléfonos nacionales e internacionales a E.164", () => {
    expect(telefonoE164("55 1234-5678")).toBe("+525512345678");
    expect(telefonoE164("52 (55) 1234 5678")).toBe("+525512345678");
    expect(telefonoE164("5215512345678")).toBe("+5215512345678");
    expect(telefonoE164("abc")).toBe("");
  });
});
