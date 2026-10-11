/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VALORES_INICIALES } from "../constants";
import type { DatosFormulario } from "../types";
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

describe("PasoRuta", () => {
  it("actualiza los buscadores y referencias cuando cambia el estado controlado", () => {
    const iniciales = propsIniciales();
    const vista = render(<PasoRuta {...iniciales} />);

    const datosActualizados: DatosFormulario = {
      ...iniciales.datos,
      origenNumero: "101",
      origenReferencias: "Portón azul",
      destinoNumero: "202",
      destinoReferencias: "Acceso por estacionamiento",
    };
    vista.rerender(
      <PasoRuta
        {...iniciales}
        datos={datosActualizados}
        origenBusqueda="Av. Reforma"
        destinoBusqueda="Calle 5"
      />,
    );

    expect(screen.getByLabelText("Buscar dirección de origen")).toHaveValue("Av. Reforma");
    expect(screen.getByLabelText("Buscar dirección de destino")).toHaveValue("Calle 5");
    const numeros = screen.getAllByLabelText("Número exterior / interior", { selector: "input" });
    expect(numeros[0]).toHaveValue("101");
    expect(numeros[1]).toHaveValue("202");
    const referencias = screen.getAllByLabelText("Referencias", { selector: "input" });
    expect(referencias[0]).toHaveValue("Portón azul");
    expect(referencias[1]).toHaveValue("Acceso por estacionamiento");
  });

  it("re-renderiza al cambiar solo un contacto (comparador sin identidad)", () => {
    const iniciales = propsIniciales();
    const vista = render(<PasoRuta {...iniciales} />);
    vista.rerender(
      <PasoRuta {...iniciales} datos={{ ...iniciales.datos, entregaNombre: "María" }} />,
    );
    expect(document.getElementById("entregaNombre")).toHaveValue("María");
  });

  it("omite re-render ante cambios de datos irrelevantes para el paso", () => {
    const claseControl = vi.fn(() => "");
    const base = propsIniciales();
    const iniciales: PasoRutaProps = {
      ...base,
      acciones: { ...base.acciones, claseControl },
    };
    const vista = render(<PasoRuta {...iniciales} />);
    const llamadasTrasMontaje = claseControl.mock.calls.length;
    expect(llamadasTrasMontaje).toBeGreaterThan(0);
    // marca/modelo no los pinta este paso: memo debe bloquear el re-render.
    vista.rerender(
      <PasoRuta {...iniciales} datos={{ ...iniciales.datos, marca: "Toyota", modelo: "Yaris" }} />,
    );
    expect(claseControl.mock.calls.length).toBe(llamadasTrasMontaje);
  });

  it("propaga lo que se escribe en el buscador de origen y de destino", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<PasoRuta {...iniciales} />);

    await user.type(screen.getByRole("combobox", { name: "Buscar dirección de origen" }), "Reforma");
    await user.type(screen.getByRole("combobox", { name: "Buscar dirección de destino" }), "Toluca");

    // El input es controlado por prop y el spy no actualiza el estado, así que
    // cada onChange lleva un solo carácter: concatenando se reconstruye lo escrito.
    const setOrigen = iniciales.acciones.setOrigenBusqueda as unknown as ReturnType<typeof vi.fn>;
    const setDestino = iniciales.acciones.setDestinoBusqueda as unknown as ReturnType<typeof vi.fn>;
    expect(setOrigen.mock.calls.map((c: unknown[]) => c[0]).join("")).toBe("Reforma");
    expect(setDestino.mock.calls.map((c: unknown[]) => c[0]).join("")).toBe("Toluca");
  });

  it("aplica la sugerencia elegida al origen y al destino", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(
      <PasoRuta
        {...iniciales}
        origenSugerencias={[sugerencia()]}
        destinoSugerencias={[sugerencia()]}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Av. Reforma 120, CDMX" })[0]);

    expect(iniciales.acciones.aplicarSugerenciaDireccion).toHaveBeenCalledWith(
      "origen",
      expect.objectContaining({ textoCompleto: "Av. Reforma 120, CDMX" })
    );
  });

  it("normaliza los teléfonos de contacto a 10 dígitos", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<PasoRuta {...iniciales} />);

    // El valor llega como digits+52: el hook lo recorta vía actualizarTelefono.
    await user.type(
      screen.getByLabelText("Teléfono de entrega, 10 dígitos sin incluir +52"),
      "5512345678",
    );

    expect(iniciales.acciones.actualizarTelefono).toHaveBeenCalled();
  });

  it("muestra distancia y tiempo cuando la estimación está resuelta", () => {
    render(
      <PasoRuta
        {...propsIniciales()}
        rutaEstimacion={{
          distanciaKm: 64.4,
          tiempoEstimadoHoras: 1.5,
          incompletas: false,
        }}
      />,
    );

    expect(screen.getByText("Distancia y tiempo estimado")).toBeInTheDocument();
    expect(screen.getByText("Distancia")).toBeInTheDocument();
    expect(screen.getByText("Tiempo")).toBeInTheDocument();
  });

  it("pide completar ambas direcciones cuando no hay estimación", () => {
    render(<PasoRuta {...propsIniciales()} />);
    expect(screen.getByText("Completa ambas direcciones")).toBeInTheDocument();
  });

  it("informa que está calculando la ruta", () => {
    render(<PasoRuta {...propsIniciales()} rutaCalculando />);
    expect(screen.getByText("Calculando ruta...")).toBeInTheDocument();
  });

  it("ofrece reintentar el cálculo cuando hay aviso de ruta", () => {
    const iniciales = propsIniciales();
    render(<PasoRuta {...iniciales} rutaAviso="No pudimos calcular la ruta." />);

    const boton = screen.getByRole("button", { name: "Reintentar cálculo" });
    expect(boton).toBeEnabled();
    boton.click();
    expect(iniciales.acciones.onReintentarRuta).toHaveBeenCalled();
  });

  it("no ofrece reintento mientras calcula", () => {
    render(
      <PasoRuta
        {...propsIniciales()}
        rutaAviso="No pudimos calcular la ruta."
        rutaCalculando
      />,
    );

    expect(screen.getByRole("button", { name: "Reintentar cálculo" })).toBeDisabled();
  });

  it("muestra los errores de teléfono de entrega y recepción", () => {
    render(
      <PasoRuta
        {...propsIniciales()}
        errores={{
          entregaTelefono: "El teléfono de entrega es obligatorio",
          recepcionTelefono: "El teléfono de recepción es obligatorio",
        }}
      />,
    );

    expect(screen.getByText("El teléfono de entrega es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("El teléfono de recepción es obligatorio")).toBeInTheDocument();
  });

  it("no pide la ubicación actual fuera del shell nativo", () => {
    render(<PasoRuta {...propsIniciales()} />);
    expect(screen.queryByRole("button", { name: /usar mi ubicación/i })).toBeNull();
  });

  it("delega los cambios de escalas al padre", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<PasoRuta {...iniciales} />);

    await user.click(screen.getByRole("button", { name: "Agregar escala o tarea" }));

    expect(iniciales.acciones.onParadasChange).toHaveBeenCalled();
  });

  it("propaga las instrucciones especiales y valida al salir", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(<PasoRuta {...iniciales} />);

    const instrucciones = screen.getByLabelText("Instrucciones especiales para el traslado");
    await user.type(instrucciones, "Entrega en privada");
    await user.tab();

    expect(iniciales.acciones.actualizar).toHaveBeenCalledWith(
      "instruccionesEspeciales",
      "E",
    );
    expect(iniciales.acciones.validarCampo).toHaveBeenCalledWith("instruccionesEspeciales");
  });

  it("aplica una sugerencia al destino", async () => {
    const user = userEvent.setup();
    const iniciales = propsIniciales();
    render(
      <PasoRuta
        {...iniciales}
        origenSugerencias={[sugerencia()]}
        destinoSugerencias={[sugerencia()]}
      />,
    );

    // El segundo botón con ese nombre es el del destino.
    await user.click(screen.getAllByRole("button", { name: "Av. Reforma 120, CDMX" })[1]);

    expect(iniciales.acciones.aplicarSugerenciaDireccion).toHaveBeenCalledWith(
      "destino",
      expect.objectContaining({ textoCompleto: "Av. Reforma 120, CDMX" })
    );
  });
});

function sugerencia() {
  return {
    textoCompleto: "Av. Reforma 120, CDMX",
    direccion: "Av. Reforma",
    colonia: "Juárez",
    codigoPostal: "06600",
    ciudad: "Ciudad de México",
    estado: "CDMX",
    lat: 19.427,
    lng: -99.167,
  };
}
