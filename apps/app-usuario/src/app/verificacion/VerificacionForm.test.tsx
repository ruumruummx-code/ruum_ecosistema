// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VerificacionForm } from "./VerificacionForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("VerificacionForm", () => {
  it("en revisión muestra sólo la acción Didit y no duplica el formulario manual", () => {
    render(<VerificacionForm fotoPerfilInicial="https://cdn.example/foto.jpg" soloDidit />);

    expect(screen.getByRole("button", { name: /iniciar verificación con didit/i })).toBeInTheDocument();
    expect(screen.queryByText(/prefiero subir mis documentos manualmente/i)).not.toBeInTheDocument();
  });

  it("sin soloDidit ofrece la subida manual de documentos", async () => {
    const user = userEvent.setup();
    render(<VerificacionForm />);

    // La vía manual vive en un desplegable cerrado.
    const resumen = screen.getByText(/prefiero subir mis documentos manualmente/i);
    expect(resumen).toBeInTheDocument();
    await user.click(resumen);

    // El CP no tiene <label htmlFor>: se localiza por placeholder.
    expect(screen.getByPlaceholderText("06600")).toBeInTheDocument();
  });

  it("rechaza un archivo por extensión no aceptada", async () => {
    const user = userEvent.setup();
    render(<VerificacionForm />);

    // Abrir la vía manual para exponer el input de archivo.
    await user.click(screen.getByText(/prefiero subir mis documentos manualmente/i));

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File(["x"], "documento.exe", { type: "application/x-msdownload" }));

    // El texto está partido por la interpolación del tamaño máximo, así que se
    // busca por contenido en lugar de por texto exacto.
    expect(
      await screen.findByText(
        (_contenido, elemento) =>
          elemento?.tagName === "P" && /Formatos aceptados/i.test(elemento.textContent ?? ""),
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();
  });
});
