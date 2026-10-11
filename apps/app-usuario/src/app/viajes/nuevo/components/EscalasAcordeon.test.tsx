/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EscalasAcordeon } from "./EscalasAcordeon";
import type { ParadaForm, TipoParadaForm } from "../types";

const sugerirDireccionesMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mapbox", () => ({
  sugerirDireccionesAutocomplete: sugerirDireccionesMock,
}));

function FormularioParadas() {
  const [paradas, setParadas] = useState<ParadaForm[]>([]);
  return <EscalasAcordeon paradas={paradas} onChange={setParadas} />;
}

function FormularioConParadas() {
  const [paradas, setParadas] = useState<ParadaForm[]>([parada("p1")]);
  return <EscalasAcordeon paradas={paradas} onChange={setParadas} />;
}

describe("EscalasAcordeon", () => {
  it("agrega una parada desde una sola acción y elimina campos operativos", async () => {
    const user = userEvent.setup();
    render(<FormularioParadas />);

    await user.click(screen.getByRole("button", { name: "Agregar escala o tarea" }));
    await user.click(screen.getByRole("radio", { name: "Tarea" }));

    expect(screen.getByRole("combobox", { name: "Buscar dirección de parada 1" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Tipo de tarea" })).toBeInTheDocument();
    expect(screen.queryByText(/Contacto \(nombre\)|Teléfono contacto|Instrucciones tarea|Tiempo espera|Requiere foto\/evidencia/i)).not.toBeInTheDocument();
  });

  it("autocompleta la dirección de la parada hasta calle", async () => {
    const user = userEvent.setup();
    sugerirDireccionesMock.mockResolvedValue([
      {
        textoCompleto: "Av. Reforma 120, Juárez, CDMX",
        direccion: "Av. Reforma",
        colonia: "Juárez",
        codigoPostal: "06600",
        ciudad: "Ciudad de México",
        estado: "CDMX",
        lat: 19.427,
        lng: -99.167,
      },
    ]);
    render(<FormularioParadas />);

    await user.click(screen.getByRole("button", { name: "Agregar escala o tarea" }));
    const busqueda = screen.getByRole("combobox", { name: "Buscar dirección de parada 1" });
    await user.type(busqueda, "Reforma");

    const sugerencia = await screen.findByRole("button", { name: "Av. Reforma 120, Juárez, CDMX" });
    await user.click(sugerencia);

    expect(screen.getByLabelText("Calle")).toHaveValue("Av. Reforma");
    expect(screen.getByLabelText("Colonia")).toHaveValue("Juárez");
    expect(screen.getByLabelText("Código Postal")).toHaveValue("06600");
    expect(screen.getByLabelText("Número")).toHaveValue("");
  });

  it("propaga la edición de un campo al padre", async () => {
    const user = userEvent.setup();
    render(<FormularioConParadas />);

    await user.type(screen.getByLabelText("Calle"), "Av. Universidad");

    expect(screen.getByLabelText("Calle")).toHaveValue("Av. Universidad");
  });

  it("normaliza el código postal a 5 dígitos", async () => {
    const user = userEvent.setup();
    render(<FormularioParadas />);
    await user.click(screen.getByRole("button", { name: "Agregar escala o tarea" }));

    await user.type(screen.getByLabelText("Código Postal"), "06a600xyz9");

    expect(screen.getByLabelText("Código Postal")).toHaveValue("06600");
  });

  it("reordena paradas con subir y bajar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <EscalasAcordeon
        paradas={[parada("p1", "Escala"), parada("p2", "Escala")]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "↓ Bajar", hidden: true }).closest("button")!);

    // La primera parada baja a la segunda posición.
    const ultima = onChange.mock.calls.at(-1)?.[0] as ParadaForm[];
    expect(ultima.map((p) => p.id)).toEqual(["p2", "p1"]);
  });

  it("deshabilita subir en la primera y bajar en la última", async () => {
    const user = userEvent.setup();
    render(
      <EscalasAcordeon paradas={[parada("p1"), parada("p2")]} onChange={vi.fn()} />,
    );

    // El acordeón es de apertura única: la primera parada ya viene abierta.
    expect(screen.getByRole("button", { name: "↑ Subir" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "↓ Bajar" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /📍 Escala #2/ }));
    expect(screen.getByRole("button", { name: "↑ Subir" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "↓ Bajar" })).toBeDisabled();
  });

  it("elimina la parada y avisa al padre", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <EscalasAcordeon paradas={[parada("p1"), parada("p2")]} onChange={onChange} />,
    );

    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ id: "p2" })]);
  });

  it("abre y cierra el acordeón de la parada", async () => {
    const user = userEvent.setup();
    render(<FormularioParadas />);
    await user.click(screen.getByRole("button", { name: "Agregar escala o tarea" }));

    expect(screen.getByRole("button", { name: /📍 Escala #1/ })).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: /📍 Escala #1/ }));
    expect(screen.getByRole("button", { name: /📍 Escala #1/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("no consulta el autocompletado con menos de 3 caracteres", async () => {
    const user = userEvent.setup();
    sugerirDireccionesMock.mockClear();
    render(<FormularioParadas />);
    await user.click(screen.getByRole("button", { name: "Agregar escala o tarea" }));

    await user.type(screen.getByRole("combobox", { name: "Buscar dirección de parada 1" }), "Re");

    expect(sugerirDireccionesMock).not.toHaveBeenCalled();
  });

  it("marca la parada con errores y muestra el detalle del campo", () => {
    render(
      <EscalasAcordeon
        paradas={[parada("p1")]}
        onChange={vi.fn()}
        erroresParadas={[{ calle: "La calle es obligatoria" }]}
      />,
    );

    // La primera parada ya viene abierta: el detalle se ve sin interacción.
    expect(screen.getByLabelText("con errores")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("La calle es obligatoria");
    expect(screen.getByLabelText("Calle")).toHaveAttribute("aria-invalid", "true");
  });

  it("bloquea el alta al alcanzar las 8 paradas", async () => {
    const user = userEvent.setup();
    const ocho = Array.from({ length: 8 }, (_, i) => parada(`p${i}`));
    const onChange = vi.fn();
    render(<EscalasAcordeon paradas={ocho} onChange={onChange} />);

    const boton = screen.getByRole("button", { name: "Agregar escala o tarea" });
    expect(boton).toBeDisabled();
    await user.click(boton);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Máximo 8 escalas\/tareas alcanzado/)).toBeInTheDocument();
  });
});

function parada(id: string, tipo: TipoParadaForm = "escala"): ParadaForm {  return {
    id,
    tipo,
    calle: "",
    numero: "",
    colonia: "",
    codigoPostal: "",
    estado: "",
    ciudad: "",
    referencias: "",
  };
}
