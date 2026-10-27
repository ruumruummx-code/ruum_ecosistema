/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { InicioDesktop, type InicioDesktopProps } from "./InicioDesktop";
import { crearLlamadaEnmascarada } from "@ruum/api/services";
import { useDashboardTracking } from "./dashboard/useDashboardTracking";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("next/dynamic", () => ({ default: () => () => <div>Mapa del traslado</div> }));
vi.mock("../components/layout/UserDashboardLayout", () => ({ UserDashboardLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("../lib/supabase-browser", () => ({ crearClienteNavegador: () => undefined }));
vi.mock("@ruum/api/services", () => ({ crearLlamadaEnmascarada: vi.fn() }));
vi.mock("./dashboard/useDashboardTracking", () => ({ useDashboardTracking: vi.fn(() => ({ ubicacion: null, actualizado: null, error: false, refrescar: vi.fn() })) }));
const viaje = {
  traslado_id: "viaje-1", estado: "traslado_en_curso", conductor_id: "c-1", conductor_nombre: "Jorge Ramírez", conductor_calificacion: 4.9, conductor_estado: "activo",
  vehiculo_marca: "Chrysler", vehiculo_modelo: "Cirrus", vehiculo_anio: 2024, vehiculo_placas: "PEM789", vehiculo_tipo: "sedan", origen_ciudad: "San Mateo Atenco", destino_ciudad: "Lerma de Villada",
  origen_lat: 19.27, origen_lng: -99.53, destino_lat: 19.29, destino_lng: -99.51, creado_en: "2026-10-27T16:42:00Z", distancia_km: 99, tiempo_estimado_horas: 4,
} as InicioDesktopProps["traslados"][number];
beforeEach(() => { vi.clearAllMocks(); });
describe("Inicio desktop", () => {
  it("presenta los datos reales sin convertir distancia total o duración estimada en métricas restantes", () => {
    render(<InicioDesktop usuario={null} traslados={[viaje]} />);
    const activo = screen.getByRole("article", { name: "Traslado activo" });
    expect(within(activo).getByRole("heading", { name: "Chrysler Cirrus 2024" })).toBeVisible();
    expect(within(activo).getAllByText("Por confirmar")).toHaveLength(2);
    expect(within(activo).queryByText("99 km")).not.toBeInTheDocument();
    expect(within(activo).getByRole("link", { name: /2. En tránsito/ })).toHaveAttribute("aria-current", "step");
    expect(within(activo).getByRole("link", { name: /Ver detalles/ })).toHaveAttribute("href", "/viajes/viaje-1");
    expect(screen.getByRole("link", { name: "Enviar mensaje a Jorge Ramírez" })).toHaveAttribute("href", "/viajes/viaje-1#chat-conductor");
  });
  it("distingue preparación de circulación y no inventa un conductor", () => {
    render(<InicioDesktop usuario={null} traslados={[{ ...viaje, estado: "documentacion_pendiente", conductor_id: null, conductor_nombre: null }]} />);
    const timeline = screen.getByRole("list", { name: "Progreso del traslado" });
    expect(within(timeline).getAllByText("Pendiente")).toHaveLength(3);
    expect(screen.getByText("Estamos buscando a tu conductor.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Llamar a/ })).not.toBeInTheDocument();
  });
  it("usa el servicio de llamada enmascarada y permite recuperarse de un fallo", async () => {
    vi.mocked(crearLlamadaEnmascarada).mockRejectedValueOnce(new Error("No pudimos conectar la llamada. Intenta de nuevo."));
    render(<InicioDesktop usuario={null} traslados={[viaje]} />);
    await userEvent.click(screen.getByRole("button", { name: "Llamar a Jorge Ramírez" }));
    expect(crearLlamadaEnmascarada).toHaveBeenCalledWith(undefined, "viaje-1");
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar");
    expect(screen.getByRole("button", { name: "Llamar a Jorge Ramírez" })).toBeEnabled();
  });
  it("ofrece estado vacío sin filas ficticias y permite recorrer los tips", async () => {
    render(<InicioDesktop usuario={null} traslados={[]} />);
    expect(screen.getByText("No tienes traslados activos")).toBeVisible();
    expect(screen.queryByText("Chrysler Cirrus 2024")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tip siguiente" }));
    expect(screen.getByRole("heading", { name: "Tu traslado, siempre a la vista" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Tip anterior" }));
    expect(screen.getByRole("heading", { name: "Optimiza tus traslados" })).toBeVisible();
  });
  it("el menú de una fila abre destinos del mismo traslado y cierra con Escape", async () => {
    render(<InicioDesktop usuario={null} traslados={[viaje]} />);
    const boton = screen.getByRole("button", { name: "Opciones del traslado PEM789" });
    await userEvent.click(boton);
    expect(screen.getByRole("link", { name: "Solicitar ayuda" })).toHaveAttribute("href", "/soporte?traslado=viaje-1");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("link", { name: "Solicitar ayuda" })).not.toBeInTheDocument();
    expect(boton).toHaveFocus();
    expect(useDashboardTracking).toHaveBeenCalledWith("viaje-1", "traslado_en_curso", expect.any(Boolean));
  });
});
