// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerConductorActual: vi.fn(),
  contarNotificacionesNoLeidas: vi.fn(),
  tieneSupabaseConfigurado: vi.fn(() => true),
  calcularSyncSnapshot: vi.fn(),
  cerrarSesion: vi.fn(),
  limpiarErrorCerrarSesion: vi.fn(),
}));

vi.mock("@ruum/api/services", () => ({ obtenerConductorActual: mocks.obtenerConductorActual }));
vi.mock("@ruum/api/drivers", () => ({ contarNotificacionesNoLeidas: mocks.contarNotificacionesNoLeidas }));
vi.mock("../src/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({ auth: {} }),
  tieneSupabaseConfigurado: mocks.tieneSupabaseConfigurado,
}));
vi.mock("../src/lib/offline-sync-status", () => ({
  SYNC_STATUS_EVENT: "ruum:sync-status",
  calcularSyncSnapshot: mocks.calcularSyncSnapshot,
}));
vi.mock("../src/lib/use-cerrar-sesion", () => ({
  useCerrarSesion: () => ({ cerrarSesion: mocks.cerrarSesion, limpiarErrorCerrarSesion: mocks.limpiarErrorCerrarSesion, cerrandoSesion: false, errorCerrarSesion: null }),
}));
vi.mock("../src/app/cuenta/DriverAccountView", () => ({
  DriverAccountView: (props: { initials: string | null; unread: number; loading: boolean; sync: { status: string } | null }) => (
    <div data-testid="account-view" data-initials={props.initials ?? ""} data-unread={props.unread} data-loading={String(props.loading)} data-sync={props.sync?.status ?? "none"} />
  ),
}));

import PaginaCuenta from "../src/app/cuenta/page";

describe("flujo de carga de cuenta del conductor", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tieneSupabaseConfigurado.mockReturnValue(true);
    mocks.obtenerConductorActual.mockResolvedValue({ nombre: "Ana María López" });
    mocks.contarNotificacionesNoLeidas.mockResolvedValue(3);
    mocks.calcularSyncSnapshot.mockResolvedValue({ status: "todo_sincronizado" });
  });

  it("carga perfil, notificaciones y sincronización para presentar la cuenta", async () => {
    render(<PaginaCuenta />);

    await waitFor(() => expect(screen.getByTestId("account-view").getAttribute("data-loading")).toBe("false"));
    const view = screen.getByTestId("account-view");
    expect(view.getAttribute("data-initials")).toBe("AL");
    expect(view.getAttribute("data-unread")).toBe("3");
    expect(view.getAttribute("data-sync")).toBe("todo_sincronizado");
    expect(mocks.obtenerConductorActual).toHaveBeenCalledOnce();
    expect(mocks.contarNotificacionesNoLeidas).toHaveBeenCalledOnce();
  });

  it("muestra cuenta sin datos y libera la carga si Supabase no está configurado", async () => {
    mocks.tieneSupabaseConfigurado.mockReturnValue(false);
    render(<PaginaCuenta />);

    await waitFor(() => expect(screen.getByTestId("account-view").getAttribute("data-loading")).toBe("false"));
    expect(screen.getByTestId("account-view").getAttribute("data-initials")).toBe("");
    expect(mocks.obtenerConductorActual).not.toHaveBeenCalled();
    expect(mocks.contarNotificacionesNoLeidas).not.toHaveBeenCalled();
  });
});
