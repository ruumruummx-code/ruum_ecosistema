/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  it("integra Mis vehículos con tabs, sin enlaces de header y con una sola acción para agregar", () => {
    ruta.pathname = "/cuenta/vehiculos";
    render(<NavegacionUsuario />);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("heading", { name: "Mis vehículos", level: 1 })).toBeInTheDocument();
    expect(within(header).getByText("Autos frecuentes para solicitudes rápidas")).toBeInTheDocument();
    expect(within(header).queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cuenta" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: "Agregar vehículo" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Agregar vehículo" })).toHaveAttribute("href", "/viajes/nuevo");
    expect(screen.queryByRole("link", { name: "Solicitar traslado" })).not.toBeInTheDocument();
  });
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

    // Soporte para tema claro y oscuro
    expect(logoImg.className).toContain("ruum-logo-light");
    const logoDarkImg = within(logoLink).getByRole("presentation", { hidden: true });
    expect(logoDarkImg).toHaveAttribute("src", "/imagenes/ruum-logo-dark.svg");
    expect(logoDarkImg.className).toContain("ruum-logo-dark");

    const acciones = within(header).getByRole("navigation", { name: "Acciones del usuario" });
    expect(within(acciones).getByRole("link", { name: /Notificaciones/i })).toHaveAttribute("href", "/mis-viajes");
    expect(within(acciones).getByLabelText("2 avisos pendientes")).toBeInTheDocument();
    expect(within(acciones).getByRole("link", { name: "Contactar soporte" })).toHaveAttribute("href", "/soporte");
    expect(within(acciones).getByRole("link", { name: "Mi cuenta" })).toHaveTextContent("LH");
    expect(within(acciones).getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(screen.queryByRole("link", { name: "Solicitar traslado" })).not.toBeInTheDocument();

    const inferior = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(within(inferior).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(within(inferior).getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(within(inferior).getByRole("link", { name: "Traslados" })).toHaveAttribute("href", "/mis-viajes");
    expect(within(inferior).getByRole("link", { name: "Cuenta" })).toHaveAttribute("href", "/cuenta");
  });
  it("presenta Mis Traslados con contexto, campana y navegación inferior sin FAB", async () => {
    ruta.pathname = "/mis-viajes";
    render(<NavegacionUsuario notificaciones={[{ id: "pago", tono: "atencion", mensaje: "Tienes un pago pendiente.", href: "/viajes/t-1" }]} />);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("heading", { name: "Mis Traslados", level: 1 })).toBeInTheDocument();
    expect(within(header).getByText("Gestiona todos tus viajes en un solo lugar")).toBeInTheDocument();
    expect(within(header).getByLabelText("1 avisos pendientes")).toBeInTheDocument();
    await userEvent.click(within(header).getByRole("button", { name: "Notificaciones de traslados" }));
    expect(within(header).getByRole("link", { name: "Tienes un pago pendiente." })).toHaveAttribute("href", "/viajes/t-1");
    expect(within(header).queryByRole("navigation")).not.toBeInTheDocument();
    expect(within(header).queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Solicitar traslado" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Traslados" })).toHaveAttribute("aria-current", "page");
  });
  it("presenta Mi Cuenta con un único encabezado y navegación inferior", () => {
    ruta.pathname = "/cuenta";
    render(<NavegacionUsuario />);
    expect(screen.getByRole("heading", { name: "Mi Cuenta", level: 1 })).toBeInTheDocument();
    expect(within(screen.getByRole("banner")).queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cuenta" })).toHaveAttribute("aria-current", "page");
  });
  it("limita Editar Perfil al App Bar secundario incluso durante errores de carga", () => {
    ruta.pathname = "/cuenta/datos-personales";
    render(<NavegacionUsuario />);
    expect(screen.getByRole("heading", { name: "Editar Perfil" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a mi cuenta" })).toHaveAttribute("href", "/cuenta?seccion=perfil");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Solicitar traslado" })).not.toBeInTheDocument();
  });
  it.each([
    ["/cuenta/cambiar-contrasena", "Cambiar contraseña"],
    ["/cuenta/verificacion-documentos", "Verificación y facturación"],
  ])("evita navegación redundante y FAB en %s", (pathname, titulo) => {
    ruta.pathname = pathname;
    render(<NavegacionUsuario />);
    expect(screen.getByRole("heading", { name: titulo })).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Solicitar traslado" })).not.toBeInTheDocument();
  });
  it("no muestra el FAB durante la solicitud de traslado", () => {
    ruta.pathname = "/viajes/nuevo";
    render(<NavegacionUsuario />);
    expect(screen.queryByRole("link", { name: "Solicitar traslado" })).not.toBeInTheDocument();
  });
});
