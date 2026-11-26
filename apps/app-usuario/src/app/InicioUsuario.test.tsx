/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { crearLlamadaEnmascarada } from "@ruum/api/services";
import type { Database } from "@ruum/shared/types";
import { InicioUsuario } from "./InicioUsuario";
import { useDashboardTracking } from "./dashboard/useDashboardTracking";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("next/dynamic", () => ({ default: () => () => <div>Mapa del traslado</div> }));
vi.mock("@ruum/api/services", () => ({ crearLlamadaEnmascarada: vi.fn() }));
vi.mock("@ruum/api/drivers", () => ({ obtenerFotoPerfilConductor: vi.fn(() => Promise.resolve(null)) }));
vi.mock("../lib/supabase-browser", () => ({ crearClienteNavegador: vi.fn(), tieneSupabaseConfigurado: vi.fn(() => true) }));
vi.mock("./dashboard/useDashboardTracking", () => ({
  useDashboardTracking: vi.fn(() => ({ ubicacion: null, actualizado: null, error: false, realtime: false, refrescar: vi.fn() })),
}));

type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Vehiculo = Database["public"]["Tables"]["vehiculos"]["Row"];

const viaje = {
  traslado_id: "viaje-1", estado: "traslado_en_curso", conductor_id: "c-1", conductor_nombre: "Jorge Ramírez",
  conductor_calificacion: 4.9, conductor_estado: "activo", vehiculo_marca: "Chrysler", vehiculo_modelo: "Cirrus",
  vehiculo_anio: 2024, vehiculo_placas: "PEM789", vehiculo_tipo: "sedan", origen_ciudad: "San Mateo Atenco",
  destino_ciudad: "Lerma de Villada", origen_lat: 19.27, origen_lng: -99.53, destino_lat: 19.29, destino_lng: -99.51,
  creado_en: "2026-10-27T16:42:00Z", distancia_km: 99, tiempo_estimado_horas: 4,
} as unknown as Pasaporte;

function simularAncho(escritorio: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: escritorio && query.includes("min-width: 1024px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  simularAncho(false);
});
afterEach(() => {
  Reflect.deleteProperty(window, "matchMedia");
});

describe("InicioUsuario (una pantalla para todos los anchos)", () => {
  it("saluda por nombre y ofrece solicitar un traslado cuando no hay ninguno activo", () => {
    render(<InicioUsuario usuario={{ nombre: "carlos mendoza" } as Usuario} traslados={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: "Hola, Carlos" })).toBeInTheDocument();
    const vacio = screen.getByRole("region", { name: "Sin traslados activos" });
    expect(within(vacio).getByText("No tienes traslados activos")).toBeInTheDocument();
    expect(within(vacio).getByRole("link", { name: "Solicitar traslado" })).toHaveAttribute("href", "/viajes/nuevo");
  });

  it.each([
    ["pago_pendiente", "Pendiente de pago"],
    ["solicitud_creada", "Solicitud recibida"],
    ["documentacion_pendiente", "En preparación"],
  ])("muestra el estado real %s sin anunciar movimiento", (estado, detalle) => {
    render(<InicioUsuario usuario={null} traslados={[{ traslado_id: "activo", estado, creado_en: "2026-10-13" } as unknown as Pasaporte]} />);
    const tarjeta = screen.getByRole("region", { name: "Traslado Activo #ACTIVO" });
    expect(within(tarjeta).getByText(detalle)).toBeInTheDocument();
    expect(within(tarjeta).queryByText("En camino")).toBeNull();
    const pasos = within(tarjeta).getByRole("list", { name: "Progreso del traslado" });
    expect(within(pasos).getAllByText("Pendiente")).toHaveLength(3);
    expect(within(tarjeta).getAllByText("Por confirmar")).toHaveLength(2);
  });

  it("presenta duración y distancia como estimadas, nunca como restantes, sin mapa activo", () => {
    render(<InicioUsuario usuario={null} traslados={[viaje]} />);
    const tarjeta = screen.getByRole("region", { name: "Traslado Activo #VIAJE-1" });
    expect(within(tarjeta).getByRole("heading", { name: "Chrysler Cirrus 2024" })).toBeInTheDocument();
    expect(within(tarjeta).getByText("Placas PEM789")).toBeInTheDocument();
    expect(within(tarjeta).getByText("Tiempo estimado")).toBeInTheDocument();
    expect(within(tarjeta).getByText("~4 h")).toBeInTheDocument();
    expect(within(tarjeta).getByText("~99 km")).toBeInTheDocument();
    expect(within(tarjeta).queryByText("Tiempo restante")).toBeNull();
    const pasos = within(within(tarjeta).getByRole("list", { name: "Progreso del traslado" })).getAllByRole("listitem");
    expect(within(pasos[0]).getByText("Completada")).toBeInTheDocument();
    expect(pasos[1]).toHaveAttribute("aria-current", "step");
    expect(within(pasos[1]).getByRole("link")).toHaveAttribute("href", "/viajes/viaje-1#en-ruta");
    expect(within(pasos[2]).getByText("Pendiente")).toBeInTheDocument();
    expect(within(tarjeta).getByRole("link", { name: /Ver detalles del traslado/ })).toHaveAttribute("href", "/viajes/viaje-1");
    expect(useDashboardTracking).toHaveBeenCalledWith("viaje-1", "traslado_en_curso", false);
  });

  it("incluye al conductor dentro de la tarjeta activa, antes de los accesos rápidos", () => {
    render(<InicioUsuario usuario={null} traslados={[viaje]} />);
    const tarjeta = screen.getByRole("region", { name: "Traslado Activo #VIAJE-1" });
    const conductor = within(tarjeta).getByRole("region", { name: "Conductor asignado" });
    expect(within(conductor).getByText("Jorge Ramírez")).toBeInTheDocument();
    expect(within(conductor).getByText("Conductor verificado")).toBeInTheDocument();
    expect(within(conductor).getByRole("button", { name: "Llamar a Jorge Ramírez" })).toBeEnabled();
    expect(within(conductor).getByRole("link", { name: "Mensaje a Jorge Ramírez" })).toHaveAttribute("href", "/viajes/viaje-1#chat-conductor");
    expect(within(conductor).getByRole("link", { name: "WhatsApp soporte" })).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wa\.me\//));
    const accesos = screen.getByRole("navigation", { name: "Accesos rápidos" });
    expect(conductor.compareDocumentPosition(accesos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("sin conductor asignado no inventa uno ni ofrece llamar", () => {
    render(<InicioUsuario usuario={null} traslados={[{ ...viaje, estado: "documentacion_pendiente", conductor_id: null, conductor_nombre: null }]} />);
    expect(screen.queryByRole("region", { name: "Conductor asignado" })).toBeNull();
    expect(screen.getByText("Estamos buscando a tu conductor.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Llamar a/ })).toBeNull();
    expect(useDashboardTracking).toHaveBeenCalledWith("viaje-1", "documentacion_pendiente", false);
  });

  it("usa la llamada enmascarada y muestra un fallo recuperable", async () => {
    vi.mocked(crearLlamadaEnmascarada).mockRejectedValueOnce(new Error("fallo"));
    render(<InicioUsuario usuario={null} traslados={[viaje]} />);
    await userEvent.click(screen.getByRole("button", { name: "Llamar a Jorge Ramírez" }));
    expect(crearLlamadaEnmascarada).toHaveBeenCalledWith(undefined, "viaje-1");
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar la llamada. Intenta de nuevo.");
    expect(screen.getByRole("button", { name: "Llamar a Jorge Ramírez" })).toBeEnabled();
  });

  it("los accesos rápidos llevan a vehículos, pasaporte e indicadores", () => {
    const cerrado = { ...viaje, traslado_id: "traslado-abc", estado: "servicio_cerrado" } as Pasaporte;
    const vehiculos = [{ id: "v1" }, { id: "v2" }] as unknown as Vehiculo[];
    render(<InicioUsuario usuario={null} traslados={[cerrado]} vehiculos={vehiculos} totalActivos={2} completadosMes={5} />);
    const accesos = screen.getByRole("navigation", { name: "Accesos rápidos" });
    const enlace = (nombre: RegExp) => within(accesos).getByRole("link", { name: nombre });
    expect(enlace(/Mis vehículos/)).toHaveAttribute("href", "/cuenta/vehiculos");
    expect(within(enlace(/Mis vehículos/)).getByText("2 registrados")).toBeInTheDocument();
    expect(enlace(/Pasaporte digital/)).toHaveAttribute("href", "/viajes/traslado-abc");
    expect(enlace(/Traslados activos/)).toHaveAttribute("href", "/mis-viajes");
    expect(enlace(/Completados este mes/)).toHaveAttribute("href", "/mis-viajes?tab=finalizados");
    expect(enlace(/Carga masiva/)).toHaveAttribute("href", "/viajes/masivo");
  });

  it("con error de vehículos no muestra un conteo falso y permite reintentar", async () => {
    render(<InicioUsuario usuario={null} traslados={[]} vehiculos={[]} errorVehiculos />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar tus vehículos.");
    expect(within(screen.getByRole("link", { name: /Mis vehículos/ })).getByText("—")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refresh).toHaveBeenCalled();
  });

  it("el historial solo lista cerrados o cancelados y su menú cierra con Escape", async () => {
    const cerrado = { ...viaje, traslado_id: "viaje-2", estado: "servicio_cerrado", vehiculo_placas: "PZM456" } as Pasaporte;
    render(<InicioUsuario usuario={null} traslados={[viaje, cerrado]} />);
    const historial = screen.getByRole("region", { name: "Últimos traslados" });
    expect(within(historial).queryByRole("button", { name: "Opciones del traslado PEM789" })).toBeNull();
    const boton = within(historial).getByRole("button", { name: "Opciones del traslado PZM456" });
    await userEvent.click(boton);
    expect(screen.getByRole("link", { name: "Solicitar ayuda" })).toHaveAttribute("href", "/soporte?traslado=viaje-2");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("link", { name: "Solicitar ayuda" })).toBeNull();
    expect(boton).toHaveFocus();
  });

  it("soporte siempre visible y tips navegables", async () => {
    render(<InicioUsuario usuario={null} traslados={[]} />);
    expect(screen.getByRole("link", { name: "Contactar soporte" })).toHaveAttribute("href", "/soporte");
    const uno = screen.getByRole("button", { name: "Ver tip 1: Optimiza tus traslados" });
    const tres = screen.getByRole("button", { name: "Ver tip 3: Ten tus documentos a mano" });
    expect(uno).toHaveAttribute("aria-current", "true");
    await userEvent.click(tres);
    expect(tres).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("heading", { name: "Ten tus documentos a mano" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tip siguiente" }));
    expect(screen.getByRole("heading", { name: "Optimiza tus traslados" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tip anterior" }));
    expect(screen.getByRole("heading", { name: "Ten tus documentos a mano" })).toBeInTheDocument();
  });

  it("en escritorio activa el mapa y el seguimiento solo en la copia del marco visible", () => {
    simularAncho(true);
    const { unmount } = render(<InicioUsuario usuario={null} traslados={[viaje]} marco="escritorio" />);
    expect(screen.getByText("Mapa del traslado")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Seguimiento en vivo" })).toBeInTheDocument();
    expect(useDashboardTracking).toHaveBeenLastCalledWith("viaje-1", "traslado_en_curso", true);
    expect(screen.getByText("Tiempo restante")).toBeInTheDocument();
    unmount();

    vi.mocked(useDashboardTracking).mockClear();
    render(<InicioUsuario usuario={null} traslados={[viaje]} marco="movil" />);
    expect(screen.queryByText("Mapa del traslado")).toBeNull();
    expect(useDashboardTracking).toHaveBeenLastCalledWith("viaje-1", "traslado_en_curso", false);
  });

  it("la copia oculta no refresca datos ni pide la foto del conductor", async () => {
    vi.useFakeTimers();
    try {
      const { obtenerFotoPerfilConductor } = await import("@ruum/api/drivers");
      render(<InicioUsuario usuario={null} traslados={[viaje]} marco="escritorio" />);
      vi.advanceTimersByTime(31_000);
      expect(refresh).not.toHaveBeenCalled();
      expect(obtenerFotoPerfilConductor).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
