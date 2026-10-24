// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("vista=disponibles"),
}));
vi.mock("@capacitor/preferences", () => ({
  Preferences: { get: vi.fn(async () => ({ value: "mapa" })), set: vi.fn() },
}));
vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true,
  crearClienteNavegador: () => ({ channel: () => ({ on: () => ({}) }) }),
}));
vi.mock("@ruum/shared/utils", () => ({
  traducirErrorOperativo: () => "Error de carga",
  suscribirCanalSeguro: () => () => {},
}));
vi.mock("@ruum/api/services", () => ({
  obtenerConductorActual: async () => null,
  listarTrasladosDisponibles: async () => [{ traslado_id: "oferta-1", origen_ciudad: "Tuxtla", destino_ciudad: "Lerma" }],
  listarTrasladosAceptados: async () => [],
  listarHistorialTrasladosConductor: async () => [],
  registrarEvento: vi.fn(),
}));
vi.mock("@ruum/api/drivers", () => ({ contarNotificacionesNoLeidas: async () => 0 }));
vi.mock("@ruum/api/transfers", () => ({ obtenerTrasladosPorIds: async () => [] }));
vi.mock("../src/app/viajes/DriverTrasladosView", () => ({
  DriverTrasladosView: ({ children, filters }: { children?: ReactNode; filters: ReactNode }) => <main>{filters}{children}</main>,
}));
vi.mock("../src/app/viajes/OfertaCard", () => ({
  OfertaCard: ({ hrefDetalle, mapPreview }: { hrefDetalle: string; mapPreview?: ReactNode }) => <article aria-label="Oferta de traslado">{mapPreview}<a href={hrefDetalle}>Ver oferta</a></article>,
}));
vi.mock("../src/app/viajes/AcceptedTripCard", () => ({ AcceptedTripCard: () => null }));
vi.mock("../src/app/viajes/ViajesMapa", () => ({ TrasladosMapa: () => <div aria-label="Mapa de ofertas" /> }));
vi.mock("../src/app/viajes/RejectTripDialog", () => ({ RejectTripDialog: () => null }));
vi.mock("../src/app/viajes/UndoRechazoToast", () => ({ UndoRechazoToast: () => null }));
vi.mock("../src/app/panel/PanelSupportSheet", () => ({ PanelSupportSheet: () => null }));

import PaginaTraslados from "../src/app/viajes/page";

afterEach(cleanup);

describe("ofertas del conductor con preferencia de mapa guardada", () => {
  it("mantiene la tarjeta y su acceso al detalle junto al mapa, y permite volver a lista", async () => {
    render(<PaginaTraslados />);
    await screen.findByLabelText("Mapa de ofertas");
    const link = await screen.findByRole("link", { name: "Ver oferta" });
    expect(link.getAttribute("href")).toContain("/viajes/oferta-1?");
    expect(screen.getByRole("article", { name: "Oferta de traslado" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Lista", exact: true }));
    await waitFor(() => expect(screen.queryByLabelText("Mapa de ofertas")).toBeNull());
    expect(screen.getByRole("link", { name: "Ver oferta" })).toBeTruthy();
  });
});
