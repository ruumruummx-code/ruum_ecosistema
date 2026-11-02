/** @vitest-environment jsdom */
import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const m = vi.hoisted(() => ({ registrar: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("@ruum/api/vehicles", () => ({ registrarVehiculoUsuario: m.registrar }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: m.replace, refresh: m.refresh }) }));
vi.mock("../../../../lib/supabase-browser", () => ({ crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: () => true }));
import { NuevoVehiculo } from "./NuevoVehiculo";
beforeEach(() => { vi.clearAllMocks(); m.registrar.mockResolvedValue("vehiculo-propio"); });
function completar() {
  const { container } = render(<NuevoVehiculo />);
  for (const [label, value] of [["Marca", "Nissan"], ["Modelo", "Versa"], ["Color", "Blanco"], ["Placas", "ABC-123"]]) fireEvent.change(screen.getByLabelText(label!), { target: { value } });
  return container.querySelector("form")!;
}
it("registra sin solicitar un traslado y abre el expediente solo al confirmar", async () => {
  fireEvent.submit(completar());
  await waitFor(() => expect(m.replace).toHaveBeenCalledWith("/cuenta/vehiculos/vehiculo-propio"));
  expect(m.registrar).toHaveBeenCalledWith({}, expect.any(String), expect.objectContaining({ placas: "ABC123", marca: "Nissan", puede_circular_rodando: false }));
  expect(screen.getByRole("link", { name: "Volver a mis vehículos" })).toHaveAttribute("href", "/cuenta/vehiculos");
});
it("conserva datos y clave de registro al reintentar después de un fallo", async () => {
  m.registrar.mockRejectedValueOnce(new Error("No confirmado"));
  const form = completar(); fireEvent.submit(form);
  await screen.findByRole("alert");
  expect(m.replace).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Placas")).toHaveValue("ABC-123");
  const id = m.registrar.mock.calls[0]![1];
  fireEvent.submit(form);
  await waitFor(() => expect(m.replace).toHaveBeenCalled());
  expect(m.registrar.mock.calls[1]![1]).toBe(id);
});
it("bloquea dobles envíos y datos sin identificación", async () => {
  let resolver!: (id: string) => void;
  m.registrar.mockReturnValueOnce(new Promise(resolve => { resolver = resolve; }));
  const form = completar();
  fireEvent.change(screen.getByLabelText("Placas"), { target: { value: "" } });
  fireEvent.submit(form);
  expect(m.registrar).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Placas"), { target: { value: "ABC123" } });
  fireEvent.submit(form); fireEvent.submit(form);
  expect(m.registrar).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Marca")).toBeDisabled();
  resolver("guardado");
  await waitFor(() => expect(m.replace).toHaveBeenCalled());
});
