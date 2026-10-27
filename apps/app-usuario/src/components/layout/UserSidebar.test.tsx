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

  it("implementa focus trap atrapando Tab y Shift+Tab dentro del drawer en móvil", () => {
    render(<UserSidebar mobileOpen={true} />);

    const sidebar = screen.getByRole("dialog");
    const focusables = Array.from(
      sidebar.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    expect(focusables.length).toBeGreaterThan(1);
    const primerElemento = focusables[0];
    const ultimoElemento = focusables[focusables.length - 1];

    // Simular que el foco está en el último elemento y se presiona Tab -> vuelve al primer elemento
    ultimoElemento.focus();
    expect(document.activeElement).toBe(ultimoElemento);

    const eventoTab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(eventoTab);
    expect(eventoTab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(primerElemento);

    // Simular que el foco está en el primer elemento y se presiona Shift+Tab -> vuelve al último elemento
    primerElemento.focus();
    expect(document.activeElement).toBe(primerElemento);

    const eventoShiftTab = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(eventoShiftTab);
    expect(eventoShiftTab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(ultimoElemento);
  });

  it("restaura el foco al elemento detonador al cerrar el drawer", () => {
    // Crear un botón detonador en el documento
    const botonDetonador = document.createElement("button");
    botonDetonador.setAttribute("id", "triggerBoton");
    botonDetonador.textContent = "Abrir menú";
    document.body.appendChild(botonDetonador);
    botonDetonador.focus();
    expect(document.activeElement).toBe(botonDetonador);

    const { rerender } = render(<UserSidebar mobileOpen={true} />);

    // El drawer toma el foco
    const botonCerrar = screen.getByRole("button", { name: "Cerrar menú de navegación" });
    botonCerrar.focus();
    expect(document.activeElement).toBe(botonCerrar);

    // Cerrar el drawer
    rerender(<UserSidebar mobileOpen={false} />);

    // El foco debe restaurarse al botón detonador
    expect(document.activeElement).toBe(botonDetonador);
    document.body.removeChild(botonDetonador);
  });

  it("aisla el fondo (background isolation) marcando el contenido principal y hermanos con aria-hidden e inert", () => {
    // 1. Simular contenedor hermano principal (UserDashboardLayout)
    const mainContent = document.createElement("div");
    mainContent.setAttribute("id", "userDashboardMainContent");
    document.body.appendChild(mainContent);

    // 2. Simular contenedor externo en body
    const contenedorExterno = document.createElement("div");
    contenedorExterno.setAttribute("id", "app-externa");
    document.body.appendChild(contenedorExterno);

    expect(mainContent.getAttribute("aria-hidden")).toBeNull();
    expect(contenedorExterno.getAttribute("aria-hidden")).toBeNull();

    const { unmount } = render(<UserSidebar mobileOpen={true} mainContentId="userDashboardMainContent" />);

    // Con el drawer abierto, tanto el contenedor hermano principal como los elementos externos quedan aislados
    expect(mainContent.getAttribute("aria-hidden")).toBe("true");
    expect(mainContent.inert).toBe(true);
    expect(contenedorExterno.getAttribute("aria-hidden")).toBe("true");

    // Al desmontar o cerrar, se restablece el estado original de todo
    unmount();
    expect(mainContent.getAttribute("aria-hidden")).toBeNull();
    expect(mainContent.inert).toBe(false);
    expect(contenedorExterno.getAttribute("aria-hidden")).toBeNull();

    document.body.removeChild(mainContent);
    document.body.removeChild(contenedorExterno);
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
