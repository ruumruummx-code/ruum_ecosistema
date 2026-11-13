/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AutocompletarDireccion } from "./AutocompletarDireccion";
import { BarraAccionesTraslado } from "./BarraAccionesTraslado";

const sugerencias = ["Reforma 1", "Reforma 2"].map((textoCompleto) => ({ textoCompleto, direccion: textoCompleto, colonia: "Centro", codigoPostal: "06000", ciudad: "CDMX", estado: "CDMX", lat: 19.4, lng: -99.1 }));

describe("autocompletado mobile first", () => {
  it("navega con flechas, anuncia la opción activa y selecciona con Enter", async () => {
    const user = userEvent.setup();
    const seleccionar = vi.fn();
    render(<AutocompletarDireccion id="buscar" etiqueta="Dirección" placeholder="Calle" valor="Reforma" sugerencias={sugerencias} buscando={false} onChange={vi.fn()} onSeleccionar={seleccionar} />);
    const campo = screen.getByRole("combobox");
    await user.click(campo);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const opcion = screen.getByRole("option", { name: "Reforma 2" });
    expect(opcion).toHaveAttribute("aria-selected", "true");
    expect(campo).toHaveAttribute("aria-activedescendant", opcion.id);
    expect(opcion.querySelector("button")).toBeNull();
    await user.keyboard("{Enter}");
    expect(seleccionar).toHaveBeenCalledWith(sugerencias[1]);
    expect(campo).toHaveAttribute("aria-expanded", "false");
    expect(campo).toHaveFocus();
  });

  it("cierra con Escape sin seleccionar y anuncia la búsqueda", async () => {
    const user = userEvent.setup();
    const props = { id: "buscar", etiqueta: "Dirección", placeholder: "Calle", valor: "Reforma", sugerencias, onChange: vi.fn(), onSeleccionar: vi.fn() };
    const vista = render(<AutocompletarDireccion {...props} buscando={false} />);
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(props.onSeleccionar).not.toHaveBeenCalled();
    vista.rerender(<AutocompletarDireccion {...props} buscando />);
    expect(screen.getByRole("status")).toHaveTextContent("Buscando direcciones");
  });
});

describe("barra única del wizard", () => {
  it("mantiene Atrás y Continuar, y bloquea el pago hasta aceptar las políticas", async () => {
    const user = userEvent.setup();
    const props = { etiqueta: "Continuar al pago", onContinuar: vi.fn(), onAtras: vi.fn(), precio: "$1,200 MXN", desgloseId: "desglose" };
    const vista = render(<BarraAccionesTraslado {...props} deshabilitado ayuda="Acepta la política" />);
    await user.click(screen.getByRole("button", { name: "Continuar al pago" }));
    expect(props.onContinuar).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Ver desglose" })).toHaveAttribute("href", "#desglose");
    await user.click(screen.getByRole("button", { name: "Atrás" }));
    expect(props.onAtras).toHaveBeenCalledOnce();
    vista.rerender(<BarraAccionesTraslado {...props} />);
    await user.click(screen.getByRole("button", { name: "Continuar al pago" }));
    expect(props.onContinuar).toHaveBeenCalledOnce();
    vista.rerender(<BarraAccionesTraslado {...props} ocupado />);
    expect(screen.getByRole("button", { name: "Atrás" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continuar al pago" })).toBeDisabled();
  });
});
