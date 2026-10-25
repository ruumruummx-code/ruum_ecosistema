// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { PasaporteRow } from "../src/app/viajes/trips-utils";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const pushMock = vi.fn();
const refreshMock = vi.fn();
const avanzarEstadoTrasladoMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
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

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
    ...rest
  }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
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

vi.mock("../src/app/viajes/[id]/ChatViaje", () => ({
  ChatViaje: () => <div data-testid="chat-viaje-mock">Chat Viaje Component</div>,
}));

import { LocalizarVehiculoDetails } from "../src/app/viajes/[id]/LocalizarVehiculoDetails";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const pasaporteRecibeVehiculo = {
  traslado_id: "traslado-recibe-001",
  estado: "conductor_en_punto_de_recoleccion",
  conductor_id: "conductor-001",
  vehiculo_placas: "POM365",
  vehiculo_vin: "88888888888888888",
  vehiculo_marca: "Chrysler",
  vehiculo_modelo: "Stratus",
  contacto_entrega_nombre: "Héctor Lomelín",
  contacto_entrega_telefono: "+525555555555",
} as PasaporteRow;

describe("[UI/UX] Pantalla de Traslado Activo: Recibe el Vehículo Mobile-First", () => {
  it("renderiza layout 100vh no-scroll, header con botón volver, título, emergencia y pestañas de gestión", () => {
    const { container } = render(
      <LocalizarVehiculoDetails pasaporte={pasaporteRecibeVehiculo} volver="/viajes" />
    );

    const root = container.querySelector("[data-recibe-vehiculo]");
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

  it("renderiza caja de estado dinámica En el origen con enlace a detalles", () => {
    render(<LocalizarVehiculoDetails pasaporte={pasaporteRecibeVehiculo} volver="/viajes" />);

    const estadoLink = screen.getByRole("link", {
      name: /Estado actual: En el origen/i,
    });
    expect(estadoLink.getAttribute("href")).toBe("/viajes/traslado-recibe-001/detalles");
    expect(within(estadoLink).getByText(/ESTADO ACTUAL/i)).toBeTruthy();
    expect(within(estadoLink).getByText("En el origen")).toBeTruthy();
  });

  it("renderiza módulo de próxima acción con texto instructivo e ilustración de checklist", () => {
    render(<LocalizarVehiculoDetails pasaporte={pasaporteRecibeVehiculo} volver="/viajes" />);

    const accionSection = screen.getByRole("region", { name: "Próxima acción" });
    expect(within(accionSection).getByText("TU PRÓXIMA ACCIÓN")).toBeTruthy();
    expect(within(accionSection).getByRole("heading", { name: "Recibe el vehículo" })).toBeTruthy();
    expect(
      within(accionSection).getByText(
        "Localiza la unidad e inicia la inspección física y fotográfica."
      )
    ).toBeTruthy();

    const img = screen.getByAltText("Ilustración de inspección de vehículo con checklist");
    expect(img.getAttribute("src")).toBe("/imagenes/inspeccion-checklist.svg");
  });

  it("renderiza sección de contacto con inicial, nombre, teléfono y 3 botones de comunicación rápida", () => {
    render(<LocalizarVehiculoDetails pasaporte={pasaporteRecibeVehiculo} volver="/viajes" />);

    const contactoSection = screen.getByRole("region", { name: "Contacto de recolección" });
    expect(within(contactoSection).getByText("CONTACTO DE RECOLECCIÓN")).toBeTruthy();
    expect(within(contactoSection).getByText(/Héctor Lomelín/i)).toBeTruthy();
    expect(within(contactoSection).getByText("+525555555555")).toBeTruthy();
    expect(within(contactoSection).getByText("H")).toBeTruthy();

    // WhatsApp
    const waLink = within(contactoSection).getByRole("link", {
      name: "Enviar WhatsApp a Héctor Lomelín",
    });
    expect(waLink.getAttribute("href")).toBe("https://wa.me/525555555555");
    expect(waLink.getAttribute("target")).toBe("_blank");

    // Teléfono
    const telLink = within(contactoSection).getByRole("link", {
      name: "Llamar a Héctor Lomelín",
    });
    expect(telLink.getAttribute("href")).toBe("tel:+525555555555");

    // Chat
    const chatBtn = within(contactoSection).getByRole("button", {
      name: "Abrir chat con Héctor Lomelín",
    });
    expect(chatBtn).toBeTruthy();

    // Abrir diálogo de chat
    fireEvent.click(chatBtn);
    expect(screen.getByTestId("chat-viaje-mock")).toBeTruthy();
    expect(screen.getByText("Chat · Héctor Lomelín")).toBeTruthy();
  });

  it("renderiza cuadrícula de datos del vehículo 2x2 (Placas, VIN, Marca, Modelo)", () => {
    render(<LocalizarVehiculoDetails pasaporte={pasaporteRecibeVehiculo} volver="/viajes" />);

    const vehiculoSection = screen.getByRole("region", {
      name: "Datos del vehículo a localizar",
    });
    expect(within(vehiculoSection).getByText("VEHÍCULO A LOCALIZAR")).toBeTruthy();
    expect(within(vehiculoSection).getByText("Chrysler Stratus")).toBeTruthy();

    expect(within(vehiculoSection).getByText("PLACAS")).toBeTruthy();
    expect(within(vehiculoSection).getByText("POM365")).toBeTruthy();

    expect(within(vehiculoSection).getByText("NÚMERO VIN")).toBeTruthy();
    expect(within(vehiculoSection).getByText("88888888888888888")).toBeTruthy();

    expect(within(vehiculoSection).getByText("MARCA")).toBeTruthy();
    expect(within(vehiculoSection).getByText("Chrysler")).toBeTruthy();

    expect(within(vehiculoSection).getByText("MODELO")).toBeTruthy();
    expect(within(vehiculoSection).getByText("Stratus")).toBeTruthy();
  });

  it("avanza estado y navega a evidencia al presionar el botón primario 'INICIAR INSPECCIÓN Y EVIDENCIA'", async () => {
    avanzarEstadoTrasladoMock
      .mockResolvedValueOnce("verificacion_vehiculo_en_proceso")
      .mockResolvedValueOnce("verificacion_vehiculo_en_proceso");

    render(<LocalizarVehiculoDetails pasaporte={pasaporteRecibeVehiculo} volver="/viajes" />);

    const btnIniciar = screen.getByRole("button", {
      name: /INICIAR INSPECCIÓN Y EVIDENCIA/i,
    });
    expect(btnIniciar).toBeTruthy();

    fireEvent.click(btnIniciar);

    await waitFor(() => {
      expect(avanzarEstadoTrasladoMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/viajes/traslado-recibe-001/evidencia");
    });
  });

  it("renderiza la barra de navegación inferior estándar fija con Traslados como página activa", () => {
    render(<LocalizarVehiculoDetails pasaporte={pasaporteRecibeVehiculo} volver="/viajes" />);

    const nav = screen.getByRole("navigation", { name: "Navegación principal móvil" });
    const linkInicio = within(nav).getByRole("link", { name: /Inicio/i });
    const linkTraslados = within(nav).getByRole("link", { name: /Traslados/i });
    const linkCuenta = within(nav).getByRole("link", { name: /Cuenta/i });

    expect(linkInicio.getAttribute("href")).toBe("/panel");
    expect(linkTraslados.getAttribute("href")).toBe("/viajes");
    expect(linkTraslados.getAttribute("aria-current")).toBe("page");
    expect(linkCuenta.getAttribute("href")).toBe("/cuenta");
  });
});
