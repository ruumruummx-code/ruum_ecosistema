/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SoporteCliente } from "./SoporteCliente";

function faqs() {
  return within(document.getElementById("faqs") as HTMLElement);
}

describe("SoporteCliente", () => {
  it("muestra encabezado, buscador y acordeón de FAQs sin usuario", () => {
    render(<SoporteCliente usuario={null} traslados={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: /ayuda y soporte/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/buscar una solución/i)).toBeInTheDocument();
    expect(faqs().getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("filtra las FAQs por búsqueda y expande la respuesta", async () => {
    const user = userEvent.setup();
    render(<SoporteCliente usuario={null} traslados={[]} />);
    const total = faqs().getAllByRole("button").length;

    await user.type(screen.getByLabelText(/buscar una solución/i), "zzz-sin-coincidencias");
    expect(faqs().queryAllByRole("button").length).toBe(0);

    await user.clear(screen.getByLabelText(/buscar una solución/i));
    const botones = faqs().getAllByRole("button");
    expect(botones.length).toBe(total);
    await user.click(botones[0]);
    expect(botones[0]).toHaveAttribute("aria-expanded", "true");
  });
});
