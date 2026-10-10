/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { useDialogAccesible } from "@ruum/ui";

function DialogoPrueba({
  abierto = true,
  conFocoInicial = false,
  alCancelar,
}: {
  abierto?: boolean;
  conFocoInicial?: boolean;
  alCancelar?: () => void;
}) {
  const focoRef = useRef<HTMLInputElement>(null);
  const dialogRef = useDialogAccesible({
    abierto,
    focoInicial: conFocoInicial ? focoRef : undefined,
    alCancelar,
  });
  return (
    <dialog ref={dialogRef} aria-modal="true" aria-label="Diálogo de prueba">
      {conFocoInicial && <input aria-label="inicial" ref={focoRef} />}
      <button>Cerrar</button>
    </dialog>
  );
}

describe("useDialogAccesible (@ruum/ui)", () => {
  it("abre con showModal y expone el diálogo", async () => {
    render(<DialogoPrueba />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("mueve el foco inicial al elemento indicado", async () => {
    render(<DialogoPrueba conFocoInicial />);
    await screen.findByRole("dialog");
    await vi.waitFor(() => expect(screen.getByLabelText("inicial")).toHaveFocus());
  });

  it("cicla el foco con Tab dentro del diálogo", async () => {
    render(<DialogoPrueba conFocoInicial />);
    const dialogo = await screen.findByRole("dialog");
    expect(dialogo).toHaveAttribute("aria-modal", "true");

    const campo = screen.getByLabelText("inicial");
    const boton = screen.getByRole("button", { name: "Cerrar" });

    campo.focus();
    fireEvent.keyDown(dialogo, { key: "Tab", shiftKey: true });
    expect(boton).toHaveFocus();

    fireEvent.keyDown(dialogo, { key: "Tab" });
    expect(campo).toHaveFocus();
  });

  it("delega el cancel nativo (ESC) en alCancelar", async () => {
    const alCancelar = vi.fn();
    render(<DialogoPrueba alCancelar={alCancelar} />);
    const dialogo = await screen.findByRole("dialog");
    fireEvent(dialogo, new Event("cancel", { bubbles: false, cancelable: true }));
    expect(alCancelar).toHaveBeenCalledTimes(1);
  });
});
