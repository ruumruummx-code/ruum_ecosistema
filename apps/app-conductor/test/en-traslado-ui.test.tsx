// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { PasaporteRow } from "../src/app/viajes/trips-utils";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const avanzarEstadoTrasladoMock = vi.fn();
const confirmarLlegadaDestinoMock = vi.fn();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

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
  confirmarLlegadaDestino: (...args: unknown[]) => confirmarLlegadaDestinoMock(...args),
  obtenerPasaporteDigital: vi.fn().mockResolvedValue({
    estado: "traslado_en_curso",
  }),
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

vi.mock("../src/app/viajes/[id]/evidencia/EvidenciaSoporteSheet", () => ({
  EvidenciaSoporteSheet: ({ soporteAbierto }: { soporteAbierto: boolean }) =>
    soporteAbierto ? <div data-testid="soporte-sheet-mock">Soporte Sheet</div> : null,
}));

import { ConduceADestinoDetails } from "../src/app/viajes/[id]/ConduceADestinoDetails";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const pasaporteEnTraslado = {
  traslado_id: "traslado-conduce-001",
  estado: "traslado_en_curso",
  conductor_id: "conductor-001",
  vehiculo_placas: "POM385",
  vehiculo_vin: "12345698745632145",
  vehiculo_marca: "Chrysler",
  vehiculo_modelo: "Cirrus",
  vehiculo_anio: 2000,
  vehiculo_color: "Gris",
  destino_ciudad: "Lerma de Villada",
  destino_direccion: "Calle Calvario, S, CENTRO, 52000, Lerma de México, Estado de México",
  destino_lat: 19.285,
  destino_lng: -99.512,
  contacto_recepcion_nombre: "Héctor Lomelín",
  contacto_recepcion_telefono: "+525555555555",
} as PasaporteRow;

describe("[UI/UX] Pantalla de Traslado Activo: En Ruta al Destino Mobile-First", () => {
  it("renderiza layout 100vh no-scroll con data-en-traslado", () => {
    const { container } = render(
      <ConduceADestinoDetails pasaporte={pasaporteEnTraslado} volver="/viajes" />
    );

    const root = container.querySelector("[data-en-traslado]");
    expect(root).not.toBeNull();
    expect(root?.className).toContain("h-screen");
    expect(root?.className).toContain("overflow-hidden");
  });

  it("renderiza Header y Pestañas Superiores con botón regresar, título, soporte, emergencia y pestañas", () => {
    render(<ConduceADestinoDetails pasaporte={pasaporteEnTraslado} volver="/viajes" />);

    const header = screen.getByLabelText("Encabezado de traslado activo");
    expect(
      within(header).getByRole("link", { name: "Volver a la lista de Traslados" }).getAttribute("href")
    ).toBe("/viajes");
    expect(within(header).getByText("Traslado activo")).toBeTruthy();

    const btnSoporte = within(header).getByRole("button", { name: "Abrir soporte rápido" });
    expect(btnSoporte).toBeTruthy();
    fireEvent.click(btnSoporte);
    expect(screen.getByTestId("soporte-sheet-mock")).toBeTruthy();

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

  it("renderiza caja de estado En traslado con badge destacado En ruta", () => {
    render(<ConduceADestinoDetails pasaporte={pasaporteEnTraslado} volver="/viajes" />);

    const estadoStatus = screen.getByRole("status", {
      name: /Estado actual: En traslado\. En ruta/i,
    });
    expect(within(estadoStatus).getByText("ESTADO ACTUAL")).toBeTruthy();
    expect(within(estadoStatus).getByText("En traslado")).toBeTruthy();
    expect(within(estadoStatus).getByText("En ruta")).toBeTruthy();
  });

  it("renderiza módulo de próxima acción: Dirígete al destino", () => {
    render(<ConduceADestinoDetails pasaporte={pasaporteEnTraslado} volver="/viajes" />);

    const accionSection = screen.getByRole("region", { name: "Próxima acción" });
    expect(within(accionSection).getByText("TU PRÓXIMA ACCIÓN")).toBeTruthy();
    expect(within(accionSection).getByRole("heading", { name: "Dirígete al destino" })).toBeTruthy();
    expect(
      within(accionSection).getByText(
        "Conduce con precaución hacia el punto de entrega y registra tu llegada al estar en sitio."
      )
    ).toBeTruthy();
  });

  it("renderiza tarjeta de información del vehículo en tránsito con auto, modelo y placas", () => {
    render(<ConduceADestinoDetails pasaporte={pasaporteEnTraslado} volver="/viajes" />);

    const vehiculoSection = screen.getByRole("region", { name: "Vehículo en tránsito" });
    expect(within(vehiculoSection).getByText("VEHÍCULO EN TRÁNSITO")).toBeTruthy();
    expect(within(vehiculoSection).getByText("Chrysler Cirrus 2000")).toBeTruthy();
    expect(within(vehiculoSection).getByText("Placas: POM385")).toBeTruthy();
  });

  it("renderiza módulo de destino final con botón 'Ver ruta' y contacto del pasajero con canales rápidos", () => {
    render(<ConduceADestinoDetails pasaporte={pasaporteEnTraslado} volver="/viajes" />);

    // Destino Final
    const destinoSection = screen.getByRole("region", { name: "Destino final" });
    expect(within(destinoSection).getByText("DESTINO FINAL")).toBeTruthy();
    expect(within(destinoSection).getByText("Lerma de Villada")).toBeTruthy();
    expect(
      within(destinoSection).getByText(/Calle Calvario, S, CENTRO, 52000, Lerma de México/i)
    ).toBeTruthy();

    const verRutaLink = within(destinoSection).getByRole("link", {
      name: "Ver ruta hacia el destino",
    });
    expect(verRutaLink).toBeTruthy();

    // Contacto
    const contactoSection = screen.getByRole("region", { name: "Contacto del pasajero" });
    expect(within(contactoSection).getByText("Héctor Lomelín")).toBeTruthy();
    expect(within(contactoSection).getByText("Hacia la unidad")).toBeTruthy();
    expect(within(contactoSection).getByText("HL")).toBeTruthy();

    // WhatsApp
    const waLink = within(contactoSection).getByRole("link", {
      name: "Enviar WhatsApp a Héctor Lomelín",
    });
    expect(waLink.getAttribute("href")).toBe("https://wa.me/525555555555");

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
    fireEvent.click(chatBtn);
    expect(screen.getByTestId("chat-viaje-mock")).toBeTruthy();
    expect(screen.getByText("Chat · Héctor Lomelín")).toBeTruthy();
  });

  it("renderiza mini mapa apaisado de ruta en tiempo real", () => {
    render(<ConduceADestinoDetails pasaporte={pasaporteEnTraslado} volver="/viajes" />);

    const mapaSection = screen.getByRole("region", { name: "Mapa de ruta en tiempo real" });
    expect(mapaSection).toBeTruthy();
    expect(within(mapaSection).getByText("Tu ubicación")).toBeTruthy();
    expect(within(mapaSection).getByText("Lerma de Villada")).toBeTruthy();
  });

  it("avanza estado y navega a evidencia al presionar el botón primario 'He llegado al destino'", async () => {
    confirmarLlegadaDestinoMock.mockResolvedValueOnce({});
    avanzarEstadoTrasladoMock.mockResolvedValueOnce("llegada_a_destino");

    render(<ConduceADestinoDetails pasaporte={pasaporteEnTraslado} volver="/viajes" />);

    const btnLlegue = screen.getByRole("button", {
      name: /He llegado al destino/i,
    });
    expect(btnLlegue).toBeTruthy();

    fireEvent.click(btnLlegue);

    await waitFor(() => {
      expect(confirmarLlegadaDestinoMock).toHaveBeenCalled();
      expect(avanzarEstadoTrasladoMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/viajes/traslado-conduce-001/evidencia");
    });
  });

  it("renderiza navegación inferior estándar con exactamente 3 pestañas y omite el botón Más", () => {
    render(<ConduceADestinoDetails pasaporte={pasaporteEnTraslado} volver="/viajes" />);

    const nav = screen.getByRole("navigation", { name: "Navegación principal móvil" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(3);

    expect(within(nav).getByRole("link", { name: /Inicio/i }).getAttribute("href")).toBe("/panel");
    expect(within(nav).getByRole("link", { name: /Traslados/i }).getAttribute("aria-current")).toBe(
      "page"
    );
    expect(within(nav).getByRole("link", { name: /Cuenta/i }).getAttribute("href")).toBe("/cuenta");

    // Se omite explícitamente el botón "Más"
    expect(within(nav).queryByText(/Más/i)).toBeNull();
  });
});
