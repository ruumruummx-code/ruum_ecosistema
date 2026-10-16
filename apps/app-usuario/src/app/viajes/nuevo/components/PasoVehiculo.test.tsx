/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VALORES_INICIALES } from "../constants";
import type { DatosFormulario } from "../types";
import { PasoVehiculo, type PasoVehiculoProps } from "./PasoVehiculo";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

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

  it("refleja el tipo de vehículo cuando cambia en la ayuda del modelo", async () => {
    const iniciales = propsIniciales();
    const vista = render(<PasoVehiculo {...iniciales} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Información del modelo" }));
    // Tipo y categoría en la ayuda.
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

    expect(screen.getByRole("dialog", { name: "Detalles del vehículo" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar detalles" }));
    expect(iniciales.acciones.setDetallesVehiculoExpandido).toHaveBeenCalledWith(false);
  });

  it("propaga color y validación al perder el foco", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<PasoVehiculo {...iniciales} />);

    await user.type(screen.getByLabelText("Color"), "Rojo");
    await user.tab();

    // El input es controlado y el espía no actualiza el estado: cada onChange
    // lleva un carácter, así que se comprueba la secuencia acumulada.
    const actualizar = iniciales.acciones.actualizar as unknown as ReturnType<typeof vi.fn>;
    expect(actualizar.mock.calls.map((c: unknown[]) => c[1]).join("")).toBe("Rojo");
    expect(iniciales.acciones.validarCampo).toHaveBeenCalledWith("color");
  });
});
