// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { PasaporteRow } from "../src/app/viajes/trips-utils";

const refreshMock = vi.fn();
const pushMock = vi.fn();
const avanzarEstadoTrasladoMock = vi.fn();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: pushMock,
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

vi.mock("../src/app/viajes/[id]/ChatViaje", () => ({
  ChatViaje: () => <div data-testid="chat-viaje-mock">Chat Viaje Component</div>,
}));

import { IniciaTrayectoDetails } from "../src/app/viajes/[id]/IniciaTrayectoDetails";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const pasaporteRecepcionLista = {
  traslado_id: "traslado-inicia-trayecto-001",
  estado: "evidencia_inicial_completada",
  conductor_id: "conductor-001",
  vehiculo_placas: "PQM365",
  vehiculo_vin: "12345698745632145",
  vehiculo_marca: "Chrysler",
  vehiculo_modelo: "Cimas",
  vehiculo_anio: 2000,
  vehiculo_color: "GRIS",
  contacto_entrega_nombre: "HECTOR LOMELIN",
  contacto_entrega_telefono: "+52 656 555 6565",
} as PasaporteRow;

describe("[UI/UX] Pantalla de Traslado Activo: Inicia el Trayecto Mobile-First", () => {
  it("renderiza layout 100vh no-scroll, header con botón volver, título, emergencia y pestañas de gestión", () => {
    const { container } = render(
      <IniciaTrayectoDetails pasaporte={pasaporteRecepcionLista} volver="/viajes" />
    );

    const root = container.querySelector("[data-inicia-trayecto]");
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

  it("renderiza caja de estado Recepción lista con badge verde destacado", () => {
    render(<IniciaTrayectoDetails pasaporte={pasaporteRecepcionLista} volver="/viajes" />);

    const estadoStatus = screen.getByRole("status", {
      name: /Estado actual: Recepción lista/i,
    });
    expect(within(estadoStatus).getByText(/Estado actual/i)).toBeTruthy();
    expect(within(estadoStatus).getByText("Recepción lista")).toBeTruthy();
  });

  it("renderiza módulo de próxima acción: Inicia el trayecto y subtítulo descriptivo", () => {
    render(<IniciaTrayectoDetails pasaporte={pasaporteRecepcionLista} volver="/viajes" />);

    const accionSection = screen.getByRole("region", { name: "Próxima acción" });
    expect(within(accionSection).getByText("TU PRÓXIMA ACCIÓN")).toBeTruthy();
    expect(within(accionSection).getByRole("heading", { name: "Inicia el trayecto" })).toBeTruthy();
    expect(
      within(accionSection).getByText(
        "El registro inicial está completo con evidencia. Conduce de manera segura hacia el destino."
      )
    ).toBeTruthy();
  });

  it("renderiza sección de contacto con inicial, nombre, teléfono y canales de comunicación rápida", () => {
    render(<IniciaTrayectoDetails pasaporte={pasaporteRecepcionLista} volver="/viajes" />);

    const contactoSection = screen.getByRole("region", { name: "Contacto de recolección" });
    expect(within(contactoSection).getByText("CONTACTO DE RECOLECCIÓN")).toBeTruthy();
    expect(within(contactoSection).getByText("HECTOR LOMELIN")).toBeTruthy();
    expect(within(contactoSection).getByText("+52 656 555 6565")).toBeTruthy();
    expect(within(contactoSection).getByText("H")).toBeTruthy();

    // WhatsApp
    const waLink = within(contactoSection).getByRole("link", {
      name: "Enviar WhatsApp a HECTOR LOMELIN",
    });
    expect(waLink.getAttribute("href")).toBe("https://wa.me/526565556565");
    expect(waLink.getAttribute("target")).toBe("_blank");

    // Teléfono
    const telLink = within(contactoSection).getByRole("link", {
      name: "Llamar a HECTOR LOMELIN",
    });
    expect(telLink.getAttribute("href")).toBe("tel:+526565556565");

    // Chat
    const chatBtn = within(contactoSection).getByRole("button", {
      name: "Abrir chat con HECTOR LOMELIN",
    });
    expect(chatBtn).toBeTruthy();

    // Abrir diálogo de chat
    fireEvent.click(chatBtn);
    expect(screen.getByTestId("chat-viaje-mock")).toBeTruthy();
    expect(screen.getByText("Chat · HECTOR LOMELIN")).toBeTruthy();
  });

  it("renderiza Grid extendido de datos del vehículo 3x2 (Placa, VIN, Marca, Modelo, Año, Color) y logo Chrysler", () => {
    render(<IniciaTrayectoDetails pasaporte={pasaporteRecepcionLista} volver="/viajes" />);

    const vehiculoSection = screen.getByRole("region", {
      name: "Datos del vehículo a localizar",
    });
    expect(within(vehiculoSection).getByText("VEHÍCULO A LOCALIZAR")).toBeTruthy();
    expect(within(vehiculoSection).getByLabelText("Logo Chrysler")).toBeTruthy();

    // Fila 1
    expect(within(vehiculoSection).getByText("PLACA")).toBeTruthy();
    expect(within(vehiculoSection).getByText("PQM365")).toBeTruthy();
    expect(within(vehiculoSection).getByText("NÚMERO VIN")).toBeTruthy();
    expect(within(vehiculoSection).getByText("12345698745632145")).toBeTruthy();

    // Fila 2
    expect(within(vehiculoSection).getByText("MARCA")).toBeTruthy();
    expect(within(vehiculoSection).getByText("Chrysler")).toBeTruthy();
    expect(within(vehiculoSection).getByText("MODELO")).toBeTruthy();
    expect(within(vehiculoSection).getByText("Cimas")).toBeTruthy();

    // Fila 3
    expect(within(vehiculoSection).getByText("AÑO")).toBeTruthy();
    expect(within(vehiculoSection).getByText("2000")).toBeTruthy();
    expect(within(vehiculoSection).getByText("COLOR")).toBeTruthy();
    expect(within(vehiculoSection).getByText("GRIS")).toBeTruthy();
  });

  it("avanza estado y refresca página al presionar el botón primario 'INICIAR TRAYECTO AL DESTINO'", async () => {
    avanzarEstadoTrasladoMock
      .mockResolvedValueOnce("vehiculo_recibido")
      .mockResolvedValueOnce("traslado_en_curso");

    render(<IniciaTrayectoDetails pasaporte={pasaporteRecepcionLista} volver="/viajes" />);

    const btnIniciar = screen.getByRole("button", {
      name: /INICIAR TRAYECTO AL DESTINO/i,
    });
    expect(btnIniciar).toBeTruthy();

    fireEvent.click(btnIniciar);

    await waitFor(() => {
      expect(avanzarEstadoTrasladoMock).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("renderiza la barra de navegación inferior estándar fija con Traslados como página activa", () => {
    render(<IniciaTrayectoDetails pasaporte={pasaporteRecepcionLista} volver="/viajes" />);

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
