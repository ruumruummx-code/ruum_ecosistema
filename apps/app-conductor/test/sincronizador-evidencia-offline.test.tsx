// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SincronizadorEvidenciaOffline } from "../src/app/SincronizadorEvidenciaOffline";

const {
  orquestarSync,
  publicarSync,
  purgarCola,
  tieneSupabase,
  crearCliente
} = vi.hoisted(() => ({
  orquestarSync: vi.fn(),
  publicarSync: vi.fn(),
  purgarCola: vi.fn(),
  tieneSupabase: vi.fn(),
  crearCliente: vi.fn()
}));

vi.mock("../src/lib/orquestador-sync-offline", () => ({
  orquestarSincronizacionOffline: orquestarSync
}));

vi.mock("../src/lib/offline-sync-status", () => ({
  publicarSyncSnapshot: publicarSync
}));

vi.mock("../src/lib/offline", () => ({
  purgarColaExpirada: purgarCola
}));

vi.mock("../src/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: tieneSupabase,
  crearClienteNavegador: crearCliente
}));

describe("SincronizadorEvidenciaOffline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    purgarCola.mockResolvedValue(undefined);
    tieneSupabase.mockReturnValue(true);
    crearCliente.mockReturnValue({ auth: { getUser: vi.fn() } });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  afterEach(() => {
    cleanup();
  });

  test("purga cola expirada y ejecuta sincronización al montar", async () => {
    orquestarSync.mockResolvedValue({ status: "todo_sincronizado", evidencias: 1, telemetria: 1 });

    render(<SincronizadorEvidenciaOffline />);

    await waitFor(() => {
      expect(purgarCola).toHaveBeenCalled();
      expect(orquestarSync).toHaveBeenCalled();
    });
  });

  test("no intenta sincronizar si está desconectado", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    render(<SincronizadorEvidenciaOffline />);

    await waitFor(() => {
      expect(purgarCola).toHaveBeenCalled();
    });
    expect(orquestarSync).not.toHaveBeenCalled();
  });

  test("sincroniza automáticamente al reconectar (evento 'online')", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    render(<SincronizadorEvidenciaOffline />);

    expect(orquestarSync).not.toHaveBeenCalled();

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    window.dispatchEvent(new Event("online"));

    await waitFor(() => {
      expect(orquestarSync).toHaveBeenCalledTimes(1);
    });
  });

  test("sincroniza al disparar 'ruum:evidencia-pendiente'", async () => {
    orquestarSync.mockResolvedValue({ status: "todo_sincronizado" });
    render(<SincronizadorEvidenciaOffline />);

    await waitFor(() => expect(orquestarSync).toHaveBeenCalledTimes(1));

    window.dispatchEvent(new Event("ruum:evidencia-pendiente"));

    await waitFor(() => {
      expect(orquestarSync).toHaveBeenCalledTimes(2);
    });
  });

  test("publica 'error_recuperable' si la orquestación falla", async () => {
    orquestarSync.mockRejectedValue(new Error("Fallo de red temporal"));

    render(<SincronizadorEvidenciaOffline />);

    await waitFor(() => {
      expect(publicarSync).toHaveBeenCalledWith("error_recuperable");
    });
  });
});
