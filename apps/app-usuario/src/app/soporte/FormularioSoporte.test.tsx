/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const reportarIncidenciaMock = vi.fn();
vi.mock("@ruum/api/services", () => ({
  reportarIncidencia: (...args: unknown[]) => reportarIncidenciaMock(...args),
}));

const tieneSupabaseMock = vi.fn(() => true);
vi.mock("../../lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => tieneSupabaseMock(),
  crearClienteNavegador: () => ({}),
}));

vi.mock("../../lib/analytics", () => ({
  registrarEventoUx: vi.fn(),
}));

import { FormularioSoporte } from "./FormularioSoporte";
import { BotonTema, TemaProvider, useTema } from "../TemaProvider";

function ConsumidorTema() {
  const { tema, modo, alternar, fijar } = useTema();
  return (
    <div>
      <span data-testid="tema-actual">{tema}</span>
      <span data-testid="modo-actual">{modo}</span>
      <button type="button" onClick={alternar}>
        Alternar
      </button>
      <button type="button" onClick={() => fijar("dark")}>
        Fijar Oscuro
      </button>
      <BotonTema />
    </div>
  );
}

describe("FormularioSoporte", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tieneSupabaseMock.mockReturnValue(true);
  });

  it("valida longitud mínima, registra incidencia con folio y hace fallback a mailto en consulta general o error", async () => {
    const user = userEvent.setup();
    reportarIncidenciaMock.mockResolvedValueOnce({ id: "abcdef12-3456-7890" });

    render(
      <FormularioSoporte
        traslados={[{ id: "viaje-12345678", label: "CDMX → MTY" }]}
        preseleccionado="viaje-12345678"
        emailUsuario="usuario@ruum.mx"
        motivoInicial="Reportar daño o incidente"
      />
    );

    const textarea = screen.getByLabelText(/Descripción/i);
    await user.type(textarea, "Corto");
    expect(screen.getByText("Mínimo 10 caracteres")).toBeInTheDocument();

    // Con viaje seleccionado -> reportarIncidencia + folio
    await user.clear(textarea);
    await user.type(textarea, "Descripción detallada del incidente ocurrido en ruta.");
    await user.click(screen.getByRole("button", { name: "Enviar a soporte" }));

    await waitFor(() => {
      expect(reportarIncidenciaMock).toHaveBeenCalledWith(
        expect.anything(),
        "viaje-12345678",
        "dano_previo_relevante",
        "durante_traslado",
        expect.stringContaining("Descripción detallada")
      );
    });
    expect((await screen.findAllByText(/INC-ABCDEF12/)).length).toBeGreaterThan(0);

    // Sin viaje seleccionado -> mailto
    await user.selectOptions(screen.getByLabelText(/Viaje relacionado/i), "");
    await user.type(textarea, "Consulta general sobre facturación mensual.");
    await user.click(screen.getByRole("button", { name: "Enviar a soporte" }));
    expect(await screen.findByText(/Abrimos tu cliente de correo con el mensaje prellenado/i)).toBeInTheDocument();

    // Con viaje pero error en BD -> fallback a mailto
    reportarIncidenciaMock.mockRejectedValueOnce(new Error("DB error"));
    await user.selectOptions(screen.getByLabelText(/Viaje relacionado/i), "viaje-12345678");
    await user.clear(textarea);
    await user.type(textarea, "Otro reporte cuando la base de datos falla.");
    await user.click(screen.getByRole("button", { name: "Enviar a soporte" }));
    expect(await screen.findByText(/Abrimos tu cliente de correo para enviar tu reporte/i)).toBeInTheDocument();
  });
});

describe("TemaProvider y BotonTema", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("gestiona modos claro, oscuro y automático sincronizando con localStorage y data-theme", async () => {
    const user = userEvent.setup();
    render(
      <TemaProvider>
        <ConsumidorTema />
      </TemaProvider>
    );

    expect(screen.getByTestId("modo-actual")).toHaveTextContent("auto");

    await user.click(screen.getByRole("button", { name: "Fijar Oscuro" }));
    expect(screen.getByTestId("tema-actual")).toHaveTextContent("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Alternar" }));
    expect(screen.getByTestId("tema-actual")).toHaveTextContent("light");

    await user.click(screen.getByLabelText("Oscuro"));
    expect(screen.getByTestId("modo-actual")).toHaveTextContent("dark");

    await user.click(screen.getByLabelText("Automático (sistema)"));
    expect(screen.getByTestId("modo-actual")).toHaveTextContent("auto");

    // Simular submit con descripción corta forzando evento en formulario
    const { container } = render(<FormularioSoporte traslados={[]} />);
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByText(/Describe con al menos 10 caracteres/i)).toBeInTheDocument();
  });
});
