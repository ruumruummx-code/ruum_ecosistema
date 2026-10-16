/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VALORES_INICIALES } from "../constants";

import { PasoRuta, type PasoRutaProps } from "./PasoRuta";

function propsIniciales(): PasoRutaProps {
  return {
    datos: { ...VALORES_INICIALES },
    errores: {},
    acciones: {
      claseControl: () => "",
      actualizar: vi.fn(),
      actualizarTelefono: vi.fn(),
      actualizarCodigoPostal: vi.fn(),
      consultarCodigoPostal: vi.fn(async () => undefined),
      validarCampo: vi.fn(),
      aplicarSugerenciaCp: vi.fn(),
      aplicarSugerenciaDireccion: vi.fn(),
      setOrigenBusqueda: vi.fn(),
      setDestinoBusqueda: vi.fn(),
      onReintentarRuta: vi.fn(),
      onParadasChange: vi.fn(),
    },
    cpConsultando: null,
    cpAviso: { origen: null, destino: null },
    cpOpciones: { origen: null, destino: null },
    placesOpciones: { origen: [], destino: [] },
    origenBusqueda: "",
    destinoBusqueda: "",
    origenSugerencias: [],
    destinoSugerencias: [],
    buscandoOrigen: false,
    buscandoDestino: false,
    rutaEstimacion: null,
    rutaCalculando: false,
    rutaAviso: null,
    erroresParadas: undefined,
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
vi.mock("./DireccionMapa", () => ({
  DireccionMapa: ({
    onConfirmar,
    inicial,
  }: {
    onConfirmar: (value: unknown) => void;
    inicial: { lat?: number; lng?: number };
  }) => (
    <button
      data-lng={inicial.lng}
      onClick={() =>
        onConfirmar({
          textoCompleto: "Reforma 120, CDMX",
          direccion: "Reforma",
          numero: "120",
          codigoPostal: "06600",
          colonia: "Juárez",
          ciudad: "CDMX",
          estado: "CDMX",
          referencias: "Portón azul",
          lat: 19.4,
          lng: -99.1,
        })
      }
    >
      Confirmar ubicación
    </button>
  ),
}));

describe("PasoRuta en pestañas y mapa", () => {
  it("actualiza el pin aunque sólo cambie la longitud y la dirección siga igual", async () => {
    const props = propsIniciales();
    const datos = { ...props.datos, destinoLat: 19.4, destinoLng: -99.1 };
    const view = render(<PasoRuta {...props} datos={datos}/>);
    await userEvent.setup().click(screen.getByRole("button", { name: /Domicilio de destino/ }));
    expect(await screen.findByRole("button", { name: "Confirmar ubicación" })).toHaveAttribute("data-lng", "-99.1");
    view.rerender(<PasoRuta {...props} datos={{ ...datos, destinoLng: -99.2 }}/>);
    expect(screen.getByRole("button", { name: "Confirmar ubicación" })).toHaveAttribute("data-lng", "-99.2");
  });
  it("oculta los campos y confirma la dirección desde la hoja completa", async () => {
    const user = userEvent.setup();
    const props = propsIniciales();
    render(<PasoRuta {...props} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Domicilio de origen/ }),
    );
    expect(
      screen.getByRole("dialog", { name: "Domicilio de origen" }),
    ).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", { name: "Confirmar ubicación" }),
    );
    expect(props.acciones.aplicarSugerenciaDireccion).toHaveBeenCalledWith(
      "origen",
      expect.objectContaining({ direccion: "Reforma", lat: 19.4 }),
    );
    expect(props.acciones.actualizar).toHaveBeenCalledWith(
      "origenNumero",
      "120",
    );
    expect(props.acciones.actualizar).toHaveBeenCalledWith(
      "origenReferencias",
      "Portón azul",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("separa los contactos y conserva los valores controlados", async () => {
    const user = userEvent.setup();
    const props = propsIniciales();
    const view = render(<PasoRuta {...props} />);
    await user.click(screen.getByRole("tab", { name: "Contactos" }));
    expect(
      screen.queryByRole("button", { name: /Domicilio de origen/ }),
    ).not.toBeInTheDocument();
    view.rerender(
      <PasoRuta
        {...props}
        datos={{ ...props.datos, entregaNombre: "María" }}
      />,
    );
    expect(document.getElementById("entregaNombre")).toHaveValue("María");
    await user.type(
      screen.getByLabelText("Teléfono de entrega, 10 dígitos sin incluir +52"),
      "5512345678",
    );
    expect(props.acciones.actualizarTelefono).toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: "Direcciones" }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("actualiza el resumen de domicilios sin desplegar campos", () => {
    const props = propsIniciales();
    const view = render(<PasoRuta {...props} />);
    view.rerender(
      <PasoRuta
        {...props}
        datos={{
          ...props.datos,
          destinoCiudad: "San Mateo Atenco",
          destinoCodigoPostal: "52104",
          destinoCalle: "Calle 400",
          destinoNumero: "12",
        }}
      />,
    );
    expect(screen.getByText("San Mateo Atenco, 52104")).toBeInTheDocument();
    expect(screen.getByText("Calle 400 #12")).toBeInTheDocument();
  });
  it("revela contactos inválidos y permite reintentar el cálculo", async () => {
    const user = userEvent.setup();
    const props = propsIniciales();
    const view = render(<PasoRuta {...props} />);
    view.rerender(
      <PasoRuta {...props} errores={{ entregaNombre: "Requerido" }} />,
    );
    expect(screen.getByRole("tab", { name: "Contactos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    view.rerender(
      <PasoRuta {...props} rutaAviso="No pudimos calcular la ruta." />,
    );
    await user.click(screen.getByRole("tab", { name: "Direcciones" }));
    await user.click(
      screen.getByRole("button", { name: "Reintentar cálculo" }),
    );
    expect(props.acciones.onReintentarRuta).toHaveBeenCalled();
  });
});
