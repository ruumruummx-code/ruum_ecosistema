/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PaginaRecuperarPassword from "./page";

vi.mock("./FormularioRecuperarPassword", () => ({
  FormularioRecuperarPassword: ({ errorInicial }: { errorInicial: string | null }) => (
    <div data-testid="formulario-recuperar" data-error={errorInicial}>
      {errorInicial && <p>{errorInicial}</p>}
    </div>
  ),
}));

describe("PaginaRecuperarPassword (mensajes diferenciados)", () => {
  it("muestra mensaje de expiración cuando causa es expirado", async () => {
    const Component = await PaginaRecuperarPassword({
      searchParams: Promise.resolve({ error: "enlace_invalido", causa: "expirado" }),
    });
    render(Component);
    expect(
      screen.getByText(/ha expirado \(su vigencia es de 60 minutos\)/i)
    ).toBeInTheDocument();
  });

  it("muestra mensaje de reutilización cuando causa es reutilizado", async () => {
    const Component = await PaginaRecuperarPassword({
      searchParams: Promise.resolve({ error: "enlace_invalido", causa: "reutilizado" }),
    });
    render(Component);
    expect(
      screen.getByText(/ya fue utilizado anteriormente.*un solo uso/i)
    ).toBeInTheDocument();
  });

  it("muestra mensaje de otro dispositivo cuando causa es otro_dispositivo", async () => {
    const Component = await PaginaRecuperarPassword({
      searchParams: Promise.resolve({ error: "enlace_invalido", causa: "otro_dispositivo" }),
    });
    render(Component);
    expect(
      screen.getByText(/no pudo validarse en este navegador o fue solicitado desde otro dispositivo/i)
    ).toBeInTheDocument();
  });

  it("muestra mensaje genérico cuando hay error de enlace pero sin causa conocida", async () => {
    const Component = await PaginaRecuperarPassword({
      searchParams: Promise.resolve({ error: "enlace_invalido" }),
    });
    render(Component);
    expect(
      screen.getByText(/no es válido o ya ha expirado/i)
    ).toBeInTheDocument();
  });

  it("no muestra error cuando no viene parámetro de error", async () => {
    const Component = await PaginaRecuperarPassword({
      searchParams: Promise.resolve({}),
    });
    render(Component);
    expect(screen.queryByText(/expirado/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("formulario-recuperar")).not.toHaveAttribute("data-error");
  });
});
