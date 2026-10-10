/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VALORES_INICIALES } from "../constants";
import type { DatosFormulario } from "../types";
import { PasoVehiculo, type PasoVehiculoProps } from "./PasoVehiculo";

function propsIniciales(): PasoVehiculoProps {
  return {
    datos: { ...VALORES_INICIALES },
    errores: {},
    claseControl: () => "",
    actualizar: vi.fn(),
    actualizarMarcaCatalogo: vi.fn(),
    actualizarModeloCatalogo: vi.fn(),
    validarCampo: vi.fn(),
    vehiculosGuardados: [],
    vehiculoSeleccionadoId: "",
    aplicarVehiculoGuardado: vi.fn(),
    limpiarVehiculoGuardado: vi.fn(),
    categoriaCatalogo: "Sedán",
    gamaCatalogo: "General",
    modelosDisponibles: [],
    clasificacionCatalogo: null,
    previsualizacion: null,
    onEditarTarifa: vi.fn(),
    detallesVehiculoExpandido: true,
    setDetallesVehiculoExpandido: vi.fn(),
    tarifaPreviaAceptada: true,
  };
}

describe("PasoVehiculo", () => {
  it("refleja placas, VIN y documentación cuando cambian los datos controlados", () => {
    const iniciales = propsIniciales();
    const vista = render(<PasoVehiculo {...iniciales} />);
    const datosActualizados: DatosFormulario = {
      ...iniciales.datos,
      placas: "ABC123",
      vin: "1HGBH41JXMN109186",
      estadoGeneral: "Buen estado, desgaste normal",
      tieneTarjeta: true,
      tieneVerificacion: true,
      tienePlacas: true,
      puedeCircular: true,
    };

    vista.rerender(<PasoVehiculo {...iniciales} datos={datosActualizados} />);

    expect(screen.getByLabelText("Placas")).toHaveValue("ABC123");
    expect(screen.getByLabelText("Número de serie / VIN")).toHaveValue("1HGBH41JXMN109186");
    expect(screen.getByLabelText("Tarjeta de circulación vigente")).toBeChecked();
    expect(screen.getByLabelText("Ambas placas instaladas")).toBeChecked();
  });

  it("refleja el tipo de vehículo cuando cambia (comparador sin identidad)", () => {
    const iniciales = propsIniciales();
    const vista = render(<PasoVehiculo {...iniciales} />);
    // "Sedán" aparece 2 veces: tipo + categoría de catálogo.
    expect(screen.getAllByText("Sedán")).toHaveLength(2);
    vista.rerender(<PasoVehiculo {...iniciales} datos={{ ...iniciales.datos, tipo: "suv" as never }} />);
    expect(screen.getByText("SUV")).toBeInTheDocument();
    expect(screen.getAllByText("Sedán")).toHaveLength(1);
  });

  it("omite re-render ante cambios de datos irrelevantes para el paso", () => {
    const claseControl = vi.fn(() => "");
    const iniciales = { ...propsIniciales(), claseControl };
    const vista = render(<PasoVehiculo {...iniciales} />);
    const llamadasTrasMontaje = claseControl.mock.calls.length;
    expect(llamadasTrasMontaje).toBeGreaterThan(0);
    // CP de origen no lo pinta este paso: memo debe bloquear el re-render.
    vista.rerender(
      <PasoVehiculo {...iniciales} datos={{ ...iniciales.datos, origenCodigoPostal: "03100" }} />,
    );
    expect(claseControl.mock.calls.length).toBe(llamadasTrasMontaje);
  });
});
