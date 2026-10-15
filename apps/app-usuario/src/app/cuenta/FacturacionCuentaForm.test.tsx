/** @vitest-environment jsdom */
import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Database } from "@ruum/shared/types";
import { FacturacionCuentaForm } from "./FacturacionCuentaForm";
const mocks = vi.hoisted(() => ({ guardar: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("../../lib/supabase-browser", () => ({ crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: () => true }));
vi.mock("@ruum/api/services", () => ({ actualizarFacturacionUsuario: mocks.guardar }));
const usuario = { rfc: "ABC010101AB1", razon_social: "Prueba", regimen_fiscal: "601", codigo_postal_fiscal: "01234", uso_cfdi: "G03" } as Database["public"]["Tables"]["usuarios"]["Row"];
beforeEach(() => { vi.clearAllMocks(); mocks.guardar.mockResolvedValue(undefined); });
it("conserva Ñ y & en el RFC y refresca la cuenta sólo después de guardar", async () => {
  render(<FacturacionCuentaForm usuario={usuario} empresa={null} />);
  fireEvent.change(screen.getByLabelText("RFC"), { target: { value: "a&ñ010101ab1" } });
  fireEvent.submit(screen.getByRole("button", { name: "Guardar datos fiscales" }).closest("form")!);
  await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
  expect(mocks.guardar).toHaveBeenCalledWith({}, expect.objectContaining({ rfc: "A&Ñ010101AB1", codigo_postal_fiscal: "01234" }));
});
it("no confirma éxito ni refresca si el servidor rechaza el guardado", async () => {
  mocks.guardar.mockRejectedValue(new Error("No se pudo guardar"));
  render(<FacturacionCuentaForm usuario={usuario} empresa={null} />);
  fireEvent.submit(screen.getByRole("button", { name: "Guardar datos fiscales" }).closest("form")!);
  expect(await screen.findByText("No se pudo guardar")).toBeInTheDocument();
  expect(mocks.refresh).not.toHaveBeenCalled();
});
