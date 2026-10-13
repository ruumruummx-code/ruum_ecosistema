/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preferencias } from "../Preferencias";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

const mockUsuario: Partial<Usuario> = {
  id: "user-test-pref",
  nombre: "Carlos Ramos",
  notificaciones_push: true,
  notificaciones_email: true,
  notificaciones_sms_whatsapp: false,
  notificaciones_promocionales: false,
  alertas_viaje: true,
  alertas_evidencia: true,
  alertas_pago: true,
};

vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => false,
  crearClienteNavegador: () => ({}),
}));

describe("Preferencias — Pantalla y configuración de usuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza encabezado, botón de regreso y hero de preferencias", () => {
    render(<Preferencias usuario={mockUsuario as Usuario} />);

    // Encabezado
    expect(screen.getByRole("heading", { level: 1, name: "Preferencias" })).toBeInTheDocument();
    expect(screen.getByText("Personaliza tu experiencia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver a mi cuenta/i })).toHaveAttribute("href", "/cuenta");

    // Hero
    expect(screen.getByRole("heading", { level: 2, name: "Tus preferencias" })).toBeInTheDocument();
    expect(screen.getByText(/configura notificaciones, idioma y privacidad a tu medida/i)).toBeInTheDocument();
  });

  it("renderiza todas las secciones requeridas", () => {
    render(<Preferencias usuario={mockUsuario as Usuario} />);

    expect(screen.getByRole("heading", { level: 2, name: /^notificaciones$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /^alertas de traslado$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /^idioma y región$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /^preferencias de la app$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /^privacidad y seguridad$/i })).toBeInTheDocument();
    expect(screen.getByText(/puedes cambiar tus preferencias en cualquier momento/i)).toBeInTheDocument();
  });

  it("permite alternar interruptores de notificaciones y muestra toast", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario as Usuario} />);

    const switchWhatsapp = screen.getByRole("switch", { name: "WhatsApp / SMS" });
    expect(switchWhatsapp).toHaveAttribute("aria-checked", "false");

    await user.click(switchWhatsapp);

    expect(switchWhatsapp).toHaveAttribute("aria-checked", "true");
    expect(await screen.findByText("WhatsApp / SMS activado")).toBeInTheDocument();
  });

  it("permite cambiar la selección de idioma", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario as Usuario} />);

    const radioEnglish = screen.getByRole("radio", { name: /english \(us\)/i });
    expect(radioEnglish).toHaveAttribute("aria-checked", "false");

    await user.click(radioEnglish);

    expect(radioEnglish).toHaveAttribute("aria-checked", "true");
    expect(await screen.findByText("Language changed to English (US)")).toBeInTheDocument();
  });

  it("permite abrir y aplicar la configuración del Tema en bottom-sheet", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario as Usuario} />);

    const botonTema = screen.getByRole("button", { name: /tema de la aplicación/i });
    await user.click(botonTema);

    // Modal abierto
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Elige cómo quieres ver Ruum Ruum")).toBeInTheDocument();

    // Seleccionar 'Oscuro'
    const opcionOscuro = screen.getByRole("radio", { name: /oscuro/i });
    await user.click(opcionOscuro);

    // Aplicar
    const botonAplicar = screen.getByRole("button", { name: /aplicar/i });
    await user.click(botonAplicar);

    expect(await screen.findByText("Tema aplicado: Oscuro")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("permite abrir el modal de Unidades de medida y cambiar a Imperial", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario as Usuario} />);

    const botonUnidades = screen.getByRole("button", { name: /unidades de medida/i });
    await user.click(botonUnidades);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const opcionImperial = screen.getByRole("radio", { name: /imperial/i });
    await user.click(opcionImperial);

    const botonAplicar = screen.getByRole("button", { name: /aplicar/i });
    await user.click(botonAplicar);

    expect(await screen.findByText("Unidades actualizadas: Imperial")).toBeInTheDocument();
  });

  it("permite abrir el modal de Accesibilidad y Uso de Datos", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario as Usuario} />);

    // Accesibilidad
    const botonAccesibilidad = screen.getByRole("button", { name: /accesibilidad/i });
    await user.click(botonAccesibilidad);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Ajusta la interfaz para que sea más fácil de usar")).toBeInTheDocument();

    // Cancelar
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Uso de datos
    const botonDatos = screen.getByRole("button", { name: /uso de datos/i });
    await user.click(botonDatos);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/compartiendo datos anónimos de uso/i)).toBeInTheDocument();
  });

  it("cierra los modales al presionar la tecla Escape", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario as Usuario} />);

    const botonTema = screen.getByRole("button", { name: /tema de la aplicación/i });
    await user.click(botonTema);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
