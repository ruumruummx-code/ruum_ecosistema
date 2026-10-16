/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

import { MisTrasladosCliente } from "./MisViajesCliente";

function viaje(estado: string, id = "t-1", marca = "Nissan", modelo = "Versa") {
  return {
    pasaporte: {
      traslado_id: id,
      estado,
      vehiculo_marca: marca,
      vehiculo_modelo: modelo,
      vehiculo_anio: "2020",
      vehiculo_placas: "ABC123",
      vehiculo_tipo: "sedan",
      conductor_nombre: null,
      creado_en: "2026-01-01T00:00:00.000Z",
      monto_pagado: 0,
      distancia_km: null,
      tiempo_estimado_horas: null,
      origen_ciudad: "CDMX",
      origen_direccion: "Origen",
      destino_ciudad: "Toluca",
      destino_direccion: "Destino",
    },
    traslado: null,
  } as never;
}

describe("MisTrasladosCliente", () => {
  it("muestra estado vacío sin duplicar el CTA universal", async () => {
    render(<MisTrasladosCliente Traslados={[]} pestanaInicial="activos" />);
    // La búsqueda tiene debounce de 300ms: esperar a que salga el skeleton.
    expect(await screen.findByText(/sin traslados/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /solicitar traslado/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /contactar soporte/i })).not.toBeInTheDocument();
  });

  it("clasifica en programados y filtra por pestaña", async () => {
    const user = userEvent.setup();
    render(
      <MisTrasladosCliente
        Traslados={[
          viaje("cotizacion_generada"),
          viaje("servicio_cerrado", "t-2", "Toyota", "Corolla"),
        ]}
        pestanaInicial="programados"
      />
    );
    expect(await screen.findByText(/Nissan Versa 2020/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /finalizados/i }));
    // handlePestanaChange envuelve setPestana en startTransition: el render puede
    // no haberse aplicado aún tras el click. Sin waitFor la aserción lee la lista
    // anterior y flaquea bajo carga (falla 1 de cada N ejecuciones paralelas).
    await waitFor(() => {
      expect(screen.queryByText(/Nissan Versa 2020/)).toBeNull();
    });
  });
  it("permite navegar los filtros con teclado y buscar sin cambiar de categoría", async () => {
    const user = userEvent.setup();
    render(<MisTrasladosCliente Traslados={[viaje("servicio_cerrado", "t-2", "Toyota", "Corolla")]} pestanaInicial="activos" />);
    const activos = screen.getByRole("button", { name: /^Activos/ });
    activos.focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: /^Cancelados/ })).toHaveFocus();
    expect(screen.getByRole("button", { name: /^Cancelados/ })).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{ArrowLeft}");
    expect(await screen.findByText("Toyota Corolla 2020")).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Buscar traslado" }), "inexistente");
    expect(await screen.findByText("No se encontraron traslados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Finalizados/ })).toHaveAttribute("aria-pressed", "true");
  });
});
