/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Vehiculo } from "../cuenta-ui";
import { VehiculosDesktop } from "./VehiculosDesktop";
import { nombreVehiculo } from "./VehicleListItem";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const vehiculos = [
  { id: "a", marca: "Toyota", modelo: "RAV4", anio: 2025, placas: "ABC-123", tipo: "suv", alias: "Familiar", creado_en: "2026-10-28T12:00:00Z" },
  { id: "b", marca: "Nissan", modelo: "Versa", anio: 2024, placas: "XYZ456", tipo: "sedan", alias: "Ejecutivo", creado_en: "2026-10-27T12:00:00Z" },
] as Vehiculo[];

describe("Mis vehículos desktop", () => {
  it("busca placas con o sin guiones y no recupera todo al quedarse sin resultados", () => {
    render(<VehiculosDesktop vehiculos={vehiculos} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "abc123" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Toyota RAV4/ })).toHaveAttribute("href", "/cuenta/vehiculos/a");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "inexistente" } });
    expect(screen.queryByRole("list", { name: "Vehículos guardados" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Mostrando 0 de 2 vehículos");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("busca por alias y combina el filtro de tipo", () => {
    render(<VehiculosDesktop vehiculos={vehiculos} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "familiar" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Tipo de vehículo" }), { target: { value: "sedan" } });
    expect(screen.getByRole("heading", { name: "No se encontraron vehículos" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("ordena por fecha real o nombre sin modificar los datos de entrada", () => {
    const ids = vehiculos.map(v => v.id);
    render(<VehiculosDesktop vehiculos={vehiculos} />);
    const lista = screen.getByRole("list", { name: "Vehículos guardados" });
    expect(within(lista).getAllByRole("link")[0]).toHaveTextContent("Toyota");
    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar por" }), { target: { value: "nombre" } });
    expect(within(lista).getAllByRole("link")[0]).toHaveTextContent("Nissan");
    expect(vehiculos.map(v => v.id)).toEqual(ids);
  });

  it("muestra un vacío útil y actualiza desde el servidor", () => {
    render(<VehiculosDesktop vehiculos={[]} />);
    expect(screen.getByRole("heading", { name: "Sin vehículos registrados" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear primer traslado" })).toHaveAttribute("href", "/viajes/nuevo");
    fireEvent.click(screen.getByRole("button", { name: "Actualizar vehículos" }));
    expect(refresh).toHaveBeenCalled();
  });

  it("no deja nombres vacíos si el registro solo contiene espacios", () => {
    expect(nombreVehiculo({ marca: "  ", modelo: " ", anio: null } as unknown as Vehiculo)).toBe("Vehículo sin información");
  });
});
