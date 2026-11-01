/** @vitest-environment jsdom */
import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CambiarContrasena } from "./CambiarContrasena";

const mocks = vi.hoisted(() => ({ verificar: vi.fn(), actualizar: vi.fn(), cerrar: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("../../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({ auth: {
    getUser: async () => ({ data: { user: { id: "u1", email: "registro@ruum.test" } }, error: null }),
    signInWithPassword: mocks.verificar,
    updateUser: mocks.actualizar,
    signOut: mocks.cerrar,
  } }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verificar.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  mocks.actualizar.mockResolvedValue({ error: null });
  mocks.cerrar.mockResolvedValue({ error: null });
});

function completar() {
  render(<CambiarContrasena />);
  fireEvent.change(screen.getByLabelText(/^Contraseña actual/), { target: { value: "Anterior1" } });
  fireEvent.change(screen.getByLabelText(/^Nueva contraseña/), { target: { value: "NuevaSegura2" } });
  fireEvent.change(screen.getByLabelText(/^Confirmar nueva/), { target: { value: "NuevaSegura2" } });
}

it("verifica la contraseña actual antes de actualizar y limpia los campos al guardar", async () => {
  completar();
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await screen.findByText("Tu contraseña se actualizó correctamente.");
  expect(mocks.verificar).toHaveBeenCalledWith({ email: "registro@ruum.test", password: "Anterior1" });
  expect(mocks.actualizar).toHaveBeenCalledWith({ password: "NuevaSegura2" });
  expect(mocks.cerrar).toHaveBeenCalledWith({ scope: "others" });
  expect(mocks.actualizar.mock.invocationCallOrder[0]).toBeLessThan(mocks.cerrar.mock.invocationCallOrder[0]);
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/^Nueva contraseña/)).toHaveValue("");
});

it("no actualiza si la contraseña actual es incorrecta", async () => {
  mocks.verificar.mockResolvedValue({ data: { user: null }, error: { message: "Invalid credentials" } });
  completar();
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await screen.findByRole("alert");
  expect(mocks.actualizar).not.toHaveBeenCalled();
  expect(mocks.cerrar).not.toHaveBeenCalled();
});

it("cierra todas las sesiones y redirige al login si se desmarca la opción", async () => {
  completar();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login?contrasena=actualizada"));
  expect(mocks.cerrar).toHaveBeenCalledWith({ scope: "global" });
});

it("no revoca sesiones si falla la actualización de contraseña", async () => {
  mocks.actualizar.mockResolvedValue({ error: { message: "fallo" } });
  completar();
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await screen.findByRole("alert");
  expect(mocks.cerrar).not.toHaveBeenCalled();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it.each([true, false])("informa el fallo parcial de revocación con mantenerSesion=%s", async (mantener) => {
  mocks.cerrar.mockResolvedValue({ error: { message: "fallo" } });
  completar();
  if (!mantener) fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Tu contraseña se actualizó, pero no pudimos cerrar las sesiones solicitadas");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/^Nueva contraseña/)).toHaveValue("");
});

it("impide guardar contraseñas que no coinciden", async () => {
  completar();
  fireEvent.change(screen.getByLabelText(/^Confirmar nueva/), { target: { value: "OtraClave3" } });
  await waitFor(() => expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled());
  expect(mocks.actualizar).not.toHaveBeenCalled();
});

it("condensa requisitos, actualiza sus indicadores y ofrece una salida con contexto", () => {
  render(<CambiarContrasena />);
  expect(screen.queryByText("Protege tu cuenta")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", "/cuenta?seccion=perfil");
  expect(screen.getByRole("link", { name: "Volver a mi cuenta" })).toHaveAttribute("href", "/cuenta?seccion=perfil");
  expect(screen.getByRole("list", { name: "Requisitos de la nueva contraseña" })).toBeInTheDocument();
  expect(screen.getAllByRole("listitem").filter(e => e.classList.contains("is-met"))).toHaveLength(0);
  fireEvent.change(screen.getByLabelText(/^Nueva contraseña/), { target: { value: "NuevaSegura2" } });
  expect(screen.getAllByRole("listitem").filter(e => e.classList.contains("is-met"))).toHaveLength(4);
});
