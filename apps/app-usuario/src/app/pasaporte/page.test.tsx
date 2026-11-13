/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
  it("ofrece consulta y descarga cuando solo hay traslados completados", async () => {
    listar.mockResolvedValueOnce([{ traslado_id: "cerrado-1", estado: "servicio_cerrado", vehiculo_marca: "Nissan", vehiculo_modelo: "Versa", origen_ciudad: "CDMX", destino_ciudad: "Puebla", cerrado_en: "2026-10-30T12:00:00Z" }]);
    render(await PaginaPasaporte());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pasaportes anteriores");
    expect(screen.getByRole("link", { name: "Ver pasaporte CERRADO-" })).toHaveAttribute("href", "/viajes/cerrado-1");
    expect(within(screen.getByRole("group", { name: "Descargar pasaporte CERRADO-" })).getByRole("button", { name: "Exportar pasaporte completo" })).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
    expect(screen.queryByText("Aún no tienes traslados activos")).not.toBeInTheDocument();
  });
  it.each([
    { estado: "disputa_abierta", cerrado_en: "2026-10-30T12:00:00Z" },
    { estado: "incidencia_reportada", estado_operativo: "closed" },
    { estado: "cierre_operativo_con_incidencia_abierta" },
    { estado: "disputa_resuelta" },
  ])("incluye el expediente finalizado sin confundirlo con uno activo: %j", async datos => {
    listar.mockResolvedValueOnce([{ traslado_id: "anterior-1", ...datos }]);
    render(await PaginaPasaporte());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pasaportes anteriores");
    expect(redirect).not.toHaveBeenCalled();
  });
  it("no presenta cancelados o fallidos como pasaportes completados", async () => {
    listar.mockResolvedValueOnce([{ traslado_id: "cancelado", estado: "servicio_cancelado", cerrado_en: "2026-10-30T12:00:00Z" }, { traslado_id: "fallido", estado: "traslado_fallido" }]);
    render(await PaginaPasaporte());
    expect(screen.queryByRole("list", { name: "Pasaportes de traslados finalizados" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver historial de traslados/ })).toHaveAttribute("href", "/mis-viajes");
  });
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
    listar.mockResolvedValueOnce([{ traslado_id: null, estado: "traslado_en_curso" }, { traslado_id: "cerrado", estado: "servicio_cerrado" }, { traslado_id: "viaje-1", estado: "traslado_en_curso" }]);
    await expect(PaginaPasaporte()).rejects.toThrow("redirect:/viajes/viaje-1");
  });
});
