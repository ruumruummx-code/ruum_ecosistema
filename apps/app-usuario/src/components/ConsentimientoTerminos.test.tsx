/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({ registrar: vi.fn() }));

vi.mock("@ruum/api/services", () => ({
  registrarConsentimientoUsuario: mocks.registrar
}));

vi.mock("../lib/supabase-browser", () => ({
  crearClienteNavegador: vi.fn(() => ({ auth: {} }))
}));

import { ConsentimientoTerminosWall } from "./ConsentimientoTerminos";

/**
 * ACC-2 (auditoría fase 3): la capa de consentimiento era un overlay
 * `fixed inset-0` sin semántica de diálogo: sin role="dialog", sin
 * aria-modal, sin foco inicial, sin trampa de foco y sin restauración.
 */
describe("ConsentimientoTerminosWall — semántica de diálogo", () => {
  it("expone un diálogo modal con nombre y descripción accesibles", async () => {
    render(<ConsentimientoTerminosWall />);

    const dialogo = await screen.findByRole("dialog");
    expect(dialogo).toHaveAttribute("aria-modal", "true");
    // Nombre accesible desde el h2, no de un <h2> suelto fuera de contexto.
    expect(dialogo).toHaveAccessibleName(/aceptación de términos/i);
    expect(dialogo).toHaveAccessibleDescription(/versión/i);
  });

  it("mueve el foco al checkbox al abrir", async () => {
    render(<ConsentimientoTerminosWall />);
    await screen.findByRole("dialog");
    await waitFor(() => expect(screen.getByRole("checkbox")).toHaveFocus());
  });

  it("el error se anuncia y se asocia al checkbox", async () => {
    const user = userEvent.setup();
    render(<ConsentimientoTerminosWall />);
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: /aceptar y continuar/i }));

    const aviso = await screen.findByText(/debes aceptar los términos/i);
    // role="alert" en el contenedor + aria-invalid y describedby en el checkbox.
    expect(aviso.closest("[role='alert']")).not.toBeNull();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox.getAttribute("aria-describedby")).toBe("consentimiento-error");
    expect(checkbox).toHaveFocus();
    expect(mocks.registrar).not.toHaveBeenCalled();
  });

  it("registra el consentimiento al aceptar y avisa al padre", async () => {
    mocks.registrar.mockResolvedValue(undefined);
    const onAceptado = vi.fn();
    const user = userEvent.setup();
    render(<ConsentimientoTerminosWall onAceptado={onAceptado} />);
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /aceptar y continuar/i }));

    await waitFor(() => expect(mocks.registrar).toHaveBeenCalled());
    expect(onAceptado).toHaveBeenCalled();
  });
});