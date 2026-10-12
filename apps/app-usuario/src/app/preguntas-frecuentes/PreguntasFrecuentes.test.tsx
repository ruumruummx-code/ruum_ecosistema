/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreguntasFrecuentes } from "./PreguntasFrecuentes";

describe("PreguntasFrecuentes", () => {
  it("muestra el encabezado, hero, buscador y lista de categorías", () => {
    render(<PreguntasFrecuentes />);

    expect(screen.getByRole("heading", { level: 1, name: /preguntas frecuentes/i })).toBeInTheDocument();
    expect(screen.getByText(/¿en qué podemos ayudarte\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar en preguntas frecuentes/i)).toBeInTheDocument();

    // Categorías
    expect(screen.getByRole("tab", { name: /todas/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /solicitud/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /traslado/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /pagos/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /evidencia/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /cuenta/i })).toBeInTheDocument();
  });

  it("abre y cierra una pregunta al hacer clic (la primera inicia abierta como en el prototipo)", async () => {
    const user = userEvent.setup();
    render(<PreguntasFrecuentes />);

    const pregunta = screen.getByRole("button", { name: /¿cómo solicito un traslado\?/i });
    // Inicia abierta por diseño
    expect(pregunta).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/datos completos del vehículo/i)).toBeInTheDocument();

    // Cierra al hacer clic
    await user.click(pregunta);
    expect(pregunta).toHaveAttribute("aria-expanded", "false");

    // Vuelve a abrir al hacer clic
    await user.click(pregunta);
    expect(pregunta).toHaveAttribute("aria-expanded", "true");
  });

  it("filtra por texto en tiempo real y muestra estado sin resultados si no coincide", async () => {
    const user = userEvent.setup();
    render(<PreguntasFrecuentes />);

    const input = screen.getByPlaceholderText(/buscar en preguntas frecuentes/i);
    await user.type(input, "CFDI");

    expect(screen.getByText(/¿puedo solicitar factura \(cfdi\)\?/i)).toBeInTheDocument();
    expect(screen.queryByText(/¿cómo funciona un traslado\?/i)).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "palabra-totalmente-inexistente-12345");

    expect(screen.getByText(/sin resultados/i)).toBeInTheDocument();
    expect(screen.getByText(/no encontramos preguntas que coincidan/i)).toBeInTheDocument();
  });

  it("filtra al cambiar de categoría por chip", async () => {
    const user = userEvent.setup();
    render(<PreguntasFrecuentes />);

    const tabPagos = screen.getByRole("tab", { name: /pagos/i });
    await user.click(tabPagos);

    expect(screen.getByText(/¿qué métodos de pago aceptan\?/i)).toBeInTheDocument();
    expect(screen.getByText(/¿puedo solicitar factura \(cfdi\)\?/i)).toBeInTheDocument();
    expect(screen.queryByText(/¿cómo solicito un traslado\?/i)).not.toBeInTheDocument();
  });

  it("muestra la tarjeta inferior de contacto con enlaces a chat y llamada", () => {
    render(<PreguntasFrecuentes />);

    expect(screen.getByText(/¿no encontraste lo que buscabas\?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chat/i })).toHaveAttribute("href", "/soporte?canal=chat");
    expect(screen.getByRole("link", { name: /llamar/i })).toHaveAttribute("href", "/soporte?canal=telefono");
  });
});
