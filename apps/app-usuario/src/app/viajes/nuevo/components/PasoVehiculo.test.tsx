/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VALORES_INICIALES } from "../constants";
import type { DatosFormulario } from "../types";
import { PasoVehiculo, type PasoVehiculoProps } from "./PasoVehiculo";

function propsIniciales(): PasoVehiculoProps {
  return {
    datos: { ...VALORES_INICIALES },
    errores: {},
    acciones: {
      claseControl: () => "",
      actualizar: vi.fn(),
      actualizarMarcaCatalogo: vi.fn(),
      actualizarModeloCatalogo: vi.fn(),
      validarCampo: vi.fn(),
      aplicarVehiculoGuardado: vi.fn(),
      limpiarVehiculoGuardado: vi.fn(),
      setDetallesVehiculoExpandido: vi.fn(),
      onEditarTarifa: vi.fn(),
    },
    vehiculosGuardados: [],
    vehiculoSeleccionadoId: "",
    categoriaCatalogo: "Sedán",
    gamaCatalogo: "General",
    modelosDisponibles: [],
    clasificacionCatalogo: null,
    previsualizacion: null,
    detallesVehiculoExpandido: true,
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
    const iniciales = {
      ...propsIniciales(),
      acciones: { ...propsIniciales().acciones, claseControl },
    };
    const vista = render(<PasoVehiculo {...iniciales} />);
    const llamadasTrasMontaje = claseControl.mock.calls.length;
    expect(llamadasTrasMontaje).toBeGreaterThan(0);
    // CP de origen no lo pinta este paso: memo debe bloquear el re-render.
    vista.rerender(
      <PasoVehiculo {...iniciales} datos={{ ...iniciales.datos, origenCodigoPostal: "03100" }} />,
    );
    expect(claseControl.mock.calls.length).toBe(llamadasTrasMontaje);
  });

  it("abre y cierra el bloque de detalles del vehículo", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<PasoVehiculo {...iniciales} />);

    expect(screen.getByRole("button", { name: /Detalles del vehículo/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /Detalles del vehículo/ }));
    expect(iniciales.acciones.setDetallesVehiculoExpandido).toHaveBeenCalled();
  });

  it("propaga color y validación al perder el foco", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<PasoVehiculo {...iniciales} />);

    await user.type(screen.getByLabelText("Color"), "Rojo");
    await user.tab();

    // El input es controlado y el espía no actualiza el estado: cada onChange
    // lleva un carácter, así que se comprueba la secuencia acumulada.
    expect(iniciales.acciones.actualizar.mock.calls.map((c) => c[1]).join("")).toBe("Rojo");
    expect(iniciales.acciones.validarCampo).toHaveBeenCalledWith("color");
  });
});
