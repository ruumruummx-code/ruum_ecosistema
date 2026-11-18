/** @vitest-environment jsdom */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
const obtenerFoto = vi.hoisted(() => vi.fn().mockResolvedValue(null));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push, replace: vi.fn() }),
  usePathname: () => "/mis-viajes",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@ruum/api/drivers", () => ({ obtenerFotoPerfilConductor: obtenerFoto }));
vi.mock("../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}),
  tieneSupabaseConfigurado: () => true,
}));
vi.mock("../dashboard/useDashboardTracking", () => ({
  useDashboardTracking: () => ({ ubicacion: null, actualizado: null, error: false }),
}));

import { MisTraslados, POR_PAGINA } from "./MisTraslados";
import type { ViajeLista } from "./useGestionTraslados";

function viaje(estado: string, id = "t-1", marca = "Nissan", modelo = "Versa"): ViajeLista {
  return {
    pasaporte: {
      traslado_id: id,
      estado,
      vehiculo_marca: marca,
      vehiculo_modelo: modelo,
      vehiculo_anio: 2020,
      vehiculo_placas: `P-${id}`,
      vehiculo_tipo: "sedan",
      conductor_nombre: `Conductor ${id}`,
      conductor_id: id,
      conductor_estado: "activo",
      creado_en: "2026-01-01T00:00:00.000Z",
      monto_pagado: 0,
      distancia_km: null,
      tiempo_estimado_horas: null,
      origen_ciudad: "CDMX",
      origen_direccion: `Origen ${id}`,
      destino_ciudad: "Toluca",
      destino_direccion: `Destino ${id}`,
    },
    traslado: {
      id,
      origen_ciudad: "CDMX",
      destino_ciudad: "Toluca",
      origen_direccion: `Origen ${id}`,
      destino_direccion: `Destino ${id}`,
      fecha_hora_programada: null,
    },
  } as unknown as ViajeLista;
}

function simularAncho(escritorio: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: escritorio,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  push.mockClear();
  simularAncho(false);
});

describe("MisTraslados (móvil)", () => {
  it("estado vacío con una sola acción para crear traslado", () => {
    render(<MisTraslados traslados={[]} autoActualizar={false} />);
    expect(screen.getByText("Aún no tienes traslados")).toBeInTheDocument();
    const crear = screen.getAllByRole("link", { name: "Crear traslado" });
    expect(crear).toHaveLength(1);
    expect(crear[0]).toHaveAttribute("href", "/viajes/nuevo");
  });

  it("resume total, en curso y gasto confirmado", () => {
    const cerrado = viaje("servicio_cerrado", "cerrado");
    cerrado.pasaporte.monto_pagado = 229000;
    render(
      <MisTraslados
        traslados={[viaje("solicitud_creada"), viaje("traslado_en_curso", "activo"), cerrado]}
        autoActualizar={false}
      />,
    );
    const resumen = screen.getByLabelText("Resumen de traslados");
    expect([...resumen.querySelectorAll("dt")].map((el) => el.textContent)).toEqual(["Total", "En curso", "Gastado"]);
    expect(within(resumen).getByText("$229k")).toBeInTheDocument();
    expect(within(resumen).getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Programados/ })).toHaveTextContent("1");
  });

  it("busca, muestra resultado vacío y limpia filtros", async () => {
    const user = userEvent.setup();
    render(<MisTraslados traslados={[viaje("traslado_en_curso")]} autoActualizar={false} />);
    const buscador = screen.getByRole("searchbox", { name: "Buscar traslado" });
    await user.type(buscador, "inexistente");
    expect(await screen.findByText("No se encontraron traslados")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(await screen.findByRole("heading", { name: /Nissan Versa 2020/ })).toBeInTheDocument();
  });

  it("filtra por tipo de vehículo desde la hoja inferior", async () => {
    const user = userEvent.setup();
    const suv = viaje("traslado_en_curso", "suv", "Toyota", "RAV4");
    suv.pasaporte.vehiculo_tipo = "suv";
    render(<MisTraslados traslados={[viaje("traslado_en_curso"), suv]} autoActualizar={false} />);
    await user.click(screen.getByRole("button", { name: "Más filtros" }));
    const hoja = screen.getByRole("dialog", { name: "Filtrar traslados" });
    await user.selectOptions(within(hoja).getByLabelText("Tipo de vehículo"), "Sedán");
    await user.click(within(hoja).getByRole("button", { name: "Ver 1 traslado" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /filtro activo: Sedán/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Toyota RAV4/ })).not.toBeInTheDocument();
  });

  it("navega las categorías con teclado", async () => {
    const user = userEvent.setup();
    render(<MisTraslados traslados={[viaje("servicio_cerrado", "t-2", "Toyota", "Corolla")]} autoActualizar={false} />);
    screen.getByRole("button", { name: /^Todos/ }).focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: /^Cancelados/ })).toHaveFocus();
    expect(screen.getByRole("button", { name: /^Cancelados/ })).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: /^Completados/ })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByRole("heading", { name: /Toyota Corolla 2020/ })).toBeInTheDocument();
  });

  it("en móvil la tarjeta abre el expediente y no hay panel lateral", async () => {
    const user = userEvent.setup();
    render(<MisTraslados traslados={[viaje("traslado_en_curso", "abc")]} autoActualizar={false} />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver Nissan Versa 2020" }));
    expect(push).toHaveBeenCalledWith("/viajes/abc");
    expect(screen.getByRole("link", { name: "Pasaporte" })).toHaveAttribute("href", "/viajes/abc");
  });

  it("pagina de ocho en ocho", () => {
    render(<MisTraslados traslados={Array.from({ length: 11 }, (_, i) => viaje("traslado_en_curso", `v${i}`))} autoActualizar={false} />);
    expect(screen.getAllByRole("article")).toHaveLength(POR_PAGINA);
    expect(screen.getByText("Mostrando 1–8 de 11 traslados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByText("Mostrando 9–11 de 11 traslados")).toBeInTheDocument();
  });

  it("refresca periódicamente y al recuperar el foco, y limpia el temporizador", () => {
    vi.useFakeTimers();
    refresh.mockClear();
    const { unmount } = render(<MisTraslados traslados={[]} />);
    act(() => window.dispatchEvent(new Event("focus")));
    act(() => vi.advanceTimersByTime(30000));
    expect(refresh).toHaveBeenCalledTimes(2);
    unmount();
    act(() => vi.advanceTimersByTime(30000));
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});

describe("MisTraslados (escritorio ≥1280px)", () => {
  it("abre el panel del primer traslado y lo sincroniza con la selección", async () => {
    simularAncho(true);
    render(
      <MisTraslados
        traslados={[viaje("traslado_en_curso", "uno", "Toyota", "Corolla"), viaje("solicitud_creada", "dos", "Honda", "Civic")]}
        autoActualizar={false}
      />,
    );
    expect(screen.getByRole("complementary", { name: "Detalle de Toyota Corolla 2020" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver Honda Civic 2020" }));
    const panel = screen.getByRole("complementary", { name: "Detalle de Honda Civic 2020" });
    expect(push).not.toHaveBeenCalled();
    expect(within(panel).getByText("Origen dos")).toBeInTheDocument();
    expect(within(panel).getByText("Conductor dos")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(within(panel).getByRole("tab", { name: "Detalles" }));
    expect(within(panel).getByText("Destino dos")).toBeInTheDocument();
    await user.click(within(panel).getByRole("tab", { name: "Historial" }));
    expect(within(panel).getByText("Solicitud registrada")).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "Cerrar detalle" }));
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("descarta la foto del conductor de una selección anterior", async () => {
    simularAncho(true);
    let resolver: (url: string) => void = () => {};
    obtenerFoto.mockImplementationOnce(() => new Promise<string>((r) => { resolver = r; }));
    obtenerFoto.mockResolvedValueOnce("https://ejemplo.com/dos.png");
    render(
      <MisTraslados
        traslados={[viaje("traslado_en_curso", "uno", "Toyota", "Corolla"), viaje("solicitud_creada", "dos", "Honda", "Civic")]}
        autoActualizar={false}
      />,
    );
    await waitFor(() => expect(obtenerFoto).toHaveBeenCalledWith({}, "uno"));
    fireEvent.click(screen.getByRole("button", { name: "Ver Honda Civic 2020" }));
    await waitFor(() => expect(screen.getByAltText("Foto de Conductor dos")).toHaveAttribute("src", "https://ejemplo.com/dos.png"));
    await act(async () => resolver("https://ejemplo.com/uno.png"));
    expect(screen.queryByAltText("Foto de Conductor uno")).not.toBeInTheDocument();
  });

  it("filtra por fecha y tipo sin abrir la hoja", () => {
    simularAncho(true);
    render(<MisTraslados traslados={[viaje("traslado_en_curso")]} autoActualizar={false} />);
    const fecha = screen.getAllByLabelText("Fecha").find((el) => el.closest("dialog") === null)!;
    fireEvent.change(fecha, { target: { value: "hoy" } });
    expect(screen.getByText("No se encontraron traslados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByRole("complementary", { name: "Detalle de Nissan Versa 2020" })).toBeInTheDocument();
  });
});
