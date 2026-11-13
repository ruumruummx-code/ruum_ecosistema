/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SeleccionVehiculoInicial } from "./SeleccionVehiculoInicial";
import type { useNuevoTraslado } from "./hooks/useNuevoTraslado";

const vehiculo = { id: "propio", marca: "Toyota", modelo: "RAV4", anio: 2025, placas: "ABC123" };
function controlador(cargando = false) {
  return { vehiculosGuardados: [vehiculo], cargandoSesion: cargando, aplicarVehiculoGuardado: vi.fn() };
}

describe("selección desde Mis vehículos", () => {
  it("requiere confirmación antes de reemplazar los datos del traslado", () => {
    const t = controlador();
    render(<SeleccionVehiculoInicial t={t as unknown as ReturnType<typeof useNuevoTraslado>} vehiculoId="propio" />);
    expect(t.aplicarVehiculoGuardado).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Usar este vehículo" }));
    expect(t.aplicarVehiculoGuardado).toHaveBeenCalledWith(vehiculo);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("rechaza identificadores que no figuran en la cuenta del usuario", () => {
    const t = controlador();
    render(<SeleccionVehiculoInicial t={t as unknown as ReturnType<typeof useNuevoTraslado>} vehiculoId="ajeno" />);
    expect(screen.getByRole("alert")).toHaveTextContent("no está disponible en tu cuenta");
    expect(screen.queryByRole("button", { name: "Usar este vehículo" })).not.toBeInTheDocument();
    expect(t.aplicarVehiculoGuardado).not.toHaveBeenCalled();
  });

  it("espera la carga de sesión antes de informar que falta el vehículo", () => {
    const t = controlador(true);
    render(<SeleccionVehiculoInicial t={t as unknown as ReturnType<typeof useNuevoTraslado>} vehiculoId="propio" />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando los vehículos");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("permite salir sin reemplazar el borrador y cerrar con Escape nativo", () => {
    const t = controlador();
    render(<SeleccionVehiculoInicial t={t as unknown as ReturnType<typeof useNuevoTraslado>} vehiculoId="propio" />);
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: true, cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(t.aplicarVehiculoGuardado).not.toHaveBeenCalled();
  });
});
