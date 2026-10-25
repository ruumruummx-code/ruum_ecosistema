// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { PasaporteRow } from "../src/app/viajes/cierre/cierre-types";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const avanzarEstadoTrasladoMock = vi.fn();
const listarInspeccionesTrasladoMock = vi.fn();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });

  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    strokeStyle: "",
    lineWidth: 0,
    lineCap: "",
    lineJoin: "",
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
    top: 100,
    left: 50,
    width: 300,
    height: 100,
  });
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

vi.mock("@/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}),
}));

vi.mock("@ruum/api/drivers", () => ({
  listarInspeccionesTraslado: (...args: unknown[]) => listarInspeccionesTrasladoMock(...args),
}));

vi.mock("@ruum/api/services", () => ({
  avanzarEstadoTraslado: (...args: unknown[]) => avanzarEstadoTrasladoMock(...args),
  activarSoporteEmergenciaConductor: vi.fn(),
  registrarInteraccionPanelEmergenciaConductor: vi.fn(),
}));

vi.mock("../src/app/viajes/[id]/ChatViaje", () => ({
  ChatViaje: () => <div data-testid="chat-viaje-mock">Chat Viaje Component</div>,
}));

import { CierreTrasladoDetails } from "../src/app/viajes/[id]/CierreTrasladoDetails";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const pasaporteCierre: PasaporteRow = {
  traslado_id: "traslado-cierre-001",
  estado: "evidencia_final_completada",
  conductor_id: "conductor-001",
  vehiculo_placas: "POM365",
  vehiculo_vin: "12345698745632145",
  vehiculo_marca: "Chrysler",
  vehiculo_modelo: "Cirrus",
  vehiculo_anio: 2015,
  vehiculo_color: "Gris",
  contacto_entrega_nombre: "HÉCTOR LOMELÍN",
  contacto_entrega_telefono: "+52 55 1234 5678",
  destino_direccion: "Av. Paseo de la Reforma 222, CDMX",
};

describe("[UI/UX] Pantalla de Cierre de Traslado (Conciliación y Firma) Mobile-First", () => {
  it("renderiza layout 100vh no-scroll con data-cierre-traslado y sin scroll vertical", async () => {
    listarInspeccionesTrasladoMock.mockResolvedValueOnce([]);

    const { container } = render(
      <CierreTrasladoDetails pasaporte={pasaporteCierre} volver="/viajes/traslado-cierre-001" />
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Cargando cierre de traslado")).toBeNull();
    });

    const root = container.querySelector("[data-cierre-traslado]");
    expect(root).not.toBeNull();
    expect(root?.className).toContain("h-screen");
    expect(root?.className).toContain("overflow-hidden");
  });

  it("1. Header Técnico: renderiza Volver, título centralizado CIERRE DE TRASLADO y botón SOS", async () => {
    listarInspeccionesTrasladoMock.mockResolvedValueOnce([]);

    render(
      <CierreTrasladoDetails pasaporte={pasaporteCierre} volver="/viajes/traslado-cierre-001" />
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Cargando cierre de traslado")).toBeNull();
    });

    const header = screen.getByRole("banner", { name: "Encabezado técnico de cierre" });
    expect(header).toBeDefined();

    const linkVolver = screen.getByLabelText("Volver al traslado");
    expect(linkVolver.getAttribute("href")).toBe("/viajes/traslado-cierre-001");
    expect(within(linkVolver).getByText("Volver")).toBeDefined();

    expect(screen.getByRole("heading", { level: 1, name: "CIERRE DE TRASLADO" })).toBeDefined();

    const btnSos = screen.getByRole("button", { name: /Abrir emergencia/i });
    expect(btnSos).toBeDefined();
    expect(within(btnSos).getByText("SOS")).toBeDefined();
  });

  it("2. Caja de Estados Cruzados: muestra En destino y CONCILIACIÓN LISTA", async () => {
    listarInspeccionesTrasladoMock.mockResolvedValueOnce([]);

    render(
      <CierreTrasladoDetails pasaporte={pasaporteCierre} volver="/viajes/traslado-cierre-001" />
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Cargando cierre de traslado")).toBeNull();
    });

    const statusBox = screen.getByRole("status", { name: /Estado: En destino\. Conciliación lista/i });
    expect(statusBox).toBeDefined();
    expect(within(statusBox).getByText("En destino")).toBeDefined();
    expect(within(statusBox).getByText("Vehículo en punto final")).toBeDefined();
    expect(within(statusBox).getByText("CONCILIACIÓN LISTA")).toBeDefined();
  });

  it("3. Módulo del Receptor: muestra datos de contacto, avatar con iniciales y botones Llamar, WhatsApp, Chat", async () => {
    listarInspeccionesTrasladoMock.mockResolvedValueOnce([]);

    render(
      <CierreTrasladoDetails pasaporte={pasaporteCierre} volver="/viajes/traslado-cierre-001" />
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Cargando cierre de traslado")).toBeNull();
    });

    const sectionReceptor = screen.getByLabelText("Receptor");
    expect(within(sectionReceptor).getByText("RECEPTOR")).toBeDefined();
    expect(within(sectionReceptor).getByText("HÉCTOR LOMELÍN")).toBeDefined();
    expect(within(sectionReceptor).getByText("Cliente • Ruum Conductores")).toBeDefined();
    expect(within(sectionReceptor).getByText("HL")).toBeDefined();
    expect(within(sectionReceptor).getByText("CDMX")).toBeDefined();

    const linkLlamar = screen.getByLabelText("Llamar a HÉCTOR LOMELÍN");
    expect(linkLlamar.getAttribute("href")).toBe("tel:+525512345678");

    const linkWa = screen.getByLabelText("Enviar WhatsApp a HÉCTOR LOMELÍN");
    expect(linkWa.getAttribute("href")).toContain("wa.me/525512345678");

    const btnChat = screen.getByLabelText("Abrir chat con HÉCTOR LOMELÍN");
    expect(btnChat).toBeDefined();

    fireEvent.click(btnChat);
    expect(screen.getByTestId("chat-viaje-mock")).toBeDefined();
  });

  it("4. Tarjeta Fija de Resumen de Conciliación: visualiza las 4 métricas con datos de inspección", async () => {
    listarInspeccionesTrasladoMock.mockResolvedValueOnce([
      {
        tipo: "final",
        kilometraje: 124510,
        combustible: "75%",
        notas: "Sin detalles adicionales",
      },
    ]);

    render(
      <CierreTrasladoDetails pasaporte={pasaporteCierre} volver="/viajes/traslado-cierre-001" />
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Cargando cierre de traslado")).toBeNull();
    });

    const sectionResumen = screen.getByLabelText("Resumen de conciliación");
    expect(within(sectionResumen).getByText("RESUMEN DE CONCILIACIÓN")).toBeDefined();
    expect(within(sectionResumen).getByText("5/5")).toBeDefined();

    expect(within(sectionResumen).getByText("Evidencias cargadas")).toBeDefined();
    expect(within(sectionResumen).getByText("5 de 5")).toBeDefined();

    expect(within(sectionResumen).getByText("Odómetro final")).toBeDefined();
    expect(within(sectionResumen).getByText("124,510 km")).toBeDefined();

    expect(within(sectionResumen).getByText("Nivel de combustible")).toBeDefined();
    expect(within(sectionResumen).getByText("75%")).toBeDefined();

    expect(within(sectionResumen).getByText("Observaciones")).toBeDefined();
    expect(within(sectionResumen).getByText("Sin detalles adicionales")).toBeDefined();
  });

  it("5. Lienzo Digital Táctil: interactúa con canvas y permite limpiar firma", async () => {
    listarInspeccionesTrasladoMock.mockResolvedValueOnce([]);

    render(
      <CierreTrasladoDetails pasaporte={pasaporteCierre} volver="/viajes/traslado-cierre-001" />
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Cargando cierre de traslado")).toBeNull();
    });

    const sectionFirma = screen.getByLabelText("Firma de conformidad del cliente");
    expect(within(sectionFirma).getByText("FIRMA DE CONFORMIDAD DEL CLIENTE")).toBeDefined();

    // Placeholder inicial
    expect(screen.getByText("Firma aquí con tu dedo")).toBeDefined();

    const canvas = screen.getByLabelText("Lienzo de firma digital del cliente");
    expect(canvas).toBeDefined();

    // Simular inicio de trazo de firma
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 120 });
    fireEvent.pointerMove(canvas, { clientX: 110, clientY: 130 });
    fireEvent.pointerUp(canvas);

    // El placeholder ya no debe verse
    expect(screen.queryByText("Firma aquí con tu dedo")).toBeNull();

    // Click en botón Limpiar
    const btnLimpiar = screen.getByRole("button", { name: "Limpiar firma" });
    fireEvent.click(btnLimpiar);

    // El placeholder reaparece
    expect(screen.getByText("Firma aquí con tu dedo")).toBeDefined();
  });

  it("6. Fila de Acciones Base: Guardar Reporte y FINALIZAR TRASLADO ejecutan acciones esperadas", async () => {
    listarInspeccionesTrasladoMock.mockResolvedValueOnce([]);
    avanzarEstadoTrasladoMock.mockResolvedValue({});

    render(
      <CierreTrasladoDetails pasaporte={pasaporteCierre} volver="/viajes/traslado-cierre-001" />
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Cargando cierre de traslado")).toBeNull();
    });

    // Guardar Reporte
    const btnGuardar = screen.getByRole("button", { name: "Guardar Reporte" });
    fireEvent.click(btnGuardar);
    expect(screen.getByText("Reporte de cierre guardado exitosamente.")).toBeDefined();

    // FINALIZAR TRASLADO
    const btnFinalizar = screen.getByRole("button", { name: /FINALIZAR TRASLADO/i });
    fireEvent.click(btnFinalizar);

    // Confirmar en el modal de entrega
    const btnConfirmar = await waitFor(() => screen.getByRole("button", { name: /SÍ, ENTREGAR/i }));
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(avanzarEstadoTrasladoMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("¡Vehículo entregado y traslado finalizado exitosamente!")).toBeDefined();
    });
  });

  it("Estricto: No incluye barra de navegación inferior (Inicio, Traslados, Cuenta) en pantalla de cierre", async () => {
    listarInspeccionesTrasladoMock.mockResolvedValueOnce([]);

    const { container } = render(
      <CierreTrasladoDetails pasaporte={pasaporteCierre} volver="/viajes/traslado-cierre-001" />
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Cargando cierre de traslado")).toBeNull();
    });

    // Asegurar que no hay navegación inferior para evitar abandonos accidentales
    expect(container.querySelector("[data-conductor-mobile-nav]")).toBeNull();
    expect(screen.queryByRole("link", { name: /inicio/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /cuenta/i })).toBeNull();
  });
});
