/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NavegacionUsuario } from "./NavegacionUsuario";

const { ruta } = vi.hoisted(() => ({ ruta: { pathname: "/" } }));
vi.mock("next/navigation", () => ({ usePathname: () => ruta.pathname }));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

describe("NavegacionUsuario", () => {
  beforeEach(() => { ruta.pathname = "/"; });
  it("muestra el nuevo logotipo oficial responsivo con redirección a inicio y alt correcto", () => {
    render(<NavegacionUsuario variante="claro" nombreUsuario="LUIS Hernández" notificacionesCount={2} />);

    const header = screen.getByRole("banner");

    // Enlace de redirección a la página de inicio/dashboard (/ o /home o /dashboard)
    const logoLink = within(header).getByRole("link", { name: /Ruum Ruum usuario/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");

    // Logotipo SVG con texto alternativo para accesibilidad (SEO/Lectores de pantalla)
    const logoImg = within(logoLink).getByAltText("Ruum Ruum usuario");
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute("src", "/imagenes/ruum-logo.svg");

    // Comportamiento responsive: alto 32px (h-8) en móvil y 40px (md:h-10) en desktop
    expect(logoImg.className).toContain("h-8");
    expect(logoImg.className).toContain("md:h-10");
    expect(logoImg.className).toContain("w-auto");

    // Soporte para tema claro y oscuro
    expect(logoImg.className).toContain("ruum-logo-light");
    const logoDarkImg = within(logoLink).getByRole("presentation", { hidden: true });
    expect(logoDarkImg).toHaveAttribute("src", "/imagenes/ruum-logo-dark.svg");
    expect(logoDarkImg.className).toContain("ruum-logo-dark");

    const acciones = within(header).getByRole("navigation", { name: "Acciones del usuario" });
    expect(within(acciones).getByRole("link", { name: /Notificaciones/i })).toHaveAttribute("href", "/mis-viajes");
    expect(within(acciones).getByText("2")).toBeInTheDocument();
    expect(within(acciones).getByRole("link", { name: "Preferencias" })).toHaveAttribute("href", "/cuenta/preferencias");

    expect(screen.getByRole("link", { name: "Solicitar traslado" })).toHaveAttribute("href", "/viajes/nuevo");

    const inferior = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(within(inferior).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(within(inferior).getByRole("link", { name: "Traslados" })).toHaveAttribute("href", "/mis-viajes");
    expect(within(inferior).getByRole("link", { name: "Cuenta" })).toHaveAttribute("href", "/cuenta");
  });
  it("consolida Mis Traslados en un encabezado compacto con soporte y un único FAB", () => {
    ruta.pathname = "/mis-viajes";
    render(<NavegacionUsuario />);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("heading", { name: "Mis Traslados", level: 1 })).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Contactar soporte" })).toHaveAttribute("href", "/soporte");
    expect(within(header).queryByRole("navigation")).not.toBeInTheDocument();
    expect(within(header).queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Solicitar traslado" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Traslados" })).toHaveAttribute("aria-current", "page");
  });
  it("presenta Mi Cuenta con un único encabezado y navegación inferior", () => {
    ruta.pathname = "/cuenta";
    render(<NavegacionUsuario />);
    expect(screen.getByRole("heading", { name: "Mi Cuenta", level: 1 })).toBeInTheDocument();
    expect(within(screen.getByRole("banner")).queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cuenta" })).toHaveAttribute("aria-current", "page");
  });
  it("no muestra el FAB durante la solicitud de traslado", () => {
    ruta.pathname = "/viajes/nuevo";
    render(<NavegacionUsuario />);
    expect(screen.queryByRole("link", { name: "Solicitar traslado" })).not.toBeInTheDocument();
  });
});
