/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AppStateProvider } from "@/state/AppStateProvider";

// Mocks para evitar red real
vi.mock("next/navigation", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...(actual as object),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    usePathname: () => "/viajes/nuevo",
    useSearchParams: () => new URLSearchParams(),
  };
});
vi.mock("@/lib/supabase-browser", () => ({
  crearClienteNavegador: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
    })),
    rpc: vi.fn(async () => ({ data: null, error: null })),
  })),
  tieneSupabaseConfigurado: vi.fn(() => false),
}));
vi.mock("@ruum/api/services", () => ({
  crearTraslado: vi.fn(async () => ({
    id: "traslado-123",
    tipo_pago: "anticipado",
    precio_cotizado: 500,
  })),
  listarVehiculosDeUsuario: vi.fn(async () => []),
  obtenerUsuarioActual: vi.fn(async () => null),
  previsualizarTarifaUsuario: vi.fn(async () => ({
    disponible: true,
    tarifa: 500,
  })),
  aceptarCotizacionUsuario: vi.fn(async () => ({})),
}));
vi.mock("@/lib/codigos-postales", () => ({
  consultarCodigoPostalMx: vi.fn(async (cp: string) =>
    cp === "06700"
      ? { estado: "CDMX", ciudades: ["CDMX"], colonias: ["Roma"] }
      : cp === "11560"
        ? { estado: "CDMX", ciudades: ["CDMX"], colonias: ["Polanco"] }
        : null,
  ),
}));
vi.mock("@/lib/mapbox", () => ({
  esErrorConfiguracionMapbox: vi.fn(() => false),
  mensajeErrorMapbox: vi.fn(() => "mock"),
  sugerirDireccionesAutocomplete: vi.fn(async () => []),
  sugerirDireccionesPorCodigoPostal: vi.fn(async () => []),
  tieneMapboxConfigurado: vi.fn(() => true),
  calcularRutaMapbox: vi.fn(async () => ({
    distanciaKm: 12.5,
    tiempoEstimadoHoras: 0.5,
  })),
  geocodificarDireccion: vi.fn(async () => ({ lat: 19.43, lng: -99.13 })),
}));

import { NuevoTrasladoForm as NuevoTrasladoFormPage } from "../NuevoTrasladoForm";
import * as trasladosService from "@ruum/api/services";

vi.mock("../hooks/useSesionTraslado", async () => {
  const { useEffect } = await import("react");
  return {
    useSesionTraslado: ({
      setSesionReal,
      setCargandoSesion,
    }: {
      setSesionReal: (v: boolean) => void;
      setCargandoSesion: (v: boolean) => void;
    }) => {
      useEffect(() => {
        setSesionReal(true);
        setCargandoSesion(false);
      }, [setSesionReal, setCargandoSesion]);
    },
  };
});
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  HTMLElement.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
  vi.clearAllMocks();
});
async function aceptarTarifa() {
  const user = userEvent.setup();
  render(
    React.createElement(
      AppStateProvider,
      null,
      React.createElement(
        NuevoTrasladoFormPage as unknown as React.ComponentType,
      ),
    ),
  );
  await user.type(screen.getByLabelText(/Código Postal de origen/i), "06700");
  await user.type(screen.getByLabelText(/Código Postal de destino/i), "11560");
  await user.selectOptions(screen.getByLabelText(/^Marca$/), "Nissan");
  await user.selectOptions(screen.getByLabelText(/^Modelo$/), "Versa");
  await user.selectOptions(screen.getByLabelText("Condición"), "seminueva");
  const continuar = await screen.findByRole(
    "button",
    { name: "Continuar · Tarifa est. $500 MXN" },
    { timeout: 8000 },
  );
  await waitFor(() => expect(continuar).toBeEnabled());
  await user.click(continuar);
  await screen.findByLabelText("Año");
  return user;
}
describe("Solicitud: tarifa y vehículo", () => {
  it("acepta la tarifa y exige los detalles obligatorios antes de avanzar", async () => {
    const user = await aceptarTarifa();
    expect(screen.getByText("Paso 2 de 5")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Año"), "2020");
    await user.click(
      screen.getByRole("button", { name: /Continuar · Tarifa:/ }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Detalles del vehículo" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Placas")).toBeInTheDocument();
    expect(trasladosService.crearTraslado).not.toHaveBeenCalled();
  }, 30000);
  it("bloquea el avance y vuelve a cotizar al cambiar el vehículo", async () => {
    const user = await aceptarTarifa();
    await user.clear(screen.getByLabelText("Marca"));
    await user.type(screen.getByLabelText("Marca"), "Toyota");
    await user.click(screen.getByRole("button", { name: "Revisar tarifa" }));
    expect(screen.getByText("Paso 1 de 5")).toBeInTheDocument();
    expect(trasladosService.crearTraslado).not.toHaveBeenCalled();
  }, 30000);
});
