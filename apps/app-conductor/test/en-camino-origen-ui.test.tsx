// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PasaporteRow } from "../src/app/viajes/trips-utils";

const refreshMock = vi.fn();
const avanzarEstadoTrasladoMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}),
}));

vi.mock("@ruum/api/drivers", () => ({
  listarGastosTraslado: vi.fn().mockResolvedValue([]),
  registrarGastoTraslado: vi.fn().mockResolvedValue({}),
  eliminarGastoTraslado: vi.fn().mockResolvedValue({}),
}));

vi.mock("@ruum/api/services", () => ({
  avanzarEstadoTraslado: (...args: unknown[]) => avanzarEstadoTrasladoMock(...args),
  extraerRutaComprobante: (desc: string | null, ruta: string | null) => ({
    ruta: ruta ?? null,
    texto: desc ?? null,
  }),
  activarSoporteEmergenciaConductor: vi.fn(),
  registrarInteraccionPanelEmergenciaConductor: vi.fn(),
  reportarIncidencia: vi.fn(),
}));

import { DirigeteAOrigenDetails } from "../src/app/viajes/[id]/DirigeteAOrigenDetails";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const pasaporteEnCamino = {
  traslado_id: "traslado-en-camino-001",
  estado: "conductor_en_camino_al_origen",
  conductor_id: "conductor-001",
  origen_ciudad: "Ciudad de México",
  origen_direccion: "LONDRES 819, Juárez, 06600, Ciudad de México",
  origen_lat: 19.425,
  origen_lng: -99.166,
  destino_ciudad: "Metepec",
  destino_direccion: "Los Serranos 225, Uno Residencial, 52104, Metepec, Méx.",
  distancia_km: 50.7,
  tiempo_estimado_horas: 70 / 60,
} as PasaporteRow;

describe("[UI/UX] Pantalla de Traslado Activo: En Camino al Origen Mobile-First", () => {
  it("renderiza contenedor 100vh no-scroll, header con botón regresar, título 'Traslado activo', botón de Emergencia y 3 pestañas superiores", () => {
    const { container } = render(
      <DirigeteAOrigenDetails pasaporte={pasaporteEnCamino} volver="/viajes" />
    );

    const root = container.querySelector("[data-en-camino-origen]");
    expect(root).not.toBeNull();
    expect(root?.className).toContain("h-screen");
    expect(root?.className).toContain("overflow-hidden");

    // 1. Header y Pestañas de Gestión Superior
    const header = screen.getByLabelText("Encabezado de traslado activo");
    expect(
      within(header).getByRole("link", { name: "Volver a la lista de Traslados" }).getAttribute("href")
    ).toBe("/viajes");
    expect(within(header).getByText("Traslado activo")).toBeTruthy();
    const btnEmergencia = within(header).getByRole("button", { name: "Abrir emergencia" });
    expect(btnEmergencia.textContent).toContain("Emergencia");

    const secondaryNav = screen.getByRole("navigation", {
      name: "Navegación secundaria del traslado",
    });
    expect(
      within(secondaryNav).getByRole("link", { name: /Detalles/i }).getAttribute("aria-current")
    ).toBe("page");
    expect(within(secondaryNav).getByRole("button", { name: /Gastos/i })).toBeTruthy();
    expect(within(secondaryNav).getByRole("button", { name: /Incidencia/i })).toBeTruthy();
  });

  it("renderiza la caja de estado dinámica, el módulo de próxima acción y la tarjeta de recolección con mini mapa e integración GPS", () => {
    render(<DirigeteAOrigenDetails pasaporte={pasaporteEnCamino} volver="/viajes" />);

    // 2. Caja de Estado Dinámica
    const estadoBox = screen.getByLabelText("Estado actual del traslado");
    expect(within(estadoBox).getByText("Estado actual")).toBeTruthy();
    expect(within(estadoBox).getByText("En camino al origen")).toBeTruthy();
    expect(
      within(estadoBox).getByText("El conductor se dirige al punto de recolección.")
    ).toBeTruthy();

    // 3. Módulo de Próxima Acción
    const proximaAccion = screen.getByLabelText("Próxima acción");
    expect(within(proximaAccion).getByText("TU PRÓXIMA ACCIÓN")).toBeTruthy();
    expect(within(proximaAccion).getByRole("heading", { name: "Dirígete al origen" })).toBeTruthy();
    expect(
      within(proximaAccion).getByText(
        "Navega con tu app favorita hacia el punto de recolección y registra tu llegada al estar en sitio."
      )
    ).toBeTruthy();

    // 4. Tarjeta de Recolección con Mapa Integrado
    const cardRecoleccion = screen.getByLabelText("Punto de recolección y navegación");
    expect(within(cardRecoleccion).getByText("Punto de recolección")).toBeTruthy();
    expect(within(cardRecoleccion).getByRole("heading", { name: "Ciudad de México" })).toBeTruthy();
    expect(
      within(cardRecoleccion).getByText("LONDRES 819, Juárez, 06600, Ciudad de México")
    ).toBeTruthy();
    expect(
      within(cardRecoleccion).getByRole("img", {
        name: "Mapa estático del punto de recolección en Ciudad de México",
      })
    ).toBeTruthy();

    const gpsGroup = within(cardRecoleccion).getByRole("group", {
      name: "Accesos rápidos a GPS",
    });
    expect(within(gpsGroup).getByRole("link", { name: /Abrir en Google Maps/i })).toBeTruthy();
    expect(within(gpsGroup).getByRole("link", { name: /Abrir en Waze/i })).toBeTruthy();
  });

  it("renderiza las métricas de aproximación, el botón '🏁 Ya llegué al origen' y la barra de navegación inferior fija", async () => {
    avanzarEstadoTrasladoMock.mockResolvedValueOnce("conductor_en_punto_de_recoleccion");
    render(<DirigeteAOrigenDetails pasaporte={pasaporteEnCamino} volver="/viajes" />);

    // 5. Métricas de Aproximación
    const metricas = screen.getByLabelText("Métricas de aproximación");
    expect(within(metricas).getByText("Distancia al origen")).toBeTruthy();
    expect(within(metricas).getByText("50.7 km")).toBeTruthy();
    expect(within(metricas).getByText("Tiempo estimado")).toBeTruthy();
    expect(within(metricas).getByText("01:10 h")).toBeTruthy();

    // 6. Botón de Confirmación de Llegada (Fijo en Base)
    const ctaBtn = screen.getByRole("button", { name: /Ya llegué al origen/i });
    expect(ctaBtn.textContent).toContain("Ya llegué al origen");
    fireEvent.click(ctaBtn);

    await waitFor(() => {
      expect(avanzarEstadoTrasladoMock).toHaveBeenCalledWith(
        expect.anything(),
        "traslado-en-camino-001",
        "conductor_en_camino_al_origen"
      );
      expect(refreshMock).toHaveBeenCalled();
    });

    // 7. Navegación Inferior Estándar
    const mobileNav = screen.getByRole("navigation", { name: "Navegación principal móvil" });
    expect(within(mobileNav).getByRole("link", { name: "Inicio" }).getAttribute("href")).toBe(
      "/panel"
    );
    expect(
      within(mobileNav).getByRole("link", { name: "Traslados" }).getAttribute("aria-current")
    ).toBe("page");
    expect(within(mobileNav).getByRole("link", { name: "Cuenta" }).getAttribute("href")).toBe(
      "/cuenta"
    );
  });
});
