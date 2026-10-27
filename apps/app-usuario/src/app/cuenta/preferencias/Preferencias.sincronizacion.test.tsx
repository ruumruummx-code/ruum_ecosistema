/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Preferencias } from "../Preferencias";
import type { Usuario } from "../cuenta-ui";

const { guardar, notificar } = vi.hoisted(() => ({ guardar: vi.fn(), notificar: vi.fn() }));
vi.mock("@ruum/api/services", () => ({ actualizarPreferenciasGeneralesUsuario: guardar, actualizarPreferenciasNotificaciones: notificar }));
vi.mock("../../../lib/supabase-browser", () => ({ tieneSupabaseConfigurado: () => true, crearClienteNavegador: () => ({}) }));
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); guardar.mockResolvedValue(undefined); notificar.mockResolvedValue(undefined); });
const usuario = { id: "u1", preferencias: {} } as Usuario;

describe("persistencia de preferencias", () => {
  it("envía cambios aunque el usuario salga inmediatamente de la pantalla", async () => {
    const { unmount } = render(<Preferencias usuario={usuario} escritorio />);
    fireEvent.change(screen.getByLabelText("Tema de la aplicación"), { target: { value: "Oscuro" } });
    unmount();
    await waitFor(() => expect(guardar).toHaveBeenCalledWith(expect.anything(), { tema: "Oscuro" }));
  });
  it("mantiene el fallo visible y reintenta los cambios que no se sincronizaron", async () => {
    guardar.mockRejectedValueOnce(new Error("sin red"));
    render(<Preferencias usuario={usuario} escritorio />);
    fireEvent.change(screen.getByLabelText("Unidades de medida"), { target: { value: "Imperial" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("pendientes de sincronizar");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar guardado" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(guardar).toHaveBeenCalledTimes(2);
    expect(guardar).toHaveBeenLastCalledWith(expect.anything(), { unidades: "Imperial" });
  });
  it("separa los valores locales entre cuentas del mismo dispositivo", () => {
    const { unmount } = render(<Preferencias usuario={usuario} />);
    fireEvent.change(screen.getByLabelText("Unidades de medida"), { target: { value: "Imperial" } });
    expect(localStorage.getItem("ruum:pref:unidades:u1")).toBe('"Imperial"');
    unmount();
    render(<Preferencias usuario={{ ...usuario, id: "u2" }} />);
    expect(screen.getByLabelText("Unidades de medida")).toHaveValue("Métrico");
  });
  it("descarta valores de preferencias fuera del catálogo permitido", () => {
    render(<Preferencias usuario={{ ...usuario, preferencias: { tema: "invalido", unidades: "invalido" } }} />);
    expect(screen.getByLabelText("Tema de la aplicación")).toHaveValue("Claro");
    expect(screen.getByLabelText("Unidades de medida")).toHaveValue("Métrico");
  });
});
