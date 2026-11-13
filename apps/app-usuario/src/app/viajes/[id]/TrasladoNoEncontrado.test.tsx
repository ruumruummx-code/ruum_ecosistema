/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/viajes/abc",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

import { TrasladoNoEncontrado } from "./TrasladoNoEncontrado";

function principal() {
  return within(screen.getByRole("main"));
}

/** Unifica los 5 bloques "no encontrado" del god-component page.tsx. */
describe("TrasladoNoEncontrado", () => {
  it("estándar: kicker, título, descripción y CTA a mis-viajes", () => {
    render(<TrasladoNoEncontrado />);
    const main = principal();
    expect(main.getByText("Traslado no encontrado")).toBeInTheDocument();
    expect(main.getByRole("heading", { name: /no encontramos ese traslado/i })).toBeInTheDocument();
    expect(main.getByText(/revisa el enlace o el folio/i)).toBeInTheDocument();
    expect(main.getByRole("link", { name: /ver mis traslados/i })).toHaveAttribute("href", "/mis-viajes");
    expect(main.queryByRole("link", { name: /^inicio$/i })).toBeNull();
  });

  it("conInicio añade el enlace a inicio", () => {
    render(<TrasladoNoEncontrado conInicio />);
    expect(principal().getByRole("link", { name: /^inicio$/i })).toHaveAttribute("href", "/");
  });

  it("variante sesion: mensaje de sesión sin acciones", () => {
    render(<TrasladoNoEncontrado variante="sesion" />);
    const main = principal();
    expect(main.getByText(/no pudimos verificar tu sesión/i)).toBeInTheDocument();
    expect(main.queryByRole("link", { name: /ver mis traslados/i })).toBeNull();
  });

  it("variante incompleto: textos propios con CTA", () => {
    render(<TrasladoNoEncontrado variante="incompleto" />);
    const main = principal();
    expect(main.getByText("Traslado incompleto")).toBeInTheDocument();
    expect(main.getByRole("heading", { name: /no pudimos cargar el estado/i })).toBeInTheDocument();
    expect(main.getByText(/vuelve a intentarlo/i)).toBeInTheDocument();
    expect(main.getByRole("link", { name: /ver mis traslados/i })).toBeInTheDocument();
  });
});
