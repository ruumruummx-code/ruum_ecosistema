/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VALORES_INICIALES } from "../constants";
import { PasoTarifa, type PasoTarifaProps } from "./PasoTarifa";

function propsIniciales(): PasoTarifaProps {
  return {
    datos: { ...VALORES_INICIALES },
    errores: {},
    claseControl: () => "",
    actualizar: vi.fn(),
    actualizarCodigoPostal: vi.fn(),
    actualizarMarcaCatalogo: vi.fn(),
    actualizarModeloCatalogo: vi.fn(),
    validarCampo: vi.fn(),
    cpConsultando: null,
    modelosDisponibles: [],
    previsualizacion: null,
    previsualizando: false,
    onContinuar: vi.fn(),
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
    const claseControl = vi.fn(() => "");
    const iniciales = { ...propsIniciales(), claseControl };
    const vista = render(<PasoTarifa {...iniciales} />);
    const llamadasTrasMontaje = claseControl.mock.calls.length;
    expect(llamadasTrasMontaje).toBeGreaterThan(0);
    // El tipo de vehículo no lo pinta este paso: memo debe bloquear el re-render.
    vista.rerender(
      <PasoTarifa {...iniciales} datos={{ ...iniciales.datos, tipo: "suv" as never }} />,
    );
    expect(claseControl.mock.calls.length).toBe(llamadasTrasMontaje);
  });
});
