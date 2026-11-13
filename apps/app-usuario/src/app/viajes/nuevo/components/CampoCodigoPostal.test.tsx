/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampoCodigoPostal, type CampoCodigoPostalProps } from "./CampoCodigoPostal";

function propsIniciales(): CampoCodigoPostalProps {
  return {
    id: "origenCodigoPostal",
    nombre: "origenCodigoPostal",
    valor: "",
    ciudadActual: "",
    opciones: null,
    sugerenciasMapbox: [],
    consultando: false,
    aviso: null,
    onCambiar: vi.fn(),
    onSalir: vi.fn(),
    onAplicarSugerencia: vi.fn(),
  };
}

describe("CampoCodigoPostal", () => {
  it("avisa a cada tecla al escribir el CP", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<CampoCodigoPostal {...iniciales} />);

    await user.type(screen.getByLabelText("Código Postal"), "03100");

    expect(iniciales.onCambiar).toHaveBeenCalledTimes(5);
    expect(iniciales.onCambiar).toHaveBeenLastCalledWith("0");
  });

  it("avisa el valor al perder el foco", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<CampoCodigoPostal {...iniciales} valor="03100" />);

    await user.click(screen.getByLabelText("Código Postal"));
    await user.tab();

    expect(iniciales.onSalir).toHaveBeenCalledWith("03100");
  });

  it("aplica una colonia sugerida con su ciudad", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(
      <CampoCodigoPostal
        {...iniciales}
        opciones={{
          codigo: "03100",
          ciudades: ["Ciudad de México"],
          colonias: ["Del Valle", "Nápoles"],
        } as never}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Del Valle" }));

    expect(iniciales.onAplicarSugerencia).toHaveBeenCalledWith("Ciudad de México", "Del Valle");
  });

  it("anuncia la consulta en curso como región viva", () => {
    render(<CampoCodigoPostal {...propsIniciales()} consultando />);

    expect(screen.getByRole("status")).toHaveTextContent(/Buscando código postal/);
    expect(screen.getByLabelText("Código Postal")).toHaveAttribute("aria-busy", "true");
  });

  it("no muestra colonias sin opciones de CP", () => {
    render(<CampoCodigoPostal {...propsIniciales()} />);
    expect(screen.queryByText("Colonias sugeridas")).toBeNull();
  });
});
