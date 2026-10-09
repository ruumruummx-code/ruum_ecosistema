/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signupFetch: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  usePathname: () => "/registro",
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true
}));

import PaginaRegistro from "./page";

/**
 * ACC-3/ACC-5 (auditoría fase 3): los errores de validación deben asociarse al
 * campo (aria-invalid + aria-describedby), enfocarse, y anunciarse como error
 * (role="alert"), no como status/polite.
 */
describe("registro — accesibilidad de errores de validación", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.signupFetch.mockReset();
    vi.stubGlobal("fetch", mocks.signupFetch);
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asocia el error al campo y mueve el foco cuando falta el nombre", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    // Paso 1 no debe tener botón type="button": sin <form>, Enter no avanzaba.
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const nombre = await screen.findByLabelText(/^nombre$/i);
    await waitFor(() => expect(nombre).toHaveAttribute("aria-invalid", "true"));
    expect(nombre).toHaveFocus();
    expect(screen.getByText("Escribe tu nombre.")).toHaveAttribute("role", "alert");
    expect(mocks.signupFetch).not.toHaveBeenCalled();
  });

  it("el mensaje de error queda enlazado al campo vía aria-describedby", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const nombre = await screen.findByLabelText(/^nombre$/i);
    const descritoPor = nombre.getAttribute("aria-describedby");
    expect(descritoPor).toBeTruthy();
    const mensaje = document.getElementById(descritoPor as string);
    expect(mensaje).toHaveTextContent("Escribe tu nombre.");
  });

  it("valida el teléfono de 10 dígitos con mensaje en el campo", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos");
    await user.type(screen.getByLabelText(/^apellido$/i), "Mendoza");
    await user.type(screen.getByLabelText(/teléfono celular/i), "5512");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const telefono = screen.getByLabelText(/teléfono celular/i);
    await waitFor(() => expect(telefono).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("El teléfono debe tener 10 dígitos.")).toBeInTheDocument();
  });

  it("avanza al paso 2 y lleva el foco al correo", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos");
    await user.type(screen.getByLabelText(/^apellido$/i), "Mendoza");
    await user.type(screen.getByLabelText(/teléfono celular/i), "5512345678");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const correo = await screen.findByLabelText(/correo electrónico/i);
    await waitFor(() => expect(correo).toHaveFocus());
  });

  it("asocia el error de confirmación de contraseña al campo correcto", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos");
    await user.type(screen.getByLabelText(/^apellido$/i), "Mendoza");
    await user.type(screen.getByLabelText(/teléfono celular/i), "5512345678");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await screen.findByLabelText(/correo electrónico/i);
    await user.type(screen.getByLabelText(/correo electrónico/i), "ana@ejemplo.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "Secreto123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "Otra999");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    const confirmar = screen.getByLabelText(/confirmar contraseña/i);
    await waitFor(() => expect(confirmar).toHaveAttribute("aria-invalid", "true"));
    expect(confirmar).toHaveFocus();
    expect(mocks.signupFetch).not.toHaveBeenCalled();
  });

  it("exige aceptar términos y enfoca el checkbox", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos");
    await user.type(screen.getByLabelText(/^apellido$/i), "Mendoza");
    await user.type(screen.getByLabelText(/teléfono celular/i), "5512345678");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await screen.findByLabelText(/correo electrónico/i);
    await user.type(screen.getByLabelText(/correo electrónico/i), "ana@ejemplo.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "Secreto123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "Secreto123");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    const check = await screen.findByRole("checkbox");
    await waitFor(() => expect(check).toHaveAttribute("aria-invalid", "true"));
    expect(check).toHaveFocus();
    expect(screen.getByText("Acepta los términos para continuar.")).toBeInTheDocument();
  });

  it("envía el registro cuando la validación pasa", async () => {
    mocks.signupFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, requiereConfirmacion: false, correo: "ana@ejemplo.com" }),
    });
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos");
    await user.type(screen.getByLabelText(/^apellido$/i), "Mendoza");
    await user.type(screen.getByLabelText(/teléfono celular/i), "5512345678");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await screen.findByLabelText(/correo electrónico/i);
    await user.type(screen.getByLabelText(/correo electrónico/i), "ana@ejemplo.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "Secreto123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "Secreto123");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => expect(mocks.signupFetch).toHaveBeenCalled());
    expect(mocks.push).toHaveBeenCalledWith("/");
  });
});