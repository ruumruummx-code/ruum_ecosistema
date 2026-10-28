/** @vitest-environment jsdom */
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
const refresh = vi.hoisted(() => vi.fn());
const obtenerFoto = vi.hoisted(() => vi.fn().mockResolvedValue(null));
vi.mock("@ruum/api/drivers", () => ({
  obtenerFotoPerfilConductor: obtenerFoto,
}));
vi.mock("../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}),
  tieneSupabaseConfigurado: () => true,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/mis-viajes",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../dashboard/useDashboardTracking", () => ({
  useDashboardTracking: () => ({
    ubicacion: null,
    actualizado: null,
    error: false,
  }),
}));
import { MisViajesDesktop } from "./MisViajesDesktop";
import type { ViajeLista } from "./useGestionTraslados";
function viaje(
  id: string,
  estado = "traslado_en_curso",
  marca = "Toyota",
): ViajeLista {
  return {
    pasaporte: {
      traslado_id: id,
      estado,
      vehiculo_marca: marca,
      vehiculo_modelo: "Corolla",
      vehiculo_anio: 2024,
      vehiculo_placas: id,
      vehiculo_tipo: "sedan",
      origen_ciudad: "Toluca",
      destino_ciudad: "Lerma",
      origen_direccion: `Origen ${id}`,
      destino_direccion: `Destino ${id}`,
      conductor_nombre: `Conductor ${id}`,
      conductor_id: id,
      conductor_estado: "activo",
      conductor_calificacion: 4.9,
      creado_en: "2026-10-25T10:30:00Z",
    },
    traslado: {
      id,
      origen_ciudad: "Toluca",
      destino_ciudad: "Lerma",
      origen_direccion: `Origen ${id}`,
      destino_direccion: `Destino ${id}`,
      fecha_hora_programada: "2026-10-25T10:30:00Z",
    },
  } as unknown as ViajeLista;
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("Mis traslados desktop", () => {
  it("carga la foto autorizada del conductor y descarta respuestas del panel anterior", async () => {
    let resolver: (url: string) => void = () => {};
    obtenerFoto.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          resolver = resolve;
        }),
    );
    obtenerFoto.mockResolvedValueOnce("https://ejemplo.com/dos.png");
    render(
      <MisViajesDesktop
        traslados={[viaje("uno"), viaje("dos", "solicitud_creada", "Honda")]}
      />,
    );
    await waitFor(() => expect(obtenerFoto).toHaveBeenCalledWith({}, "uno"));
    fireEvent.click(
      screen.getByRole("button", { name: "Ver Honda Corolla 2024" }),
    );
    await waitFor(() =>
      expect(screen.getByAltText("Foto de Conductor dos")).toHaveAttribute(
        "src",
        "https://ejemplo.com/dos.png",
      ),
    );
    await act(async () => resolver("https://ejemplo.com/uno.png"));
    expect(
      screen.queryByAltText("Foto de Conductor uno"),
    ).not.toBeInTheDocument();
  });
  it("actualiza periódicamente y limpia el temporizador", () => {
    vi.useFakeTimers();
    refresh.mockClear();
    const { unmount } = render(<MisViajesDesktop traslados={[]} />);
    act(() => window.dispatchEvent(new Event("focus")));
    act(() => vi.advanceTimersByTime(30000));
    expect(refresh).toHaveBeenCalledTimes(2);
    unmount();
    act(() => vi.advanceTimersByTime(30000));
    expect(refresh).toHaveBeenCalledTimes(2);
  });
  it("muestra métricas reales y estado vacío sin datos ficticios", () => {
    render(<MisViajesDesktop traslados={[]} />);
    expect(screen.getByText("Total de traslados")).toBeInTheDocument();
    expect(
      screen.getByText("Aún no tienes traslados registrados"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mostrando 0 de 0 traslados")).toBeInTheDocument();
    expect(
      screen.queryByRole("complementary", { name: /Detalle de/ }),
    ).not.toBeInTheDocument();
  });
  it("sincroniza el panel, detalles e historial al seleccionar una fila", () => {
    render(
      <MisViajesDesktop
        traslados={[viaje("uno"), viaje("dos", "solicitud_creada", "Honda")]}
      />,
    );
    expect(
      screen.getByRole("complementary", {
        name: "Detalle de Toyota Corolla 2024",
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Ver Honda Corolla 2024" }),
    );
    const panel = screen.getByRole("complementary", {
      name: "Detalle de Honda Corolla 2024",
    });
    expect(within(panel).getByText("Origen dos")).toBeInTheDocument();
    expect(within(panel).getByText("Conductor dos")).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole("tab", { name: "Detalles" }));
    expect(within(panel).getByText("Destino dos")).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole("tab", { name: "Historial" }));
    expect(within(panel).getByText("Solicitud registrada")).toBeInTheDocument();
    fireEvent.click(
      within(panel).getByRole("button", { name: "Cerrar detalle" }),
    );
    expect(
      screen.queryByRole("complementary", { name: /Detalle de/ }),
    ).not.toBeInTheDocument();
  });
  it("navega pestañas con teclado y sincroniza el selector de estado", () => {
    render(<MisViajesDesktop traslados={[viaje("uno")]} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Todos (1)" }), {
      key: "ArrowRight",
    });
    expect(screen.getByRole("tab", { name: "En curso (1)" })).toHaveFocus();
    expect(screen.getByLabelText("Filtrar por estado")).toHaveValue("activos");
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), {
      target: { value: "cancelados" },
    });
    expect(screen.getByRole("tab", { name: "Cancelados (0)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Mostrando 0 de 1 traslados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });
  it("filtra por búsqueda y conserva un resultado vacío", async () => {
    render(<MisViajesDesktop traslados={[viaje("uno")]} />);
    fireEvent.change(
      screen.getByLabelText("Buscar por vehículo, placas, folio o destino"),
      { target: { value: "inexistente" } },
    );
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(1));
    expect(screen.getByText("Mostrando 0 de 1 traslados")).toBeInTheDocument();
  });
  it("pagina ocho filas y actualiza el panel en la página siguiente", () => {
    render(
      <MisViajesDesktop
        traslados={Array.from({ length: 11 }, (_, i) => viaje(String(i)))}
      />,
    );
    expect(screen.getAllByRole("row")).toHaveLength(9);
    expect(
      screen.getByText("Mostrando 1–8 de 11 traslados"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(
      screen.getByText("Mostrando 9–11 de 11 traslados"),
    ).toBeInTheDocument();
    expect(screen.getByText("Conductor 8")).toBeInTheDocument();
  });
  it("ofrece filtros por tipo y navegación al expediente real", () => {
    render(<MisViajesDesktop traslados={[viaje("uno")]} />);
    fireEvent.click(screen.getByRole("button", { name: "Más filtros" }));
    expect(screen.getByLabelText("Tipo de vehículo")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Más acciones de Toyota Corolla 2024",
      }),
    );
    expect(
      screen.getByRole("link", { name: "Abrir detalle completo" }),
    ).toHaveAttribute("href", "/viajes/uno");
  });
});
