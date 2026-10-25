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

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const { priority: _priority, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={props.alt ?? ""} />;
  },
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

vi.mock("@ruum/api/services", () => ({
  avanzarEstadoTraslado: (...args: unknown[]) => avanzarEstadoTrasladoMock(...args),
  activarSoporteEmergenciaConductor: vi.fn(),
  registrarInteraccionPanelEmergenciaConductor: vi.fn(),
  reportarIncidencia: vi.fn(),
  obtenerMensajes: vi.fn().mockResolvedValue([]),
  enviarMensaje: vi.fn().mockResolvedValue(undefined),
  suscribirseAMensajes: vi.fn().mockReturnValue({}),
}));

import { TrasladoAsignadoDetails } from "../src/app/viajes/[id]/TrasladoAsignadoDetails";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const pasaportePrototipo = {
  traslado_id: "traslado-prototipo-001",
  estado: "conductor_asignado",
  conductor_id: "conductor-001",
  origen_ciudad: "Ciudad de México",
  origen_direccion: "LONDRES 899, Juárez, 06600, Ciudad de México",
  origen_referencias: "ZIP 0293",
  origen_lat: 19.425,
  origen_lng: -99.166,
  destino_ciudad: "Metepec",
  destino_direccion: "Los Serranos 225, Uno Residencial, 52104, Metepec, Méx.",
  vehiculo_marca: "Chrysler",
  vehiculo_modelo: "Stratus",
  vehiculo_anio: 2015,
  vehiculo_color: "Gris",
  vehiculo_tipo: "sedan",
  vehiculo_placas: "POM365",
  contacto_entrega_nombre: "Héctor Lomelín",
  contacto_entrega_telefono: "+525512345678",
  ganancia_conductor: 531.45,
  distancia_km: 50.7,
  tiempo_estimado_horas: 70 / 60,
  creado_en: "2026-10-24T18:32:00.000Z",
} as PasaporteRow;

describe("[UI/UX] Pantalla de Traslado Asignado Mobile-First", () => {
  it("renderiza el layout compacto 100vh sin scroll, header institucional, estado actual y cita", () => {
    const { container } = render(
      <TrasladoAsignadoDetails pasaporte={pasaportePrototipo} volver="/viajes" />
    );

    const root = container.querySelector("[data-assigned-trip]");
    expect(root).not.toBeNull();
    expect(root?.className).toContain("h-screen");
    expect(root?.className).toContain("overflow-hidden");

    // 1. Header Institucional y Cita
    expect(screen.getByRole("img", { name: "Ruum Ruum" })).toBeTruthy();
    const btnEmergencia = screen.getByRole("button", { name: "Abrir emergencia" });
    expect(btnEmergencia.textContent).toContain("Emergencia");

    const estadoCita = screen.getByLabelText("Estado actual y cita");
    expect(within(estadoCita).getByText("ESTADO ACTUAL")).toBeTruthy();
    expect(within(estadoCita).getByText("Asignado")).toBeTruthy();
    expect(within(estadoCita).getByText("CITA")).toBeTruthy();
    expect(within(estadoCita).getByText("12:32 p.m. hoy")).toBeTruthy();
  });

  it("renderiza el bloque de próxima acción, la tarjeta unificada del vehículo con métricas punteadas y la sección de recolección/contacto", () => {
    render(<TrasladoAsignadoDetails pasaporte={pasaportePrototipo} volver="/viajes" />);

    // 2. Bloque de Próxima Acción
    expect(screen.getByText("TU PRÓXIMA ACCIÓN")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Prepárate para salir" })).toBeTruthy();
    expect(screen.getByText("Revisa la información del vehículo y el contacto.")).toBeTruthy();

    // 3. Tarjeta Unificada de Vehículo a Trasladar
    const cardVehiculo = screen.getByLabelText("Vehículo a trasladar");
    expect(within(cardVehiculo).getByRole("img", { name: "Chrysler Stratus 2015" })).toBeTruthy();
    expect(within(cardVehiculo).getByText("VEHÍCULO A TRASLADAR")).toBeTruthy();
    expect(within(cardVehiculo).getByRole("heading", { name: "Chrysler Stratus 2015" })).toBeTruthy();
    expect(within(cardVehiculo).getByText("Color: Gris")).toBeTruthy();
    expect(within(cardVehiculo).getByText("SEDÁN")).toBeTruthy();
    expect(within(cardVehiculo).getByText("PLACAS")).toBeTruthy();
    expect(within(cardVehiculo).getByText("POM365")).toBeTruthy();

    const metricas = within(cardVehiculo).getByLabelText("Métricas del viaje");
    expect(metricas.className).toContain("border-dashed");
    expect(within(metricas).getByText("$531.45")).toBeTruthy();
    expect(within(metricas).getByText("50.7 km")).toBeTruthy();
    expect(within(metricas).getByText("01:10 h")).toBeTruthy();

    // 4. Sección de Recolección y Contacto del Pasajero
    const recoleccion = screen.getByLabelText("Punto de recolección y contacto");
    expect(within(recoleccion).getByText("PUNTO DE RECOLECCIÓN")).toBeTruthy();
    expect(within(recoleccion).getByText("Ciudad de México")).toBeTruthy();
    expect(within(recoleccion).getByText("(ZIP 0293)")).toBeTruthy();
    expect(within(recoleccion).getByText("LONDRES 899, Juárez, 06600, Ciudad de México")).toBeTruthy();
    expect(within(recoleccion).getByText("Héctor Lomelín")).toBeTruthy();
    expect(within(recoleccion).getByText("Entrega la unidad")).toBeTruthy();
    expect(
      within(recoleccion).getByRole("link", { name: "Llamar a Héctor Lomelín" }).getAttribute("href")
    ).toBe("tel:+525512345678");
    expect(
      within(recoleccion).getByRole("button", { name: "Abrir chat con Héctor Lomelín" })
    ).toBeTruthy();
  });

  it("renderiza accesos rápidos a Google Maps y Waze, botón dominante en verde agua y navegación inferior fija", async () => {
    avanzarEstadoTrasladoMock.mockResolvedValueOnce("conductor_en_camino_al_origen");
    render(<TrasladoAsignadoDetails pasaporte={pasaportePrototipo} volver="/viajes" />);

    // 5. Accesos Rápidos a GPS externos (sin mapa estático)
    const gpsGroup = screen.getByRole("group", { name: "Accesos rápidos a GPS externos" });
    expect(within(gpsGroup).getByRole("link", { name: /Abrir en Google Maps/i })).toBeTruthy();
    expect(within(gpsGroup).getByRole("link", { name: /Abrir en Waze/i })).toBeTruthy();

    // 6. Botón de Acción Dominante
    const ctaButton = screen.getByRole("button", {
      name: /Iniciar camino al punto de recolección/i,
    });
    expect(ctaButton.textContent).toContain("Iniciar camino al punto de recolección");
    fireEvent.click(ctaButton);

    await waitFor(() => {
      expect(avanzarEstadoTrasladoMock).toHaveBeenCalledWith(
        expect.anything(),
        "traslado-prototipo-001",
        "conductor_asignado"
      );
      expect(refreshMock).toHaveBeenCalled();
    });

    // 7. Menú de Navegación Inferior (Fijo)
    const mobileNav = screen.getByRole("navigation", { name: "Navegación principal móvil" });
    expect(within(mobileNav).getByRole("link", { name: "Inicio" }).getAttribute("href")).toBe("/panel");
    expect(within(mobileNav).getByRole("link", { name: "Traslados" }).getAttribute("aria-current")).toBe(
      "page"
    );
    expect(within(mobileNav).getByRole("link", { name: "Cuenta" }).getAttribute("href")).toBe("/cuenta");
  });
});
