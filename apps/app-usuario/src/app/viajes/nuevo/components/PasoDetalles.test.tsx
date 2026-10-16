/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it, vi } from "vitest";
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
    momentoPago: {
      momento: "al_cierre",
      razon: "El pago se realiza al finalizar.",
    },
    categoriaCatalogo: "Sedán",
    gamaCatalogo: "General",
    rutaEstimacion: null,
    politicaCancelacion: {
      mensaje: "Aplican cargos según el momento de cancelación.",
    },
    aceptaPoliticasPagoCancelacion: false,
    enviando: false,
    cargandoSesion: false,
    tarifaPreviaAceptada: true,
  };
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
describe("PasoDetalles compacto", () => {
  it("oculta el desglose y no exige un checkbox físico", async () => {
    const props = propsIniciales();
    render(<PasoDetalles {...props} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Desglose de la tarifa" }),
    ).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /Ver desglose completo/ }));
    expect(
      screen.getByRole("dialog", { name: "Desglose de la tarifa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(props.politicaCancelacion.mensaje),
    ).toBeInTheDocument();
    expect(
      props.acciones.setAceptaPoliticasPagoCancelacion,
    ).not.toHaveBeenCalled();
  });
  it("guarda una ventana personalizada y cierra la hoja", async () => {
    const user = userEvent.setup();
    const props = propsIniciales();
    render(<PasoDetalles {...props} />);
    await user.click(screen.getByRole("button", { name: /Entrega ▾/ }));
    await user.type(
      screen.getByLabelText("Especifica ventana de entrega"),
      "mismo día",
    );
    await user.click(screen.getByRole("button", { name: "Guardar ventana" }));
    expect(props.acciones.actualizar).toHaveBeenCalledWith(
      "ventanaEntrega",
      "Otra: mismo día",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("cambia el tipo de traslado con el control segmentado", async () => {
    const props = propsIniciales();
    render(<PasoDetalles {...props} />);
    await userEvent
      .setup()
      .click(screen.getByRole("radio", { name: "Foráneo" }));
    expect(props.acciones.actualizar).toHaveBeenCalledWith(
      "tipoRuta",
      "foraneo",
    );
  });
  it("conserva el resumen controlado del vehículo", () => {
    const props = propsIniciales();
    const view = render(<PasoDetalles {...props} />);
    view.rerender(
      <PasoDetalles
        {...props}
        datos={{
          ...props.datos,
          marca: "Nissan",
          modelo: "Versa",
          anio: "2020",
        }}
      />,
    );
    expect(screen.getByText("Nissan Versa 2020")).toBeInTheDocument();
  });
});
