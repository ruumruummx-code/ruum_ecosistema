/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Database } from "@ruum/shared/types";
import { InicioUsuario } from "./InicioUsuario";

vi.mock("@ruum/api/services", () => ({
  crearLlamadaEnmascarada: vi.fn(),
}));

vi.mock("../lib/supabase-browser", () => ({
  crearClienteNavegador: vi.fn(),
  tieneSupabaseConfigurado: vi.fn(() => true),
}));

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];

describe("InicioUsuario", () => {
  it.each([['pago_pendiente', 'Pendiente de pago'], ['solicitud_creada', 'Solicitud recibida'], ['documentacion_pendiente', 'En preparación']])("muestra el estado real %s sin anunciar movimiento", (estado, etiqueta) => {
    render(<InicioUsuario usuario={null} traslados={[{ traslado_id: "activo", estado, creado_en: "2026-10-13" } as unknown as PasaporteRow]} />);
    const tarjeta = screen.getByRole("region", { name: "Traslado Activo #ACTIVO" });
    expect(within(tarjeta).getAllByText(etiqueta).length).toBeGreaterThan(0);
    expect(within(tarjeta).queryByText("En camino")).toBeNull();
    expect(within(tarjeta).queryByRole("progressbar")).toBeNull();
  });
  it("incluye el contacto del conductor en el traslado activo antes de las acciones rápidas", () => {
    const traslado = {
      traslado_id: "traslado-1",
      estado: "conductor_asignado",
      creado_en: "2026-09-07T12:00:00.000Z",
      conductor_id: "conductor-1",
      conductor_nombre: "Ana López",
      vehiculo_marca: "Toyota",
      vehiculo_modelo: "Corolla",
      vehiculo_anio: 2024,
      vehiculo_placas: "ABC123D",
    } as unknown as PasaporteRow;

    render(
      <InicioUsuario
        usuario={{ nombre: "Luis Hernández" } as Database["public"]["Tables"]["usuarios"]["Row"]}
        traslados={[traslado]}
      />,
    );

    const acciones = screen.getByRole("region", { name: "Acciones rápidas" });
    const comunicacion = screen.getByRole("region", { name: "Conductor asignado" });
    const tarjetaActiva = screen.getByRole("region", { name: "Traslado Activo #TRASLADO" });

    expect(comunicacion).toBeInTheDocument();
    expect(screen.getByText("Ana López")).toBeInTheDocument();
    expect(within(tarjetaActiva).getByRole("heading", { name: "Traslado Activo #TRASLADO" })).toBeInTheDocument();
    expect(within(tarjetaActiva).getByText("Toyota Corolla 2024")).toBeInTheDocument();
    expect(within(tarjetaActiva).getByText("Placas ABC123D")).toBeInTheDocument();
    expect(within(tarjetaActiva).getAllByText("Conductor asignado").length).toBeGreaterThan(0);
    expect(within(tarjetaActiva).getByRole("region", { name: "Conductor asignado" })).toBe(comunicacion);
    expect(within(tarjetaActiva).getByText("Etapa 3 de 7: Conductor asignado")).toBeInTheDocument();
    expect(within(tarjetaActiva).queryByRole("progressbar")).toBeNull();
    expect(screen.getByRole("link", { name: "Abrir chat con Ana López" })).toHaveAttribute(
      "href",
      "/viajes/traslado-1#chat-conductor",
    );
    expect(comunicacion.compareDocumentPosition(acciones) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText("Reportar incidencia")).not.toBeInTheDocument();
  });

  it("no muestra el módulo de comunicación sin conductor asignado", () => {
    const traslado = {
      traslado_id: "traslado-2",
      estado: "pendiente_de_conductor",
      creado_en: "2026-09-07T12:00:00.000Z",
      conductor_id: null,
      conductor_nombre: null,
    } as unknown as PasaporteRow;

    render(<InicioUsuario usuario={null} traslados={[traslado]} />);

    expect(screen.queryByRole("region", { name: "Conductor asignado" })).not.toBeInTheDocument();
  });

  it("renderiza acciones rápidas con Mis vehículos y Pasaporte digital", () => {
    const traslado = {
      traslado_id: "traslado-abc",
      estado: "servicio_cerrado",
      creado_en: "2026-09-07T12:00:00.000Z",
    } as unknown as PasaporteRow;

    render(<InicioUsuario usuario={null} traslados={[traslado]} />);

    const linkVehiculos = screen.getByRole("link", { name: /Mis vehículos/i });
    expect(linkVehiculos).toHaveAttribute("href", "/cuenta/vehiculos");

    const linkPasaporte = screen.getByRole("link", { name: /Abrir pasaporte digital/i });
    expect(linkPasaporte).toHaveAttribute("href", "/viajes/traslado-abc");
    expect(within(linkPasaporte).getByText("Pasaporte")).toBeInTheDocument();
  });
});
