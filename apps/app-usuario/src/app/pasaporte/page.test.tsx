/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import PaginaPasaporte from "./page";

const { usuario, listar, redirect } = vi.hoisted(() => ({ usuario: vi.fn(), listar: vi.fn(), redirect: vi.fn((ruta: string) => { throw new Error(`redirect:${ruta}`); }) }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("../../lib/supabase-server", () => ({ crearClienteServidor: async () => ({}) }));
vi.mock("@ruum/api/services", () => ({ obtenerUsuarioActual: usuario, listarTrasladosDeUsuario: listar }));
vi.mock("../NavegacionUsuario", () => ({ NavegacionUsuario: () => null }));
vi.mock("../../components/layout/UserDashboardLayout", () => ({ UserDashboardLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));

afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test");
  usuario.mockResolvedValue({ id: "usuario-1", nombre: "Ana" });
  listar.mockResolvedValue([]);
});

describe("consulta del pasaporte activo", () => {
  it("muestra un vacío solo cuando la consulta termina correctamente", async () => {
    render(await PaginaPasaporte());
    expect(screen.getByRole("heading")).toHaveTextContent("Aún no tienes traslados activos");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it.each(["sesion", "traslados"])("ofrece reintento cuando falla %s sin fingir una cuenta vacía", async origen => {
    (origen === "sesion" ? usuario : listar).mockRejectedValueOnce(new Error("Sin conexión"));
    render(await PaginaPasaporte());
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar tu pasaporte");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByText("Aún no tienes traslados activos")).not.toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
  it("redirige al login únicamente cuando no hay usuario", async () => {
    usuario.mockResolvedValueOnce(null);
    await expect(PaginaPasaporte()).rejects.toThrow("redirect:/login?");
    expect(listar).not.toHaveBeenCalled();
  });
  it("conserva el acceso al traslado activo", async () => {
    listar.mockResolvedValueOnce([{ traslado_id: "viaje-1", estado: "traslado_en_curso" }]);
    await expect(PaginaPasaporte()).rejects.toThrow("redirect:/viajes/viaje-1");
  });
});
