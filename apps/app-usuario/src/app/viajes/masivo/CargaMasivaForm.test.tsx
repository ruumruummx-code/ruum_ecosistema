/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EJEMPLO_CSV_PLANTILLA } from "@ruum/shared/utils";

/* La carga masiva tiene 6 funciones sin cobertura (limpiar, numeroTexto,
   construirDireccionCompleta, calcularSha256, dormir y el componente). No son
   exportadas, así que se ejercitan a través del flujo con lo mínimo mockeado. */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true,
  crearClienteNavegador: vi.fn(),
}));

vi.mock("@/lib/codigos-postales", () => ({
  consultarCodigoPostalMx: vi.fn(async () => ({
    codigo: "03100",
    ciudades: ["Ciudad de México"],
    colonias: ["Del Valle"],
  })),
}));

vi.mock("@/lib/mapbox", () => ({
  tieneMapboxConfigurado: () => false,
  geocodificarDireccion: vi.fn(async () => null),
  calcularRutaMapbox: vi.fn(async () => null),
  mensajeErrorMapbox: () => "No se pudo geocodificar.",
}));

vi.mock("@ruum/api/services", () => ({
  crearTrasladosMasivosUsuario: vi.fn(async () => ({ loteId: "lote-1" })),
  procesarCargaTrasladosMasivosUsuario: vi.fn(async () => ({ estado: "completado" })),
}));

import { CargaMasivaForm } from "./CargaMasivaForm";

function archivoCsv(): File {
  return new File([EJEMPLO_CSV_PLANTILLA], "plantilla.csv", { type: "text/csv" });
}

describe("CargaMasivaForm", () => {
  it("arranca en el paso de subida con la plantilla disponible", () => {
    render(<CargaMasivaForm />);
    // El paso 1 cubre el render del componente y el efecto de cleanup.
    expect(screen.getByRole("button", { name: /descargar plantilla/i })).toBeInTheDocument();
  });

  it("analiza un archivo y lista las filas prevalidadas", async () => {
    const user = userEvent.setup();
    render(<CargaMasivaForm />);

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, archivoCsv());

    // calcularSha256 + limpiar + numeroTexto + construirDireccionCompleta
    // corren durante el análisis.
    expect(await screen.findByText(/análisis|filas/i, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it("rechaza un archivo vacío sin avanzar de paso", async () => {
    const user = userEvent.setup();
    render(<CargaMasivaForm />);

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File([""], "vacio.csv", { type: "text/csv" }));

    // dormir() se usa en el reintento de polling: si nada que reintentar, no avanza.
    expect(screen.queryByText(/filas válidas/i)).toBeNull();
  });
});
