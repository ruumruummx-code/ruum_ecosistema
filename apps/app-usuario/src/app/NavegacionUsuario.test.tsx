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
  it("evita duplicar el saludo y expone acciones semánticas de preferencias y soporte", () => {
    render(<NavegacionUsuario variante="claro" nombreUsuario="LUIS Hernández" />);

    const inferior = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(within(inferior).getByRole("link", { name: "Solicitar" })).toHaveAttribute("href", "/viajes/nuevo");
    expect(within(inferior).getByRole("link", { name: "Soporte" })).toHaveAttribute("href", "/soporte");
    const header = screen.getByRole("banner");
    const acciones = within(header).getByRole("navigation", { name: "Acciones del usuario" });

    expect(within(header).getByText("Ruum Ruum")).toBeInTheDocument();
    expect(within(acciones).getByRole("link", { name: "Preferencias" })).toHaveAttribute("href", "/cuenta/preferencias");
    expect(within(acciones).getByRole("link", { name: "Soporte" })).toHaveAttribute("href", "/soporte");
  });
});
