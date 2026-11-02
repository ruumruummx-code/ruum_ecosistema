// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const fixtures = vi.hoisted(() => ({ totalOfertas: 1 }));

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
  listarTrasladosDisponibles: async () => Array.from({ length: fixtures.totalOfertas }, (_, i) => ({ traslado_id: `oferta-${i + 1}`, origen_ciudad: "Tuxtla", destino_ciudad: "Lerma" })),
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

afterEach(() => { cleanup(); fixtures.totalOfertas = 1; });

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
  it("permite recorrer las diez ofertas y abrir el detalle correspondiente", async () => {
    fixtures.totalOfertas = 10;
    render(<PaginaTraslados />);
    await screen.findByRole("link", { name: "Ver oferta" });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    const anterior = screen.getByRole("button", { name: "Anterior" });
    const siguiente = screen.getByRole("button", { name: "Siguiente" });
    expect((anterior as HTMLButtonElement).disabled).toBe(true);
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(`${i} de 10`)).toBeTruthy();
      expect(screen.getByRole("link", { name: "Ver oferta" }).getAttribute("href")).toContain(`/viajes/oferta-${i}?`);
      if (i < 10) fireEvent.click(siguiente);
    }
    expect((siguiente as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(anterior);
    expect(screen.getByText("9 de 10")).toBeTruthy();
    // Los controles permanecen fuera de la región desplazable de la tarjeta.
    const paginacion = screen.getByRole("group", { name: "Paginación de traslados" });
    const tarjeta = screen.getByRole("article", { name: "Oferta de traslado" });
    expect(paginacion.parentElement).toBe(tarjeta.parentElement?.parentElement);
    expect(paginacion.compareDocumentPosition(tarjeta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

});
