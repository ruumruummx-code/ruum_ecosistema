/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VALORES_INICIALES } from "../constants";
import { PasoTarifa, type PasoTarifaProps } from "./PasoTarifa";

function propsIniciales(): PasoTarifaProps {
  return {
    datos: { ...VALORES_INICIALES },
    errores: {},
    acciones: {
      claseControl: () => "",
      actualizar: vi.fn(),
      actualizarCodigoPostal: vi.fn(),
      actualizarMarcaCatalogo: vi.fn(),
      actualizarModeloCatalogo: vi.fn(),
      validarCampo: vi.fn(),
      onContinuar: vi.fn(),
    },
    cpConsultando: null,
    modelosDisponibles: [],
    previsualizacion: null,
    previsualizando: false,
  };
}

describe("PasoTarifa — comparador sin identidad", () => {
  it("muestra la ciudad derivada del CP aunque el CP no cambie", () => {
    const iniciales = propsIniciales();
    const vista = render(<PasoTarifa {...iniciales} />);
    expect(screen.queryByText(/Benito Juárez/)).toBeNull();

    vista.rerender(
      <PasoTarifa
        {...iniciales}
        datos={{ ...iniciales.datos, origenCiudad: "Benito Juárez", origenEstado: "CDMX" }}
      />,
    );

    expect(screen.getByText(/Benito Juárez, CDMX/)).toBeInTheDocument();
  });

  it("omite re-render ante cambios de datos irrelevantes para el paso", () => {
    const iniciales = propsIniciales();
    const claseControl = vi.fn(() => "");
    const conEspia = { ...iniciales, acciones: { ...iniciales.acciones, claseControl } };
    const vista = render(<PasoTarifa {...conEspia} />);
    const llamadasTrasMontaje = claseControl.mock.calls.length;
    expect(llamadasTrasMontaje).toBeGreaterThan(0);
    // El tipo de vehículo no lo pinta este paso: memo debe bloquear el re-render.
    vista.rerender(
      <PasoTarifa {...conEspia} datos={{ ...conEspia.datos, tipo: "suv" as never }} />,
    );
    expect(claseControl.mock.calls.length).toBe(llamadasTrasMontaje);
  });

  it("al programar fecha rellena una hora por defecto y valida", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<PasoTarifa {...iniciales} />);

    await user.click(screen.getByRole("radio", { name: /Programar fecha/ }));

    expect(iniciales.acciones.actualizar).toHaveBeenCalledWith("modalidadProgramacion", "programado");
    expect(iniciales.acciones.actualizar).toHaveBeenCalledWith(
      "fechaHoraProgramada",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T09:00$/),
    );
    expect(iniciales.acciones.validarCampo).toHaveBeenCalledWith("modalidadProgramacion");
  });

  it("conserva la hora al cambiar la fecha programada", () => {
    const iniciales = propsIniciales();
    const conFecha: PasoTarifaProps = {
      ...iniciales,
      datos: { ...iniciales.datos, modalidadProgramacion: "programado", fechaHoraProgramada: "2027-01-15T10:30" },
    };
    render(<PasoTarifa {...conFecha} />);

    // fireEvent nativo para type=date: userEvent no soporta pickers de fecha.
    // fireEvent.change lleva el valor ya completo, así que el handler debe
    // conservar la hora previa al componer la fecha nueva.
    fireEvent.change(screen.getByLabelText("Fecha de recolección"), {
      target: { value: "2027-03-20" },
    });

    expect(iniciales.acciones.actualizar).toHaveBeenCalledWith("fechaHoraProgramada", "2027-03-20T10:30");
  });

  it("valida la fecha al perder el foco", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(
      <PasoTarifa
        {...iniciales}
        datos={{ ...iniciales.datos, modalidadProgramacion: "programado", fechaHoraProgramada: "2027-01-15T10:30" }}
      />,
    );

    await user.click(screen.getByLabelText("Fecha de recolección"));
    await user.tab();

    expect(iniciales.acciones.validarCampo).toHaveBeenCalledWith("fechaHoraProgramada");
  });
});
