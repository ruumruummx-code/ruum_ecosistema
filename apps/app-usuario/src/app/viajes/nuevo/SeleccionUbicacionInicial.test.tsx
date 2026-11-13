/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuevoTrasladoForm, SeleccionUbicacionInicial } from "./NuevoTrasladoForm";
import { useNuevoTraslado } from "./hooks/useNuevoTraslado";

vi.mock("./hooks/useNuevoTraslado", () => ({ useNuevoTraslado: vi.fn() }));
vi.mock("./NuevoTrasladoDesktop", () => ({ NuevoTrasladoDesktop: () => null }));
vi.mock("./components/CotizadorPortal", () => ({ CotizadorPortal: () => null }));
vi.mock("./components/EstadoCreacion", () => ({ EstadoCreacion: () => null }));
vi.mock("../../NavegacionUsuario", () => ({ NavegacionUsuario: () => null }));

function controlador() {
  return {
    origenBusqueda: "Reforma 10", destinoBusqueda: "Juárez 25",
    origenSugerencias: [{ textoCompleto: "Reforma 10, CDMX" }],
    destinoSugerencias: [{ textoCompleto: "Juárez 25, Toluca" }],
    buscandoOrigen: false, buscandoDestino: false,
    setOrigenBusqueda: vi.fn(), setDestinoBusqueda: vi.fn(), aplicarSugerenciaDireccion: vi.fn(),
  };
}

describe("reutilización de ubicaciones en el cotizador", () => {
  it("inicia la búsqueda desde Mis ubicaciones sin aplicar una dirección automáticamente", () => {
    const t = controlador();
    vi.mocked(useNuevoTraslado).mockReturnValue(t as unknown as ReturnType<typeof useNuevoTraslado>);
    render(<NuevoTrasladoForm busquedaDestinoInicial="Juárez 25, Toluca" />);
    expect(t.setDestinoBusqueda).toHaveBeenCalledWith("Juárez 25, Toluca");
    expect(t.setOrigenBusqueda).not.toHaveBeenCalled();
    expect(t.aplicarSugerenciaDireccion).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Confirmar ubicación de destino" })).toBeInTheDocument();
  });

  it("exige seleccionar una sugerencia y aplica el destino elegido", async () => {
    const t = controlador();
    render(<SeleccionUbicacionInicial t={t as unknown as ReturnType<typeof useNuevoTraslado>} lado="destino" consulta="Juárez 25" />);
    expect(t.aplicarSugerenciaDireccion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Juárez 25, Toluca" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(t.aplicarSugerenciaDireccion).toHaveBeenCalledWith("destino", t.destinoSugerencias[0]);
  });

  it("permite ajustar la búsqueda o salir sin reemplazar datos del traslado", () => {
    const t = controlador();
    render(<SeleccionUbicacionInicial t={t as unknown as ReturnType<typeof useNuevoTraslado>} lado="origen" consulta="Reforma 10" />);
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar dirección" }), { target: { value: "Reforma 12" } });
    expect(t.setOrigenBusqueda).toHaveBeenCalledWith("Reforma 12");
    fireEvent.click(screen.getByRole("button", { name: "Continuar sin aplicar ubicación" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(t.aplicarSugerenciaDireccion).not.toHaveBeenCalled();
  });

  it("informa el fallo de aplicar la dirección y conserva el selector", async () => {
    const t = controlador();
    t.aplicarSugerenciaDireccion.mockRejectedValueOnce(new Error("sin red"));
    render(<SeleccionUbicacionInicial t={t as unknown as ReturnType<typeof useNuevoTraslado>} lado="origen" consulta="Reforma 10" />);
    fireEvent.click(screen.getByRole("button", { name: "Reforma 10, CDMX" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos aplicar esta dirección");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
