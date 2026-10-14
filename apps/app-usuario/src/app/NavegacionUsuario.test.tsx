/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NavegacionUsuario } from "./NavegacionUsuario";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: ({ priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => <img {...props} />,
}));

describe("NavegacionUsuario", () => {
  it("muestra el logo RR, identidad Ruum Ruum, subtipo Usuario y acciones de notificaciones y preferencias", () => {
    render(<NavegacionUsuario variante="claro" nombreUsuario="LUIS Hernández" notificacionesCount={2} />);

    const header = screen.getByRole("banner");
    expect(within(header).getByText("RR")).toBeInTheDocument();
    expect(within(header).getByText("Ruum Ruum")).toBeInTheDocument();
    expect(within(header).getByText("Usuario")).toBeInTheDocument();

    const acciones = within(header).getByRole("navigation", { name: "Acciones del usuario" });
    expect(within(acciones).getByRole("link", { name: /Notificaciones/i })).toHaveAttribute("href", "/mis-viajes");
    expect(within(acciones).getByText("2")).toBeInTheDocument();
    expect(within(acciones).getByRole("link", { name: "Preferencias" })).toHaveAttribute("href", "/cuenta/preferencias");

    const inferior = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(within(inferior).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(within(inferior).getByRole("link", { name: "Traslados" })).toHaveAttribute("href", "/mis-viajes");
    expect(within(inferior).getByRole("link", { name: "Cuenta" })).toHaveAttribute("href", "/cuenta");
  });
});
