/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Vehiculo } from "../cuenta-ui";
import PaginaVehiculos from "./page";
import PaginaDetalleVehiculo from "./[id]/page";

const { cuenta } = vi.hoisted(() => ({ cuenta: { usuario: { nombre: "Ana" }, vehiculos: [] as Vehiculo[] } }));
vi.mock("../cuenta-ui", () => ({ conCuenta: (render: (value: typeof cuenta) => React.ReactNode) => render(cuenta) }));
vi.mock("../../NavegacionUsuario", () => ({ NavegacionUsuario: () => null }));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NOT_FOUND"); },
  usePathname: () => "/cuenta/vehiculos",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const vehiculo = {
  id: "auto-1", marca: "Toyota", modelo: "RAV4", anio: 2025, tipo: "suv",
  placas: "ABC-123", color: "Rojo", vin: "VIN-PRIVADO", alias: "Familiar", fotos_urls: [],
} as unknown as Vehiculo;

describe("Mis vehículos", () => {
  it("muestra nombre y placas en una fila que abre el detalle", async () => {
    cuenta.vehiculos = [vehiculo];
    render(await PaginaVehiculos());
    const listas = screen.getAllByRole("list", { name: "Vehículos guardados" });
    const lista = listas[0];
    expect(within(lista).getAllByRole("listitem")).toHaveLength(1);
    expect(within(lista).getByRole("link", { name: "Toyota RAV4 2025 ABC-123" })).toHaveAttribute("href", "/cuenta/vehiculos/auto-1");
    expect(screen.queryByText("Rojo")).not.toBeInTheDocument();
    expect(screen.queryByText("VIN-PRIVADO")).not.toBeInTheDocument();
    expect(screen.queryByText("Familiar")).not.toBeInTheDocument();
    expect(screen.queryByText("Sin fotografías guardadas")).not.toBeInTheDocument();
    expect(screen.queryByText("Vehículo guardado")).not.toBeInTheDocument();
  });
  it("conserva Color y VIN en el detalle", async () => {
    cuenta.vehiculos = [vehiculo];
    render(await PaginaDetalleVehiculo({ params: Promise.resolve({ id: "auto-1" }) }));
    expect(screen.getByText("Rojo")).toBeInTheDocument();
    expect(screen.getByText("VIN-PRIVADO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver a mis vehículos/ })).toHaveAttribute("href", "/cuenta/vehiculos");
  });
  it("no permite abrir un vehículo que no pertenece a la cuenta", async () => {
    cuenta.vehiculos = [vehiculo];
    await expect(PaginaDetalleVehiculo({ params: Promise.resolve({ id: "otro-auto" }) })).rejects.toThrow("NOT_FOUND");
  });
  it("orienta al usuario sin vehículos hacia el único FAB", async () => {
    cuenta.vehiculos = [];
    const { container } = render(await PaginaVehiculos());
    expect(screen.getAllByText("Sin vehículos registrados").length).toBeGreaterThanOrEqual(1);
    const mobileContent = container.querySelector(".user-vehicles-content");
    expect(mobileContent?.querySelector("a")).toBeNull();
  });
});
