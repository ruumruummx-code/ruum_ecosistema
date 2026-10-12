/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SoporteCliente } from "./SoporteCliente";

describe("SoporteCliente", () => {
  it("muestra encabezado, hero con estado en línea y canales de atención", () => {
    render(<SoporteCliente usuario={null} traslados={[]} />);

    expect(screen.getByRole("heading", { level: 1, name: /contactar a soporte/i })).toBeInTheDocument();
    expect(screen.getByText(/soporte ruum ruum/i)).toBeInTheDocument();
    expect(screen.getByText(/en línea · tiempo de respuesta: 2 min/i)).toBeInTheDocument();

    // Canales de atención
    expect(screen.getByRole("button", { name: /chat en vivo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /llamada telefónica/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", expect.stringContaining("wa.me"));
    expect(screen.getByRole("link", { name: /correo electrónico/i })).toHaveAttribute("href", expect.stringContaining("mailto:soporte@ruumruum.com"));
  });

  it("muestra temas frecuentes y banner de traslado", () => {
    render(<SoporteCliente usuario={null} traslados={[]} />);

    expect(screen.getByText(/traslado activo ·/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /problema con un traslado/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reportar daño/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ayuda con pagos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ayuda con evidencia/i })).toBeInTheDocument();
  });

  it("abre el modal de chat en vivo y permite interactuar enviando mensajes", async () => {
    const user = userEvent.setup();
    render(<SoporteCliente usuario={{ id: "u1", nombre: "Carlos Gómez", correo_facturacion: "carlos@ruum.mx" } as any} traslados={[]} />);

    const botonChat = screen.getByRole("button", { name: /chat en vivo/i });
    await user.click(botonChat);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/hola carlos 👋 soy ana de ruum ruum/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/escribe tu mensaje.../i);
    await user.type(input, "¿Dónde puedo ver el comprobante?");
    await user.click(screen.getByLabelText(/enviar mensaje/i));

    expect(screen.getByText("¿Dónde puedo ver el comprobante?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cerrar chat/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre el chat con tema preseleccionado al tocar una tarjeta de tema rápido", async () => {
    const user = userEvent.setup();
    render(<SoporteCliente usuario={null} traslados={[]} />);

    const botonTema = screen.getByRole("button", { name: /problema con un traslado/i });
    await user.click(botonTema);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Problema con un traslado")).toBeInTheDocument();
    expect(within(dialog).getByText(/un agente especializado te atenderá/i)).toBeInTheDocument();
  });

  it("abre el modal de teléfono y muestra el número de soporte", async () => {
    const user = userEvent.setup();
    render(<SoporteCliente usuario={null} traslados={[]} />);

    const botonTel = screen.getByRole("button", { name: /llamada telefónica/i });
    await user.click(botonTel);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("+52 55 8888 0000")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /llamar ahora/i })).toHaveAttribute("href", "tel:+525588880000");

    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
