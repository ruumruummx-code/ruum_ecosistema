/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiditVerificationModal } from "./DiditVerificationModal";

function props(overrides: Partial<Parameters<typeof DiditVerificationModal>[0]> = {}) {
  return {
    isOpen: true,
    url: "https://verify.didit.me/session/abc123",
    cargando: false,
    error: null,
    onCerrar: vi.fn(),
    onReintentar: vi.fn(),
    onFinalizar: vi.fn(),
    ...overrides,
  };
}

describe("DiditVerificationModal", () => {
  it("no renderiza nada cuando está cerrado", () => {
    const { container } = render(<DiditVerificationModal {...props({ isOpen: false })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("monta el iframe de Didit y expone las notas de permisos", () => {
    render(<DiditVerificationModal {...props()} />);

    expect(document.querySelector("iframe")).toHaveAttribute(
      "src",
      "https://verify.didit.me/session/abc123",
    );    // aria-describedby enlaza ambas notas sr-only.
    expect(document.getElementById("didit-permisos-nota")).toHaveTextContent(/cámara, micrófono/);
  });

  it("avisa que está cargando en lugar de montar el iframe", () => {
    render(<DiditVerificationModal {...props({ cargando: true, url: null })} />);
    expect(screen.getByRole("status")).toHaveTextContent(/Procesando verificación/i);
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("abre en nueva ventana solo con una URL de Didit válida", async () => {
    const user = userEvent.setup();
    const windowOpen = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<DiditVerificationModal {...props()} />);

    await user.click(screen.getByRole("button", { name: /abrir en.*(ventana|nueva)/i }));
    expect(windowOpen).toHaveBeenCalled();

    windowOpen.mockRestore();
  });

  it("cierra al llegar 'cancelado' desde un origen de Didit válido", () => {
    const onCerrar = vi.fn();
    render(<DiditVerificationModal {...props({ onCerrar })} />);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://verify.didit.me",
        data: JSON.stringify({ type: "didit:cancel" }),
      }),
    );

    expect(onCerrar).toHaveBeenCalled();
  });

  it("finaliza al llegar 'complete' desde un subdominio de Didit", () => {
    const onFinalizar = vi.fn();
    render(<DiditVerificationModal {...props({ onFinalizar })} />);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://apx.didit.me",
        data: JSON.stringify({ type: "didit:complete" }),
      }),
    );

    expect(onFinalizar).toHaveBeenCalled();
  });

  it("rechaza mensajes de un origen que no es Didit", () => {
    const onFinalizar = vi.fn();
    render(<DiditVerificationModal {...props({ onFinalizar })} />);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://atacante.test",
        data: JSON.stringify({ type: "didit:complete" }),
      }),
    );

    expect(onFinalizar).not.toHaveBeenCalled();
  });
});
