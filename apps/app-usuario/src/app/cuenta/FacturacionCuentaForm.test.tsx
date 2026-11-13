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
it("normaliza los valores legados a claves antes de persistir", async () => {
  render(<FacturacionCuentaForm usuario={{ ...usuario, regimen_fiscal: "601 · General de Ley Personas Morales", uso_cfdi: "G03 · Gastos en general" }} empresa={null} />);
  expect(screen.getByLabelText("Régimen fiscal")).toHaveTextContent("601 - General de Ley Personas Morales");
  fireEvent.submit(screen.getByRole("button", { name: "Guardar datos fiscales" }).closest("form")!);
  await waitFor(() => expect(mocks.guardar).toHaveBeenCalledWith({}, expect.objectContaining({ regimen_fiscal: "601", uso_cfdi: "G03" })));
});

it.each([["GODE561231GR8", "612", "G03"], ["ABCD010101A12", "626", "G03"], ["GODE561231GR8", "605", "CN01"]])("guarda el RFC individual %s con régimen %s y uso %s", async (rfc, regimen, uso) => {
  render(<FacturacionCuentaForm usuario={{ ...usuario, tipo_cuenta: "personal", rfc, regimen_fiscal: regimen, uso_cfdi: uso }} empresa={null} />);
  expect(screen.getByLabelText("RFC")).toHaveAttribute("minlength", "13");
  fireEvent.submit(screen.getByRole("button", { name: "Guardar datos fiscales" }).closest("form")!);
  await waitFor(() => expect(mocks.guardar).toHaveBeenCalledWith({}, expect.objectContaining({ rfc, regimen_fiscal: regimen, uso_cfdi: uso, codigo_postal_fiscal: "01234" })));
});

it.each(["ABC010101AB1", "1234567890123"])("rechaza el RFC %s en cuentas individuales antes de invocar el servicio", async rfc => {
  render(<FacturacionCuentaForm compacto usuario={{ ...usuario, tipo_cuenta: "personal", rfc, regimen_fiscal: "612" }} empresa={null} />);
  fireEvent.submit(screen.getByRole("button", { name: "Guardar datos fiscales" }).closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("RFC de persona física de 13 caracteres");
  expect(mocks.guardar).not.toHaveBeenCalled();
});
