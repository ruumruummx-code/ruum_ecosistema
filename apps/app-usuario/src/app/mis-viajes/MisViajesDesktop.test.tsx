/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

const mockPathname = vi.hoisted(() => "/mis-viajes");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

import { MisViajesDesktop } from "./MisViajesDesktop";
import type { ViajeLista } from "./useGestionTraslados";

function crearViajeMock(
  estado: string,
  id: string,
  marca = "Toyota",
  modelo = "Corolla",
  origen = "Polanco",
  destino = "Santa Fe, CDMX",
  monto = 500
): ViajeLista {
  return {
    pasaporte: {
      traslado_id: id,
      estado,
      vehiculo_marca: marca,
      vehiculo_modelo: modelo,
      vehiculo_anio: "2024",
      vehiculo_placas: "XYZ789",
      vehiculo_tipo: "sedan",
      conductor_nombre: "Juan Pérez",
      creado_en: "2026-10-25T10:30:00.000Z",
      monto_pagado: monto,
      distancia_km: 25,
      tiempo_estimado_horas: 1.5,
      origen_ciudad: origen,
      origen_direccion: "Calle 1",
      destino_ciudad: destino,
      destino_direccion: "Calle 2",
    },
    traslado: {
      id,
      origen_ciudad: origen,
      origen_direccion: "Calle 1",
      destino_ciudad: destino,
      destino_direccion: "Calle 2",
      fecha_hora_programada: "2026-10-25T10:30:00.000Z",
    },
  } as unknown as ViajeLista;
}

describe("MisViajesDesktop", () => {
  const trasladosMock: ViajeLista[] = [
    crearViajeMock("solicitud_creada", "t-1", "Nissan", "Versa", "Mi ubicación actual", "Aeropuerto Internacional CDMX", 366),
    crearViajeMock("servicio_cerrado", "t-2", "Toyota", "RAV4", "Polanco", "Santa Fe, CDMX", 500),
  ];

  it("renderiza la barra lateral con Traslados activo y tarjeta Confianza comprobable", () => {
    render(<MisViajesDesktop traslados={trasladosMock} nombreUsuario="Alex Rivera" />);

    const sidebar = screen.getByLabelText("Menú principal de escritorio");
    expect(sidebar).toBeInTheDocument();

    const linkTraslados = within(sidebar).getByRole("link", { name: /Traslados/i });
    expect(linkTraslados).toHaveAttribute("aria-current", "page");

    expect(within(sidebar).getByText("Confianza comprobable")).toBeInTheDocument();
    expect(
      within(sidebar).getByText("Un servicio confiable, seguro y en todo México."),
    ).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "+ Crear traslado" })).toHaveAttribute("href", "/viajes/nuevo");
  });

  it("renderiza la barra superior con buscador, alertas y perfil", () => {
    render(<MisViajesDesktop traslados={trasladosMock} nombreUsuario="Alex Rivera" />);

    const header = screen.getByLabelText("Barra superior de usuario");
    expect(header).toBeInTheDocument();

    expect(within(header).getByPlaceholderText("Buscar traslados, vehículos o documentos...")).toBeInTheDocument();
    expect(within(header).getByText("Hola, Alex")).toBeInTheDocument();
  });

  it("renderiza el hero banner superior con lema y características", () => {
    render(<MisViajesDesktop traslados={trasladosMock} nombreUsuario="Alex Rivera" />);

    expect(screen.getByRole("heading", { name: /Mueve tu auto sin soltar el control/i })).toBeInTheDocument();
    expect(screen.getByText("Traslados seguros, rápidos y a tu medida.")).toBeInTheDocument();
    expect(screen.getByText("Seguro")).toBeInTheDocument();
    expect(screen.getByText("Rápido")).toBeInTheDocument();
    expect(screen.getByText("A tu ritmo")).toBeInTheDocument();
    expect(screen.getByText("Tu próximo destino te espera")).toBeInTheDocument();
  });

  it("renderiza las 3 tarjetas de métricas rápidas (KPIs)", () => {
    render(<MisViajesDesktop traslados={trasladosMock} nombreUsuario="Alex Rivera" />);

    expect(screen.getByText("Total de traslados")).toBeInTheDocument();
    expect(screen.getAllByText("En curso").length).toBeGreaterThan(0);
    expect(screen.getByText("Gasto acumulado")).toBeInTheDocument();
    expect(screen.getByText("$866")).toBeInTheDocument();
  });

  it("renderiza la barra de filtros y búsqueda", () => {
    render(<MisViajesDesktop traslados={trasladosMock} nombreUsuario="Alex Rivera" />);

    expect(
      screen.getByPlaceholderText("Buscar por vehículo, destino o fecha"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por fecha")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por estado")).toBeInTheDocument();
    expect(screen.getByText("Más filtros")).toBeInTheDocument();
  });

  it("renderiza las pestañas de estado con sus contadores y permite filtrar", () => {
    render(<MisViajesDesktop traslados={trasladosMock} nombreUsuario="Alex Rivera" />);

    const tablist = screen.getByRole("tablist", { name: "Filtrar por estado del traslado" });
    expect(within(tablist).getByRole("tab", { name: "Todos (2)" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "En curso (0)" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Programados (1)" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Finalizados (1)" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Cancelados (0)" })).toBeInTheDocument();

    // Click en pestaña Programados
    const tabProgramados = within(tablist).getByRole("tab", { name: "Programados (1)" });
    fireEvent.click(tabProgramados);

    expect(tabProgramados).toHaveAttribute("aria-selected", "true");
  });

  it("renderiza los widgets laterales de mapa y sugerencias", () => {
    render(<MisViajesDesktop traslados={trasladosMock} nombreUsuario="Alex Rivera" />);

    // Widget de mapa
    expect(screen.getByText("Tus traslados, en tiempo real")).toBeInTheDocument();
    expect(
      screen.getByText("Sigue cada etapa de tu viaje desde cualquier dispositivo."),
    ).toBeInTheDocument();

    // Widget de sugerencias
    expect(screen.getByText("Haz que cada traslado cuente")).toBeInTheDocument();
    expect(
      screen.getByText("Programa, guarda favoritos y viaja más inteligente."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear traslado" })).toHaveAttribute("href", "/viajes/nuevo");
  });

  it("renderiza las 3 columnas de acciones rápidas y el pie de página global", () => {
    render(<MisViajesDesktop traslados={trasladosMock} nombreUsuario="Alex Rivera" />);

    expect(screen.getByText("Programa tus viajes")).toBeInTheDocument();
    expect(screen.getByText("Agenda hoy tus próximos destinos.")).toBeInTheDocument();

    expect(screen.getByText("Gestiona tus rutas")).toBeInTheDocument();
    expect(screen.getByText("Edita, duplica o guarda favoritos.")).toBeInTheDocument();

    expect(screen.getByText("Lleva un mejor control")).toBeInTheDocument();
    expect(screen.getByText("Visualiza tu historial y gastos.")).toBeInTheDocument();

    // Footer de marca
    expect(screen.getByText("Tu movilidad, nuestra prioridad.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Ayuda" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Términos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacidad" })).toBeInTheDocument();
  });
});
