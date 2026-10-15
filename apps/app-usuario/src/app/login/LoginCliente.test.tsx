/** @vitest-environment jsdom */
import fs from "node:fs";
import path from "node:path";
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
    const correo = screen.getByRole("textbox", { name: "Correo electrónico" });
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(correo).toHaveFocus();
    expect(correo).toHaveAttribute("aria-invalid", "true");
    expect(mocks.signIn).not.toHaveBeenCalled();
    await user.type(correo, "invalido");
    expect(screen.getByText(/Introduce un correo válido/)).toBeInTheDocument();
    await user.clear(correo);
    await user.type(correo, "Persona@ejemplo.com");
    expect(correo).toHaveAttribute("aria-invalid", "false");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "clave-existente");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
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
    await user.type(screen.getByRole("textbox", { name: "Correo electrónico" }), "usuario@ejemplo.com");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "clave-existente");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/viajes/nuevo"));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("cumple estrictamente con el enfoque mobile-first y no-scroll (100dvh y overflow: hidden)", () => {
    const { container } = render(<LoginCliente motivo={null} siguiente="/" />);

    // El contenedor principal debe implementar 100dvh (Dynamic Viewport Height) y overflow: hidden
    const mainContainer = container.querySelector("main");
    expect(mainContainer).not.toBeNull();
    expect(mainContainer?.className).toContain("h-dvh");
    expect(mainContainer?.className).toContain("overflow-hidden");
    expect(mainContainer?.className).toContain("login-usuario");
    expect(mainContainer?.className).toContain("login-container");
    expect(mainContainer?.style.height).toBe("100dvh");
    expect(mainContainer?.style.overflow).toBe("hidden");

    // Prohibido usar 100vh
    expect(mainContainer?.className).not.toContain("100vh");
    expect(mainContainer?.style.height).not.toBe("100vh");

    // El logotipo debe definirse reducido por defecto en móvil (h-9 / 36px) y escalar en escritorio (md:h-16 / 64px)
    const logoContainer = container.querySelector(".login-usuario__brand");
    expect(logoContainer).not.toBeNull();
    expect(logoContainer?.className).toContain("login-logo");
    expect(logoContainer?.className).toContain("h-9");
    expect(logoContainer?.className).toContain("md:h-16");
    expect(logoContainer?.className).toContain("w-auto");
  });

  it("valida que la hoja de estilos globals.css contenga las reglas base mobile-first y media query de escritorio", () => {
    const cssPath = path.resolve(__dirname, "../globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    // Contención 100dvh y overflow: hidden sin usar 100vh
    expect(cssContent).toMatch(/\.login-usuario[\s\S]*?height:\s*100dvh;/);
    expect(cssContent).toMatch(/\.login-usuario[\s\S]*?overflow:\s*hidden;/);
    expect(cssContent).not.toMatch(/\.login-usuario[\s\S]*?height:\s*100vh;/);

    // Enfoque Mobile-First obligatorio: estilos base con logo reducido por defecto (36px)
    expect(cssContent).toMatch(/\.login-usuario__brand[\s\S]*?height:\s*36px/);

    // Adaptación a Escritorio: media query incremental (min-width: 768px)
    expect(cssContent).toMatch(/@media\s*\(\s*min-width:\s*768px\s*\)[\s\S]*?\.login-usuario__brand[\s\S]*?height:\s*64px/);
  });
});
