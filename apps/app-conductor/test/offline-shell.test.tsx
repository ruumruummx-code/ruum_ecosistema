// @vitest-environment jsdom
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { OfflineShell } from "../src/app/OfflineShell";
import type { OfflineActiveTripCache } from "../src/lib/offline-active-trip-cache";

const { leerCache, publicarSync } = vi.hoisted(() => ({
  leerCache: vi.fn(),
  publicarSync: vi.fn()
}));

vi.mock("../src/lib/offline-active-trip-cache", () => ({
  leerCacheViajeActivo: leerCache
}));

vi.mock("../src/lib/offline-sync-status", () => ({
  publicarSyncSnapshot: publicarSync
}));

const cacheMock: OfflineActiveTripCache = {
  trasladoId: "trip-123",
  folio: "TR-2027-001",
  estado: "traslado_en_curso",
  estadoOperativo: "in_progress",
  cerradoEn: null,
  vehiculo: {
    descripcion: "Nissan Versa 2024",
    placas: "ABC-123-D"
  },
  origen: {
    direccion: "Av. Insurgentes Sur 1200",
    ciudad: "Ciudad de México"
  },
  destino: {
    direccion: "Av. Paseo de la Reforma 500",
    ciudad: "Ciudad de México"
  },
  siguienteAccion: {
    label: "Continuar ruta",
    instruction: "Conducir hacia el punto de entrega acordado",
    nextStep: "Entrega"
  },
  requisitosEvidencia: {
    pendientes: ["Foto odómetro final", "Firma de recibido"]
  },
  telefonosSoporteEmergencia: {
    soporteHref: "tel:5551234567",
    emergenciaHref: "tel:911"
  },
  ultimaSincronizacion: "2027-01-10T12:00:00.000Z"
};

describe("OfflineShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test("no renderiza nada si el dispositivo está en línea", async () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    leerCache.mockResolvedValue(cacheMock);

    const { container } = render(<OfflineShell />);
    await waitFor(() => expect(leerCache).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  test("no renderiza nada si no hay viaje activo en caché", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    leerCache.mockResolvedValue(null);

    const { container } = render(<OfflineShell />);
    await waitFor(() => expect(leerCache).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  test("renderiza los detalles del viaje offline cuando no hay conexión y hay caché", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    leerCache.mockResolvedValue(cacheMock);

    render(<OfflineShell />);
    await waitFor(() => expect(screen.getByText("Sin conexión")).toBeTruthy());

    expect(screen.getByText("Modo offline del traslado")).toBeTruthy();
    expect(screen.getByText("Folio TR-2027-001")).toBeTruthy();
    expect(screen.getByText("Nissan Versa 2024")).toBeTruthy();
    expect(screen.getByText("Placas: ABC-123-D")).toBeTruthy();
    expect(screen.getByText("Av. Insurgentes Sur 1200")).toBeTruthy();
    expect(screen.getByText("Av. Paseo de la Reforma 500")).toBeTruthy();
    expect(screen.getByText("Continuar ruta")).toBeTruthy();
    expect(screen.getByText("Conducir hacia el punto de entrega acordado")).toBeTruthy();
    expect(screen.getByText("Foto odómetro final")).toBeTruthy();
    expect(screen.getByText("Firma de recibido")).toBeTruthy();
  });

  test("el botón de reintentar conexión invoca publicarSyncSnapshot con 'sin_conexion' si sigue offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    leerCache.mockResolvedValue(cacheMock);
    publicarSync.mockResolvedValue({});

    render(<OfflineShell />);
    await waitFor(() => expect(screen.getByText("Reintentar conexión")).toBeTruthy());

    const botonReintentar = screen.getByText("Reintentar conexión");
    fireEvent.click(botonReintentar);

    expect(publicarSync).toHaveBeenCalledWith("sin_conexion");
  });

  test("actualiza el estado ante el evento 'ruum:offline-cache-updated'", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    leerCache.mockResolvedValueOnce(null);

    const { rerender } = render(<OfflineShell />);
    await waitFor(() => expect(leerCache).toHaveBeenCalledTimes(1));

    leerCache.mockResolvedValueOnce(cacheMock);
    window.dispatchEvent(new Event("ruum:offline-cache-updated"));

    await waitFor(() => expect(leerCache).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText("Folio TR-2027-001")).toBeTruthy());
  });
});
