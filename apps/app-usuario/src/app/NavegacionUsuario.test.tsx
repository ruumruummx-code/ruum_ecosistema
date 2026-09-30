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
  it("muestra el saludo y expone acciones semánticas de notificaciones y soporte", () => {
    render(<NavegacionUsuario variante="claro" nombreUsuario="LUIS Hernández" />);

    const header = screen.getByRole("banner");
    const acciones = within(header).getByRole("navigation", { name: "Acciones del usuario" });

    expect(within(header).getByText("¡Hola, Luis!")).toBeInTheDocument();
    expect(within(acciones).getByRole("link", { name: "Notificaciones" })).toHaveAttribute("href", "/cuenta/preferencias");
    expect(within(acciones).getByRole("link", { name: "Soporte" })).toHaveAttribute("href", "/soporte");
  });
});
