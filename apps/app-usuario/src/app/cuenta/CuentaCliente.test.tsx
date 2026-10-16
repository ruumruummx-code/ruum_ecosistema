/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CuentaCliente } from "./CuentaCliente";
import type { Database } from "@ruum/shared/types";
const { replace, refresh, signOut } = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), signOut: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("../../lib/supabase-browser", () => ({ crearClienteNavegador: () => ({ auth: { signOut } }) }));
const usuario = { nombre: "Carlos Ramos", telefono: "+52 55 1234 5678", estado_verificacion: "verificado" } as Database["public"]["Tables"]["usuarios"]["Row"];
function cuenta() { return render(<CuentaCliente usuario={usuario} correoRegistro="registro@ruum.test" totalVehiculos={2} totalTraslados={15} incidenciasAbiertas={1} />); }
beforeEach(() => { vi.clearAllMocks(); signOut.mockResolvedValue({ error: null }); });
describe("CuentaCliente — RR-2026-003", () => {
  it("muestra perfil compacto, contadores y logout final sin gestión de vehículos ni submenús en el lienzo", () => {
    cuenta();
    expect(screen.getByText("Carlos Ramos")).toBeInTheDocument();
    expect(screen.getByText("registro@ruum.test")).toBeInTheDocument();
    expect(screen.getByText("+52 55 1234 5678")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("Mis vehículos")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /vehículo/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Datos personales")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const filas = within(screen.getByRole("navigation", { name: "Ajustes de cuenta" })).getAllByRole("button");
    expect(filas).toHaveLength(4);
    expect(filas.at(-1)).toHaveAccessibleName("Cerrar sesión");
    expect(filas.at(-1)).toHaveClass("is-destructive");
    expect(screen.getByText("Verificado")).toBeInTheDocument();
  });
  it.each([[/^Perfil/, "Perfil", "Datos personales"], [/^Soporte/, "Soporte", "Preguntas frecuentes"], [/^Legal y cuenta/, "Legal y cuenta", "Términos y condiciones"]])("abre %s como diálogo y restaura el foco al cerrar", async (boton, titulo, enlace) => {
    const user = userEvent.setup(); cuenta();
    const trigger = screen.getByRole("button", { name: boton });
    await user.click(trigger);
    const hoja = await screen.findByRole("dialog", { name: titulo });
    expect(hoja).toHaveAttribute("aria-modal", "true");
    expect(within(hoja).getByRole("link", { name: new RegExp(enlace) })).toBeInTheDocument();
    const cerrar = within(hoja).getByRole("button", { name: `Cerrar panel de ${titulo}` });
    await waitFor(() => expect(cerrar).toHaveFocus());
    await user.click(cerrar);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it("cierra con tap exterior y Escape sin expandir subopciones en el fondo", async () => {
    const user = userEvent.setup(); cuenta();
    await user.click(screen.getByRole("button", { name: /^Perfil/ }));
    fireEvent.click(await screen.findByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Soporte/ }));
    fireEvent(await screen.findByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("mantiene verificación inline y enlaces de las subopciones", async () => {
    const user = userEvent.setup(); cuenta();
    await user.click(screen.getByRole("button", { name: /^Perfil/ }));
    const hoja = await screen.findByRole("dialog");
    expect(within(hoja).getByRole("link", { name: /Verificación y facturación/ })).toHaveAttribute("href", "/cuenta/verificacion-documentos");
    expect(within(hoja).getByText("Verificado")).toBeInTheDocument();
    expect(within(hoja).getByRole("link", { name: "Preferencias" })).toHaveAttribute("href", "/cuenta/preferencias");
    expect(screen.queryByText("Datos personales, contraseña y documentos")).not.toBeInTheDocument();
  });
  it("cierra sesión inmediatamente y redirige al Login", async () => {
    const user = userEvent.setup(); cuenta();
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it.each(["returned", "thrown"])("permite reintentar si el logout falla (%s) sin redirigir", async (modo) => {
    if (modo === "returned") signOut.mockResolvedValueOnce({ error: new Error("error") });
    else signOut.mockRejectedValueOnce(new Error("error"));
    const user = userEvent.setup(); cuenta();
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cerrar tu sesión");
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeEnabled();
  });
});
