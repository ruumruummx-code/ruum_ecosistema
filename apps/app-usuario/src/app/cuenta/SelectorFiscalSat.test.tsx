/** @vitest-environment jsdom */
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { consultarCatalogosSat } from "@ruum/shared/catalogos";
import { FacturacionCuentaForm } from "./FacturacionCuentaForm";
import type { Database } from "@ruum/shared/types";

const mocks = vi.hoisted(() => ({ guardar: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("../../lib/supabase-browser", () => ({ crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: () => true }));
vi.mock("@ruum/api/services", () => ({ actualizarFacturacionUsuario: mocks.guardar }));
const usuario = { rfc: "ABCD010101AB1", razon_social: "Prueba", regimen_fiscal: "612", codigo_postal_fiscal: "01234", uso_cfdi: "D01" } as Database["public"]["Tables"]["usuarios"]["Row"];

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function() { this.removeAttribute("open"); };
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.guardar.mockResolvedValue(undefined);
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const p = new URL(url, "http://localhost").searchParams;
    return { ok: true, json: async () => consultarCatalogosSat({ regimen: p.get("regimen") ?? undefined, persona: p.get("persona") as "fisica" | "moral" | undefined }) };
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("busca RESICO, descarta el uso incompatible y guarda sólo claves", async () => {
  render(<FacturacionCuentaForm compacto usuario={usuario} empresa={null} />);
  const regimen = screen.getByLabelText("Régimen fiscal");
  regimen.focus();
  fireEvent.click(regimen);
  const dialog = await screen.findByRole("dialog", { name: "Seleccionar Régimen fiscal" });
  await within(dialog).findByRole("button", { name: /^626 -/ });
  fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "resico" } });
  expect(within(dialog).queryByRole("button", { name: /^612 -/ })).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: /^626 -/ }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(regimen).toHaveFocus();
  expect(screen.getByLabelText("Uso de CFDI")).toHaveTextContent("Seleccionar");
  fireEvent.click(screen.getByLabelText("Uso de CFDI"));
  await screen.findByRole("button", { name: /^G03 -/ });
  expect(screen.queryByRole("button", { name: /^D01 -/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^G03 -/ }));
  fireEvent.submit(screen.getByRole("button", { name: "Guardar datos fiscales" }).closest("form")!);
  await waitFor(() => expect(mocks.guardar).toHaveBeenCalledWith({}, expect.objectContaining({ regimen_fiscal: "626", uso_cfdi: "G03" })));
});

it("permite reintentar si falla el catálogo y cancelar sin cambiar la selección", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
  render(<FacturacionCuentaForm compacto usuario={usuario} empresa={null} />);
  fireEvent.click(screen.getByLabelText("Régimen fiscal"));
  expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await screen.findByRole("button", { name: /^612 -/ });
  fireEvent.click(screen.getByRole("button", { name: "Cerrar selector de Régimen fiscal" }));
  expect(screen.getByLabelText("Régimen fiscal")).toHaveTextContent(/^612 -/);
});
