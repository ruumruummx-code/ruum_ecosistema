/** @vitest-environment jsdom */
import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CambiarContrasena } from "./CambiarContrasena";

const mocks = vi.hoisted(() => ({ verificar: vi.fn(), actualizar: vi.fn() }));
vi.mock("../../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({ auth: {
    getUser: async () => ({ data: { user: { id: "u1", email: "registro@ruum.test" } }, error: null }),
    signInWithPassword: mocks.verificar,
    updateUser: mocks.actualizar,
  } }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verificar.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  mocks.actualizar.mockResolvedValue({ error: null });
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
  expect(screen.getByLabelText(/^Nueva contraseña/)).toHaveValue("");
});

it("no actualiza si la contraseña actual es incorrecta", async () => {
  mocks.verificar.mockResolvedValue({ data: { user: null }, error: { message: "Invalid credentials" } });
  completar();
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await screen.findByRole("alert");
  expect(mocks.actualizar).not.toHaveBeenCalled();
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
