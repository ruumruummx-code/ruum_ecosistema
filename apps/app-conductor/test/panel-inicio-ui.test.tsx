// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const seleccionarDisponibilidadMock = vi.fn();
const persistirDisponibilidadMock = vi.fn();
const setDisponibilidadPendienteMock = vi.fn();
const recargarMock = vi.fn();
const cerrarSesionMock = vi.fn();

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const { priority: _priority, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={props.alt ?? ""} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("../src/lib/use-cerrar-sesion", () => ({
  useCerrarSesion: () => ({
    cerrarSesion: cerrarSesionMock,
    cerrandoSesion: false,
    errorCerrarSesion: null,
  }),
}));

vi.mock("../src/lib/background-tracking", () => ({
  soportaTrackingNativo: () => false,
  obtenerEstadoTrackingNativo: vi.fn(),
}));

vi.mock("../src/lib/battery", () => ({
  getBatteryState: vi.fn(),
  intervaloTrackingMs: () => 30000,
}));

vi.mock("../src/app/ViajeActivoContext", () => ({
  RegistroViajeActivo: () => null,
  useViajeActivo: () => ({ viajeActivo: null, viajeActivoSinActualizar: false }),
}));

vi.mock("../src/app/panel/usePanelData", () => ({
  usePanelData: () => ({
    cargando: false,
    refrescando: false,
    ultimaActualizacion: new Date("2026-10-23T12:00:00Z"),
    conductor: {
      id: "cond-1",
      nombre: "Héctor Manuel",
      estado: "activo",
      documentos_vigentes: true,
    },
    disponibilidad: "disponible",
    disponibilidadPendiente: null,
    persistiendoDisponibilidad: false,
    enRevision: null,
    viajeActivoPrincipal: null,
    TrasladosDisponibles: [],
    errorDisponibilidad: null,
    documentoBloqueante: false,
    documentoPorVencer: false,
    notificacionesCount: 2,
    gananciasHoy: 0,
    trasladosHoy: 0,
    seleccionarDisponibilidad: seleccionarDisponibilidadMock,
    persistirDisponibilidad: persistirDisponibilidadMock,
    setDisponibilidadPendiente: setDisponibilidadPendienteMock,
    recargar: recargarMock,
  }),
}));

import PaginaPanel from "../src/app/panel/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FE-UX: Pantalla Inicio (/panel) - Web Desktop y Mobile-First", () => {
  it("renderiza el saludo personalizado, el switch de disponibilidad activo y el menú lateral de escritorio", () => {
    render(<PaginaPanel />);

    expect(screen.getByRole("heading", { level: 1, name: "¡Hola, Héctor!" })).toBeTruthy();

    // Switch de disponibilidad funcional
    const toggle = screen.getByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(toggle);
    expect(seleccionarDisponibilidadMock).toHaveBeenCalledWith("no_disponible");

    // Menú lateral de escritorio con los 7 ítems y enlaces legales al pie
    const sidebar = screen.getByLabelText("Barra lateral de navegación");
    const navDesktop = within(sidebar).getByRole("navigation", { name: "Navegación principal" });
    expect(within(navDesktop).getByRole("link", { name: "Inicio" }).getAttribute("aria-current")).toBe("page");
    expect(within(navDesktop).getByRole("link", { name: "Traslados" }).getAttribute("href")).toBe("/viajes");
    expect(within(navDesktop).getByRole("link", { name: "Ganancias" }).getAttribute("href")).toBe("/ganancias");
    expect(within(navDesktop).getByRole("link", { name: "Cuenta" }).getAttribute("href")).toBe("/cuenta");
    expect(within(navDesktop).getByRole("link", { name: "Preferencias" }).getAttribute("href")).toBe("/cuenta/preferencias");
    expect(within(navDesktop).getByRole("link", { name: /^Notificaciones/ }).getAttribute("href")).toBe("/notificaciones");
    expect(within(navDesktop).getByRole("link", { name: "Soporte" }).getAttribute("href")).toBe("/cuenta/soporte");

    expect(within(sidebar).getByRole("link", { name: "Términos y condiciones" }).getAttribute("href")).toBe("/legal/terminos");
    expect(within(sidebar).getByRole("link", { name: "Política de privacidad" }).getAttribute("href")).toBe("/legal/privacidad");
  });

  it("renderiza el grid de 4 requisitos (Documentos/Docu, Perfil, GPS, Conexión), el banner central y las métricas", () => {
    render(<PaginaPanel />);

    const statusRow = screen.getByRole("status", { name: "Salud operacional" });
    const reqButtons = within(statusRow).getAllByRole("button");
    expect(reqButtons).toHaveLength(4);
    expect(within(statusRow).getByText("Docu")).toBeTruthy();
    expect(within(statusRow).getByText("Documentos")).toBeTruthy();
    expect(within(statusRow).getByText("Todo en orden")).toBeTruthy();
    expect(within(statusRow).getByText("Completo")).toBeTruthy();
    expect(within(statusRow).getByText("Estable")).toBeTruthy();

    // Banner central de búsqueda de traslados
    expect(screen.getByRole("heading", { level: 2, name: "Sin traslados por ahora" })).toBeTruthy();
    const ctaLink = screen.getByRole("link", { name: /Buscar traslados ahora/i });
    expect(ctaLink.getAttribute("href")).toBe("/viajes");

    // Tarjetas de métricas (Ganancias y Traslados hoy 0 / 3)
    const metrics = screen.getByLabelText("Resumen del día");
    expect(within(metrics).getByText("$0")).toBeTruthy();
    expect(within(metrics).getByText("0 / 3")).toBeTruthy();
    expect(within(metrics).getByText("Faltan 3 para bono")).toBeTruthy();
    expect(within(metrics).getByRole("link", { name: /Ver balance/i }).getAttribute("href")).toBe("/ganancias");
    expect(within(metrics).getByRole("link", { name: /Ver detalle/i }).getAttribute("href")).toBe("/viajes");
  });

  it("renderiza la barra de navegación inferior fija en móvil con 3 accesos rápidos (Inicio, Traslados, Cuenta)", () => {
    render(<PaginaPanel />);

    const mobileNav = screen.getByRole("navigation", { name: "Navegación principal móvil" });
    const links = within(mobileNav).getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(within(mobileNav).getByRole("link", { name: "Inicio" }).getAttribute("aria-current")).toBe("page");
    expect(within(mobileNav).getByRole("link", { name: "Traslados" }).getAttribute("href")).toBe("/viajes");
    expect(within(mobileNav).getByRole("link", { name: "Cuenta" }).getAttribute("href")).toBe("/cuenta");
  });
});
