/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavegacionUsuario } from "./NavegacionUsuario";

const { ruta, push } = vi.hoisted(() => ({
  ruta: { pathname: "/" },
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => ruta.pathname,
  useRouter: () => ({ push }),
}));

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
  beforeEach(() => {
    ruta.pathname = "/";
    push.mockClear();
  });

  it("renderiza el header estándar con logotipo, rol y acciones de usuario", () => {
    render(<NavegacionUsuario nombreUsuario="LUIS Hernández" notificacionesCount={2} />);

    const header = screen.getByRole("banner");

    // Logotipo e identidad de marca dentro del enlace de inicio
    const logoLink = within(header).getByRole("link", { name: /Ruum Ruum/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");

    const logoImg = within(logoLink).getByAltText(
      "Símbolo oficial Ruum Ruum — RR entrelazado con ruta y pin de entrega",
    );
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute("src", "/imagenes/ruum-logo-simbolo.png");

    // Título de marca e identificador de rol (app de clientes → "Usuario")
    expect(within(header).getByText("Ruum Ruum")).toBeInTheDocument();
    expect(within(header).getByText("Usuario")).toBeInTheDocument();

    // Acciones a la derecha: campana de notificaciones y audífonos de soporte
    const campana = within(header).getByRole("button", { name: "Notificaciones (2 pendientes)" });
    expect(campana).toBeInTheDocument();
    const soporte = within(header).getByRole("button", { name: "Soporte y ayuda" });
    expect(soporte).toBeInTheDocument();
  });

  it("navega a Mis Traslados al hacer clic en campana y a Soporte en audífonos", () => {
    render(<NavegacionUsuario />);
    userEvent.click(screen.getByRole("button", { name: "Notificaciones" }));
    expect(push).toHaveBeenCalledWith("/mis-viajes");

    userEvent.click(screen.getByRole("button", { name: "Soporte y ayuda" }));
    expect(push).toHaveBeenCalledWith("/soporte");
  });

  it("oculta el header estándar en la pantalla de preguntas frecuentes", () => {
    ruta.pathname = "/preguntas-frecuentes";
    render(<NavegacionUsuario />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("mantiene el App Bar secundario en vistas internas de cuenta", () => {
    ruta.pathname = "/cuenta/datos-personales";
    render(<NavegacionUsuario />);
    expect(screen.getByRole("heading", { name: "Editar Perfil" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a mi cuenta" })).toHaveAttribute(
      "href",
      "/cuenta?seccion=perfil",
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it.each([
    ["/cuenta/cambiar-contrasena", "Cambiar contraseña"],
    ["/cuenta/verificacion-documentos", "Verificación y facturación"],
  ])("evita navegación redundante en %s", (pathname, titulo) => {
    ruta.pathname = pathname;
    render(<NavegacionUsuario />);
    expect(screen.getByRole("heading", { name: titulo })).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
