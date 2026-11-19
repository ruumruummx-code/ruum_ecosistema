/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginCliente } from "./LoginCliente";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), fetch: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("../../lib/analytics", () => ({ registrarEventoUx: vi.fn() }));
vi.mock("../../lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true,
}));

describe("LoginCliente", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("valida antes de enviar, enfoca el primer error y lo elimina al corregir", async () => {
    const user = userEvent.setup();
    render(<LoginCliente motivo={null} siguiente="/" />);
    const correo = screen.getByRole("textbox", { name: "Correo electrónico" });
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(correo).toHaveFocus();
    expect(correo).toHaveAttribute("aria-invalid", "true");
    expect(mocks.fetch).not.toHaveBeenCalled();
    await user.type(correo, "invalido");
    expect(screen.getByText(/Introduce un correo válido/)).toBeInTheDocument();
    await user.clear(correo);
    await user.type(correo, "Persona@ejemplo.com");
    expect(correo).toHaveAttribute("aria-invalid", "false");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "clave-existente");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/"));
    expect(mocks.fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toMatchObject({ email: "persona@ejemplo.com", password: "clave-existente" });
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
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("mantiene el destino solicitado después de autenticar", async () => {
    const user = userEvent.setup();
    render(<LoginCliente motivo="authentication_required" siguiente="/viajes/nuevo" />);
    await user.type(screen.getByRole("textbox", { name: "Correo electrónico" }), "usuario@ejemplo.com");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "clave-existente");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/viajes/nuevo"));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("muestra Torre de Control y sus rutas de recuperación y acceso", () => {
    render(<LoginCliente motivo={null} siguiente="/" />);
    expect(screen.getByRole("heading", { name: "Movilidad que conecta operaciones" })).toBeInTheDocument();
    for (const texto of ["Traslados", "Documentación", "Pagos", "Incidencias y alertas"]) {
      expect(screen.getByText(texto)).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "Bienvenido" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("es");
    expect(screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toHaveAttribute("href", "/recuperar-password");
    expect(screen.getByRole("link", { name: "Solicita acceso" })).toHaveAttribute("href", "/registro");
  });

  it("recuerda únicamente el correo y lo elimina al desmarcar la casilla", async () => {
    const user = userEvent.setup();
    const vista = render(<LoginCliente motivo={null} siguiente="/" />);
    await user.type(screen.getByLabelText("Correo electrónico"), "Persona@ejemplo.com");
    await user.type(screen.getByLabelText("Contraseña"), "clave-existente");
    await user.click(screen.getByRole("checkbox", { name: "Recordarme en este dispositivo" }));
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    vista.unmount();

    render(<LoginCliente motivo={null} siguiente="/" />);
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("persona@ejemplo.com");
    expect(screen.getByLabelText("Contraseña")).toHaveValue("");
    const casilla = screen.getByRole("checkbox", { name: "Recordarme en este dispositivo" });
    expect(casilla).toBeChecked();
    await user.click(casilla);
    expect(localStorage.getItem("ruum-login-correo")).toBeNull();
  });
});
