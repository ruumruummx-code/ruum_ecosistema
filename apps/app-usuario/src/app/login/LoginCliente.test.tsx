/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginCliente } from "./LoginCliente";

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("../../lib/analytics", () => ({ registrarEventoUx: vi.fn() }));
vi.mock("../../lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true,
  crearClienteNavegador: () => ({ auth: { signInWithPassword: mocks.signIn } }),
}));

describe("LoginCliente", () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks(); mocks.signIn.mockResolvedValue({ error: null }); });

  it("valida antes de enviar, enfoca el primer error y lo elimina al corregir", async () => {
    const user = userEvent.setup();
    render(<LoginCliente motivo={null} siguiente="/" />);
    const correo = screen.getByRole("textbox", { name: "Correo o teléfono" });
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(correo).toHaveFocus();
    expect(correo).toHaveAttribute("aria-invalid", "true");
    expect(mocks.signIn).not.toHaveBeenCalled();
    await user.type(correo, "invalido");
    expect(screen.getByText(/Introduce un correo válido/)).toBeInTheDocument();
    await user.clear(correo);
    await user.type(correo, "Persona@ejemplo.com");
    expect(correo).toHaveAttribute("aria-invalid", "false");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "clave-existente");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/"));
    expect(mocks.signIn).toHaveBeenCalledWith({ email: "persona@ejemplo.com", password: "clave-existente" });
  });

  it("permite mostrar y ocultar la contraseña sin enviar el formulario", async () => {
    const user = userEvent.setup();
    render(<LoginCliente motivo={null} siguiente="/" />);
    const password = screen.getByLabelText(/^Contraseña/, { selector: "input" });
    await user.type(password, "mi-clave");
    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("mi-clave");
    await user.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(password).toHaveAttribute("type", "password");
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("mantiene el destino solicitado después de autenticar", async () => {
    const user = userEvent.setup();
    render(<LoginCliente motivo="authentication_required" siguiente="/viajes/nuevo" />);
    await user.type(screen.getByRole("textbox", { name: "Correo o teléfono" }), "usuario@ejemplo.com");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "clave-existente");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/viajes/nuevo"));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
