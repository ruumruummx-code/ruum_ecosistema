/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VALORES_INICIALES } from "../constants";
import { PasoDetalles, type PasoDetallesProps } from "./PasoDetalles";

function propsIniciales(): PasoDetallesProps {
  return {
    datos: { ...VALORES_INICIALES },
    acciones: {
      actualizar: vi.fn(),
      onEditarAgenda: vi.fn(),
      setAceptaPoliticasPagoCancelacion: vi.fn(),
      enviarSolicitud: vi.fn(async () => undefined),
      onRevisarTarifa: vi.fn(),
    },
    previsualizacion: null,
    previsualizando: false,
    momentoPago: { momento: "al_cierre", razon: "El pago se realiza al finalizar." },
    categoriaCatalogo: "Sedán",
    gamaCatalogo: "General",
    rutaEstimacion: null,
    politicaCancelacion: { mensaje: "Aplican cargos según el momento de cancelación." },
    aceptaPoliticasPagoCancelacion: false,
    enviando: false,
    cargandoSesion: false,
    tarifaPreviaAceptada: true,
  };
}

describe("PasoDetalles", () => {
  it("actualiza la aceptación de la política aunque el resto de datos no cambie", () => {
    const iniciales = propsIniciales();
    const vista = render(<PasoDetalles {...iniciales} />);

    vista.rerender(<PasoDetalles {...iniciales} aceptaPoliticasPagoCancelacion />);

    expect(screen.getByLabelText(/acepto la política de cancelación/i)).toBeChecked();
  });

  it("actualiza el resumen del vehículo aunque el resto no cambie", () => {
    const iniciales = propsIniciales();
    const vista = render(<PasoDetalles {...iniciales} />);

    vista.rerender(
      <PasoDetalles
        {...iniciales}
        datos={{ ...iniciales.datos, marca: "Nissan", modelo: "Versa", anio: "2020" }}
      />,
    );

    expect(screen.getByText(/Nissan Versa 2020/)).toBeInTheDocument();
  });

  it("pasa la ventana de entrega personalizada con el prefijo Otra:", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(
      <PasoDetalles
        {...iniciales}
        datos={{ ...iniciales.datos, ventanaEntrega: "Otra: " }}
      />,
    );

    // El label "ventana de entrega" también casa con el <select> de ventanas,
    // así que se apunta al input personalizado por su id.
    const campo = document.getElementById("ventanaEntregaCustom") as HTMLInputElement;
    await user.type(campo, "mismo día");
    await user.tab();

    // El padre es controlado y el espía no actualiza, así que cada onChange
    // lleva un carácter. Lo que importa es que el valor se prefija.
    expect(iniciales.acciones.actualizar).toHaveBeenCalledWith(
      "ventanaEntrega",
      expect.stringMatching(/^Otra: /),
    );
    // onBlur recorta espacios.
    expect(iniciales.acciones.actualizar).toHaveBeenLastCalledWith(
      "ventanaEntrega",
      "Otra: ",
    );
  });

  it("marca la aceptación de la política al marcar el checkbox", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<PasoDetalles {...iniciales} />);

    await user.click(screen.getByLabelText(/acepto la política de cancelación/i));

    expect(iniciales.acciones.setAceptaPoliticasPagoCancelacion).toHaveBeenCalled();
  });
});
