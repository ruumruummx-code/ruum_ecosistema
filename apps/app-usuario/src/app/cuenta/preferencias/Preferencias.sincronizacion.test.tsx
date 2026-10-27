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
  it("no borra una edición nueva al confirmar una petición anterior después de navegar", async () => {
    let resolver!: () => void;
    guardar.mockReturnValueOnce(new Promise<void>(resolve => { resolver = resolve; }));
    guardar.mockRejectedValueOnce(new Error("sin red"));
    const { unmount } = render(<Preferencias usuario={usuario} />);
    fireEvent.change(screen.getByLabelText("Unidades de medida"), { target: { value: "Imperial" } });
    await waitFor(() => expect(guardar).toHaveBeenCalledOnce());
    unmount();
    render(<Preferencias usuario={usuario} />);
    fireEvent.change(screen.getByLabelText("Unidades de medida"), { target: { value: "Métrico" } });
    resolver();
    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(2));
    expect(JSON.parse(localStorage.getItem("ruum:preferencias-pendientes:u1")!).general.unidades).toBe("Métrico");
  });
  it("recupera cambios fallidos al volver aunque el servidor todavía devuelva los anteriores", async () => {
    guardar.mockRejectedValueOnce(new Error("sin red"));
    const cuenta = { ...usuario, preferencias: { unidades: "Métrico" } } as Usuario;
    const { unmount } = render(<Preferencias usuario={cuenta} />);
    fireEvent.change(screen.getByLabelText("Unidades de medida"), { target: { value: "Imperial" } });
    await screen.findByRole("alert");
    unmount();
    render(<Preferencias usuario={cuenta} />);
    expect(screen.getByLabelText("Unidades de medida")).toHaveValue("Imperial");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar guardado" }));
    await waitFor(() => expect(localStorage.getItem("ruum:preferencias-pendientes:u1")).toBeNull());
    expect(guardar).toHaveBeenLastCalledWith(expect.anything(), { unidades: "Imperial" });
  });
  it("recupera interruptores pendientes y reintenta al volver la conexión", async () => {
    localStorage.setItem("ruum:preferencias-pendientes:u1", JSON.stringify({ general: {}, notificacion: { notificaciones_email: false } }));
    render(<Preferencias usuario={{ ...usuario, notificaciones_email: true }} />);
    fireEvent.click(screen.getByRole("button", { name: "Notificaciones y alertas" }));
    expect(screen.getByRole("switch", { name: "Correo electrónico" })).toHaveAttribute("aria-checked", "false");
    fireEvent(window, new Event("online"));
    await waitFor(() => expect(notificar).toHaveBeenCalledWith(expect.anything(), { notificaciones_email: false }));
  });
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
