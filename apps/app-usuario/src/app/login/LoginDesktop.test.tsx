/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginCliente } from "./LoginCliente";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("../../lib/analytics", () => ({
  registrarEventoUx: vi.fn(),
}));

vi.mock("../../lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true,
  crearClienteNavegador: () => ({ auth: { signInWithPassword: mocks.signIn } }),
}));

describe("LoginDesktop — Pantalla de Inicio de Sesión de Escritorio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signIn.mockResolvedValue({ error: null });
  });

  it("renderiza la barra de navegación superior de escritorio con logo, enlace, botón de registro y selector de idioma", () => {
    render(<LoginCliente motivo={null} siguiente="/" />);

    const navbar = screen.getByRole("banner", { name: "Barra superior de inicio de sesión" });
    expect(navbar).toBeInTheDocument();
    expect(navbar.className).toContain("hidden");
    expect(navbar.className).toContain("lg:flex");

    // Enlaces y botón
    expect(within(navbar).getByText("¿Primera vez aquí?")).toBeInTheDocument();
    const btnRegistro = within(navbar).getByRole("link", { name: "Regístrate gratis" });
    expect(btnRegistro).toHaveAttribute("href", "/registro");

    // Selector de idioma interactivo
    const selectorIdioma = within(navbar).getByRole("button", { name: /seleccionar idioma/i });
    expect(selectorIdioma).toHaveTextContent("ES");

    // Abrir dropdown y cambiar a EN
    fireEvent.click(selectorIdioma);
    const opcionEN = within(navbar).getByRole("button", { name: "EN" });
    expect(opcionEN).toBeInTheDocument();
    fireEvent.click(opcionEN);
    expect(selectorIdioma).toHaveTextContent("EN");
  });

  it("renderiza la columna izquierda con tagline, título principal, los 3 pilares y la ilustración", () => {
    render(<LoginCliente motivo={null} siguiente="/" />);

    const seccionHero = screen.getByRole("region", {
      name: "Información de bienvenida y propuesta de valor",
    });
    expect(seccionHero).toBeInTheDocument();
    expect(seccionHero.className).toContain("hidden");
    expect(seccionHero.className).toContain("lg:flex");

    // Tagline y Título
    expect(within(seccionHero).getByText("MOVILIDAD INTELIGENTE")).toBeInTheDocument();
    expect(within(seccionHero).getByText("Tu traslado,")).toBeInTheDocument();
    expect(within(seccionHero).getByText("en orden.")).toBeInTheDocument();

    // 3 Pilares
    expect(within(seccionHero).getByText("Rápido")).toBeInTheDocument();
    expect(within(seccionHero).getByText("Seguro")).toBeInTheDocument();
    expect(within(seccionHero).getByText("Confiable")).toBeInTheDocument();

    // Footer tenue
    expect(
      within(seccionHero).getByText(/PERSONAS • EMPRESAS • CIUDADES EN MOVIMIENTO/i),
    ).toBeInTheDocument();
  });

  it("renderiza la tarjeta flotante de login con formulario completo, separador con círculo y badges de confianza", async () => {
    const user = userEvent.setup();
    render(<LoginCliente motivo={null} siguiente="/" />);

    const seccionFormulario = screen.getByRole("region", {
      name: "Formulario de inicio de sesión",
    });
    expect(seccionFormulario).toBeInTheDocument();

    // Marca superior de la tarjeta
    const logoMarca = within(seccionFormulario).getByRole("img", { name: "Ruum Ruum" });
    expect(logoMarca).toBeInTheDocument();
    expect(within(seccionFormulario).getByText("Tu traslado, en orden.")).toBeInTheDocument();

    // Título y subtítulo
    expect(within(seccionFormulario).getByRole("heading", { name: /inicia sesión/i })).toBeInTheDocument();
    expect(within(seccionFormulario).getByText("Accede a tu cuenta para continuar")).toBeInTheDocument();

    // Campos del Formulario
    const inputEmail = within(seccionFormulario).getByLabelText("Correo electrónico");
    const inputPassword = within(seccionFormulario).getByLabelText(/^Contraseña/i);
    expect(inputEmail).toHaveAttribute("placeholder", "lomelinhectorm@gmail.com");
    expect(inputPassword).toHaveAttribute("type", "password");

    // Enlace ¿La olvidaste?
    const linkOlvido = within(seccionFormulario).getByRole("link", { name: "¿La olvidaste?" });
    expect(linkOlvido).toHaveAttribute("href", "/recuperar-password");

    // Botón de acción principal
    const btnSubmit = within(seccionFormulario).getByRole("button", { name: "Iniciar sesión" });
    expect(btnSubmit).toBeInTheDocument();

    // Enlaces secundarios de registro y onboarding
    expect(within(seccionFormulario).getByText("¿No tienes cuenta?")).toBeInTheDocument();
    const linkRegistro = within(seccionFormulario).getByRole("link", { name: "Regístrate gratis" });
    expect(linkRegistro).toHaveAttribute("href", "/registro");

    expect(within(seccionFormulario).getByText("¿Primera vez aquí?")).toBeInTheDocument();
    const linkOnboarding = within(seccionFormulario).getByRole("link", {
      name: "Conoce cómo funciona Ruum",
    });
    expect(linkOnboarding).toHaveAttribute("href", "/onboarding");

    // 3 Insignias de confianza
    const garantias = within(seccionFormulario).getByRole("region", { name: "Garantías de seguridad" });
    expect(within(garantias).getByText("Datos protegidos")).toBeInTheDocument();
    expect(within(garantias).getByText("Cifrado TLS/SSL")).toBeInTheDocument();
    expect(within(garantias).getByText("Tu información segura")).toBeInTheDocument();

    // Enlaces de términos y aviso de privacidad
    expect(within(seccionFormulario).getByRole("link", { name: "Términos y condiciones" })).toHaveAttribute(
      "href",
      "/legal/terminos",
    );
    expect(within(seccionFormulario).getByRole("link", { name: "Aviso de privacidad" })).toHaveAttribute(
      "href",
      "/legal/privacidad",
    );

    // Enviar formulario con datos válidos
    await user.type(inputEmail, "lomelinhectorm@gmail.com");
    await user.type(inputPassword, "password123");
    await user.click(btnSubmit);

    expect(mocks.signIn).toHaveBeenCalledWith({
      email: "lomelinhectorm@gmail.com",
      password: "password123",
    });
  });

  it("permite conmutar la visibilidad de la contraseña en el formulario", async () => {
    const user = userEvent.setup();
    render(<LoginCliente motivo={null} siguiente="/" />);

    const inputPassword = screen.getByLabelText(/^Contraseña/i);
    expect(inputPassword).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: "Mostrar contraseña" });
    await user.click(toggleBtn);
    expect(inputPassword).toHaveAttribute("type", "text");

    const toggleBtnOcultar = screen.getByRole("button", { name: "Ocultar contraseña" });
    await user.click(toggleBtnOcultar);
    expect(inputPassword).toHaveAttribute("type", "password");
  });
});
