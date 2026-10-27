/** @vitest-environment jsdom */
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, act } from "@testing-library/react";

const refreshMock = vi.hoisted(() => vi.fn());
const mockPathname = vi.hoisted(() => "/mis-viajes");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: refreshMock,
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

afterEach(() => vi.useRealTimers());
describe("MisViajesDesktop", () => {
  it("actualiza al recuperar el foco y periódicamente; elimina el temporizador al salir", () => {
    vi.useFakeTimers();
    refreshMock.mockClear();
    const { unmount } = render(<MisViajesDesktop traslados={[]} />);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(refreshMock).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(30000));
    expect(refreshMock).toHaveBeenCalledTimes(2);
    unmount();
    act(() => vi.advanceTimersByTime(30000));
    expect(refreshMock).toHaveBeenCalledTimes(2);
  });
  it("permite cambiar de pestaña con teclado", () => {
    render(<MisViajesDesktop traslados={[]} />);
    const todos = screen.getByRole("tab", { name: "Todos (0)" });
    fireEvent.keyDown(todos, { key: "ArrowRight" });
    const activos = screen.getByRole("tab", { name: "En curso (0)" });
    expect(activos).toHaveAttribute("aria-selected", "true");
    expect(activos).toHaveFocus();
    expect(screen.getByLabelText("Filtrar por estado")).toHaveValue("activos");
  });
  it("no recupera todos los registros cuando una pestaña está vacía", () => {
    render(<MisViajesDesktop traslados={[crearViajeMock("servicio_cerrado", "cerrado")]} />);
    fireEvent.click(screen.getByRole("tab", { name: "En curso (0)" }));
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByText("Mostrando 0 de 1 traslados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
  it("mantiene búsqueda sin resultados y sincroniza el filtro de estado con las pestañas", async () => {
    render(<MisViajesDesktop traslados={[crearViajeMock("traslado_en_curso", "activo")]} />);
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "cancelados" } });
    expect(screen.getByRole("tab", { name: "Cancelados (0)" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    fireEvent.change(screen.getByLabelText("Buscar por vehículo, placas, folio o destino"), { target: { value: "inexistente" } });
    await waitFor(() => expect(screen.queryByRole("article")).not.toBeInTheDocument());
    expect(screen.getByText("Mostrando 0 de 1 traslados")).toBeInTheDocument();
  });
  it("usa el vehículo y estado reales para todas las posiciones y dirige al seguimiento", () => {
    render(<MisViajesDesktop traslados={[crearViajeMock("traslado_en_curso", "activo"), crearViajeMock("servicio_cancelado", "cancelado", "Honda", "Civic")]} />);
    const filas = screen.getAllByRole("article");
    expect(within(filas[0]).getByText("Toyota Corolla 2024")).toBeInTheDocument();
    expect(within(filas[0]).getByText("En camino a destino")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Cancelado")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Honda Civic 2024")).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: "Ver detalles" })).toHaveAttribute("href", "/viajes/cancelado");
    expect(screen.getByRole("link", { name: "Abrir seguimiento del traslado activo" })).toHaveAttribute("href", "/viajes/activo");
    expect(screen.queryByText(/pasajeros/)).not.toBeInTheDocument();
  });
  it("no inventa cantidades en una cuenta vacía", () => {
    render(<MisViajesDesktop traslados={[]} />);
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.queryByText("$866")).not.toBeInTheDocument();
    expect(screen.getByText("Aún no tienes traslados registrados")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 0 de 0 traslados")).toBeInTheDocument();
  });
  it("abre filtros por tipo y excluye vehículos que no coinciden", () => {
    const suv = crearViajeMock("solicitud_creada", "suv", "Honda", "CRV");
    suv.pasaporte.vehiculo_tipo = "suv";
    render(<MisViajesDesktop traslados={[crearViajeMock("solicitud_creada", "sedan"), suv]} />);
    fireEvent.click(screen.getByRole("button", { name: "Más filtros" }));
    fireEvent.change(screen.getByLabelText("Tipo de vehículo"), { target: { value: "Sedán" } });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.queryByText("Honda CRV 2024")).not.toBeInTheDocument();
  });
  it("aplica una nueva búsqueda inicial al navegar desde el buscador global", () => {
    const lista = [crearViajeMock("servicio_cerrado", "a", "Honda"), crearViajeMock("servicio_cerrado", "b", "Nissan")];
    const { rerender } = render(<MisViajesDesktop traslados={lista} busquedaInicial="Honda" />);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    rerender(<MisViajesDesktop traslados={lista} busquedaInicial="Nissan" />);
    expect(screen.getByText("Nissan Corolla 2024")).toBeInTheDocument();
    expect(screen.queryByText("Honda Corolla 2024")).not.toBeInTheDocument();
  });
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
      screen.getByPlaceholderText("Buscar por vehículo, placas, folio o destino"),
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
    expect(screen.getByText("Seguimiento de tus traslados")).toBeInTheDocument();
    expect(
      screen.getByText("Consulta la ubicación y las evidencias disponibles desde el detalle del servicio."),
    ).toBeInTheDocument();

    // Widget de sugerencias
    expect(screen.getByText("Haz que cada traslado cuente")).toBeInTheDocument();
    expect(
      screen.getByText("Consulta tus servicios y registra tu próximo traslado."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear traslado" })).toHaveAttribute("href", "/viajes/nuevo");
  });

  it("renderiza las 3 columnas de acciones rápidas y el pie de página global", () => {
    render(<MisViajesDesktop traslados={trasladosMock} nombreUsuario="Alex Rivera" />);

    expect(screen.getByText("Programa tus viajes")).toBeInTheDocument();
    expect(screen.getByText("Agenda hoy tus próximos destinos.")).toBeInTheDocument();

    expect(screen.getByText("Mis ubicaciones")).toBeInTheDocument();
    expect(screen.getByText("Administra tus direcciones guardadas.")).toBeInTheDocument();

    expect(screen.getByText("Consulta tu facturación")).toBeInTheDocument();
    expect(screen.getByText("Revisa tus pagos y datos de facturación.")).toBeInTheDocument();

    // Footer de marca
    expect(screen.getByText("Tu movilidad, nuestra prioridad.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Ayuda" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Términos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacidad" })).toBeInTheDocument();
  });
});
