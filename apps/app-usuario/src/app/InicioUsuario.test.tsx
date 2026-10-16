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
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];

describe("InicioUsuario", () => {
  it("muestra el mensaje solicitado cuando no hay traslado activo", () => {
    render(<InicioUsuario usuario={null} traslados={[]} />);
    expect(screen.getByText("No tienes traslados activos")).toBeInTheDocument();
    expect(screen.getByText("Solicita tu primer traslado y sigue cada etapa en tiempo real con evidencia fotográfica.")).toBeInTheDocument();
  });

  it.each([
    ["pago_pendiente", "Pendiente de pago"],
    ["solicitud_creada", "Solicitud recibida"],
    ["documentacion_pendiente", "En preparación"],
  ])("muestra el estado real %s sin anunciar movimiento", (estado, etiqueta) => {
    render(
      <InicioUsuario
        usuario={null}
        traslados={[{ traslado_id: "activo", estado, creado_en: "2026-10-13" } as unknown as PasaporteRow]}
      />,
    );
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
    expect(within(comunicacion).getByRole("link", { name: /Evidencia: Evidencia pendiente/ })).toHaveAttribute("href", "/viajes/traslado-1#evidencia");
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

    const vehiculosMock = [
      { id: "v1", marca: "Mazda", modelo: "3", anio: 2022 } as unknown as VehiculoRow,
      { id: "v2", marca: "Toyota", modelo: "Yaris", anio: 2021 } as unknown as VehiculoRow,
    ];

    render(<InicioUsuario usuario={null} traslados={[traslado]} vehiculos={vehiculosMock} />);

    const linkVehiculos = screen.getByRole("link", { name: /Mis veh[ií]culos/i });
    expect(linkVehiculos).toHaveAttribute("href", "/cuenta/vehiculos");
    expect(within(linkVehiculos).getByText("2 registrados")).toBeInTheDocument();

    const linkPasaporte = screen.getByRole("link", { name: /Abrir pasaporte digital/i });
    expect(linkPasaporte).toHaveAttribute("href", "/viajes/traslado-abc");
    expect(within(linkPasaporte).getByText("Pasaporte")).toBeInTheDocument();
    expect(within(linkPasaporte).getByText("Digital")).toBeInTheDocument();
  });

  it("muestra el saludo, traslados recientes y banner de soporte", () => {
    const trasladoActivo = {
      traslado_id: "activo-123",
      estado: "traslado_en_curso",
      creado_en: "2026-10-14T10:00:00.000Z",
      vehiculo_marca: "Toyota",
      vehiculo_modelo: "Corolla",
      vehiculo_anio: 2021,
      origen_ciudad: "CDMX, Roma Norte",
      destino_ciudad: "Guadalajara, Zapopan",
      conductor_nombre: "Carlos Mendoza",
      tiempo_estimado_horas: 3.5,
    } as unknown as PasaporteRow;

    const trasladoReciente1 = {
      traslado_id: "reciente-1",
      estado: "servicio_confirmado",
      creado_en: "2026-10-13T09:00:00.000Z",
      vehiculo_marca: "Honda",
      vehiculo_modelo: "CR-V",
      vehiculo_anio: 2022,
      origen_ciudad: "Monterrey",
      destino_ciudad: "Saltillo",
    } as unknown as PasaporteRow;

    const trasladoReciente2 = {
      traslado_id: "reciente-2",
      estado: "servicio_cerrado",
      creado_en: "2026-10-12T08:00:00.000Z",
      vehiculo_marca: "Nissan",
      vehiculo_modelo: "Versa",
      vehiculo_anio: 2020,
      origen_ciudad: "CDMX",
      destino_ciudad: "Puebla",
    } as unknown as PasaporteRow;

    render(
      <InicioUsuario
        usuario={{ nombre: "Carlos Mendoza" } as Database["public"]["Tables"]["usuarios"]["Row"]}
        traslados={[trasladoActivo, trasladoReciente1, trasladoReciente2]}
      />,
    );

    // Saludo y contexto
    expect(screen.getByText(/Hola, Carlos/i)).toBeInTheDocument();
    expect(screen.queryByText("¿A dónde movemos tu auto hoy?")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notificaciones" })).toHaveAttribute("href", "/mis-viajes");

    // Tarjeta activa
    expect(screen.getByText("TRASLADO ACTIVO")).toBeInTheDocument();
    expect(screen.getByText("Toyota Corolla 2021")).toBeInTheDocument();
    expect(screen.getByText(/CDMX, Roma Norte/)).toBeInTheDocument();
    expect(screen.getByText(/Guadalajara, Zapopan/)).toBeInTheDocument();
    expect(screen.getByText("Carlos M.")).toBeInTheDocument();
    expect(screen.getByText("En camino")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Evidencia: Evidencia pendiente/ })).toHaveAttribute("href", "/viajes/activo-123#evidencia");
    expect(screen.getByText("Evidencia fotográfica · Seguimiento en tiempo real")).toBeInTheDocument();

    // El CTA universal lo proporciona NavegacionUsuario.
    expect(screen.queryByRole("link", { name: /Solicitar traslado/i })).not.toBeInTheDocument();

    // Traslados recientes
    expect(screen.getByRole("region", { name: "Carrusel de traslados recientes" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Traslados recientes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver todos/i })).toHaveAttribute("href", "/mis-viajes");
    expect(screen.getByText("Honda CR-V 2022")).toBeInTheDocument();
    expect(screen.getByText("Monterrey → Saltillo")).toBeInTheDocument();
    expect(screen.getByText("Programado")).toBeInTheDocument();
    expect(screen.getByText("Nissan Versa 2020")).toBeInTheDocument();
    expect(screen.getByText("CDMX → Puebla")).toBeInTheDocument();
    expect(screen.getByText("Finalizado")).toBeInTheDocument();

    // Soporte
    const soporte = screen.getByRole("link", { name: /¿Necesitas ayuda\? Soporte 24\/7/i });
    expect(soporte).toHaveAttribute("href", "/soporte");
  });
});
