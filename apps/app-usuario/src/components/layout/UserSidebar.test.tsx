/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { UserSidebar } from "./UserSidebar";
import { NAVEGACION_USUARIO } from "./user-navigation.config";

let mockPathname = "/";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

describe("UserSidebar — Componente de Navegación Lateral (RR-UI-001)", () => {
  beforeEach(() => {
    mockPathname = "/";
    mockSearchParams = new URLSearchParams();
    vi.clearAllMocks();
  });

  it("renderiza el logotipo oficial con lema «Tu traslado, en orden» sin alterar el isotipo", () => {
    render(<UserSidebar />);

    const sidebar = screen.getByLabelText("Menú principal de escritorio");
    expect(sidebar).toBeInTheDocument();

    expect(within(sidebar).getByText("Ruum Ruum")).toBeInTheDocument();
    expect(within(sidebar).getByText("Tu traslado, en orden")).toBeInTheDocument();
  });

  it("muestra los 9 accesos autenticados oficiales del alcance funcional", () => {
    render(<UserSidebar />);

    const nav = screen.getByRole("navigation", { name: "Navegación del panel" });
    expect(within(nav).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "Mis traslados" })).toHaveAttribute("href", "/mis-viajes");
    expect(within(nav).getByRole("link", { name: "Mis vehículos" })).toHaveAttribute("href", "/cuenta/vehiculos");
    expect(within(nav).getByRole("link", { name: "Mis ubicaciones" })).toHaveAttribute("href", "/ubicaciones");
    expect(within(nav).getByRole("link", { name: "Carga Masiva" })).toHaveAttribute("href", "/viajes/masivo");
    expect(within(nav).getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(within(nav).getByRole("link", { name: "Mi perfil" })).toHaveAttribute("href", "/cuenta?seccion=perfil");
    expect(within(nav).getByRole("link", { name: "Mis preferencias" })).toHaveAttribute("href", "/cuenta/preferencias");
    expect(within(nav).getByRole("link", { name: "Ayuda" })).toHaveAttribute("href", "/soporte");
  });

  it("determina el elemento activo según la ruta actual y rutas hijas con aria-current=\"page\"", () => {
    mockPathname = "/mis-viajes";
    const { rerender } = render(<UserSidebar activePath="/mis-viajes" />);

    const nav = screen.getByRole("navigation", { name: "Navegación del panel" });
    const linkTraslados = within(nav).getByRole("link", { name: "Mis traslados" });
    expect(linkTraslados).toHaveAttribute("aria-current", "page");

    // Ruta hija de traslados: /viajes/123-abc
    rerender(<UserSidebar activePath="/viajes/traslado-456" />);
    expect(within(nav).getByRole("link", { name: "Mis traslados" })).toHaveAttribute("aria-current", "page");

    // Ruta de ubicaciones
    rerender(<UserSidebar activePath="/ubicaciones" />);
    expect(within(nav).getByRole("link", { name: "Mis ubicaciones" })).toHaveAttribute("aria-current", "page");

    // Ruta de cuenta
    rerender(<UserSidebar activePath="/cuenta" />);
    expect(within(nav).getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("aria-current", "page");
  });

  it("soporta el estado contraído (collapsed) mostrando tooltips y botón de expansión", () => {
    const onCollapseMock = vi.fn();
    render(<UserSidebar collapsed={true} onCollapseChange={onCollapseMock} />);

    const sidebar = screen.getByLabelText("Menú principal de escritorio");
    expect(sidebar.className).toMatch(/sidebarColapsada/);

    // Botón de alternar colapso presente con aria-label accesible
    const botonExpandir = screen.getByRole("button", { name: "Expandir menú lateral" });
    expect(botonExpandir).toBeInTheDocument();
    expect(botonExpandir).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(botonExpandir);
    expect(onCollapseMock).toHaveBeenCalledWith(false);

    // En contraído, la tarjeta promocional muestra el acceso rápido compacto (+)
    expect(screen.getByRole("link", { name: "Registrar traslado" })).toHaveAttribute("href", "/viajes/nuevo");
  });

  it("soporta el modo drawer en móvil (mobileOpen) gestionando backdrop, foco y tecla Escape", () => {
    const onCloseMock = vi.fn();
    render(<UserSidebar mobileOpen={true} onMobileClose={onCloseMock} />);

    // Diálogo modal de drawer en móvil
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveAttribute("aria-modal", "true");

    // Botón de cierre (X)
    const botonCerrar = screen.getByRole("button", { name: "Cerrar menú de navegación" });
    expect(botonCerrar).toBeInTheDocument();

    fireEvent.click(botonCerrar);
    expect(onCloseMock).toHaveBeenCalled();

    // Tecla Escape cierra el drawer
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });

  it("renderiza la tarjeta promocional con el titular y botón aprobado cuando showPromo es true", () => {
    render(<UserSidebar showPromo={true} collapsed={false} />);

    expect(screen.getByText("Mueve tu auto sin salir de casa")).toBeInTheDocument();
    expect(screen.getByText("Un servicio confiable, seguro y en todo México.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Registrar traslado/ })).toHaveAttribute("href", "/viajes/nuevo");
  });

  it("permite ocultar la tarjeta promocional configurando showPromo={false}", () => {
    render(<UserSidebar showPromo={false} />);

    expect(screen.queryByText("Mueve tu auto sin salir de casa")).not.toBeInTheDocument();
  });
});
