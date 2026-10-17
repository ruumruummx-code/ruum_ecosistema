/** @vitest-environment jsdom */
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { VerificacionDocumentos } from "../VerificacionDocumentos";
import { consultarCatalogosSat } from "@ruum/shared/catalogos";
import type { Database } from "@ruum/shared/types";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const mocks = vi.hoisted(() => ({ listar: vi.fn(), subir: vi.fn(), ine: vi.fn(), fiscal: vi.fn() }));
vi.mock("../../../lib/supabase-browser", () => ({ crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: () => true }));
vi.mock("@ruum/api/services", () => ({ listarDocumentosCuentaUsuario: mocks.listar, subirDocumentoCuentaUsuario: mocks.subir, subirDocumentoIdentidad: mocks.ine, actualizarFacturacionUsuario: mocks.fiscal }));
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
const usuario = { id: "u1", rfc: "", estado_verificacion: "pendiente", doc_identidad_url: null } as Usuario;
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function() { this.removeAttribute("open"); };
});
beforeEach(() => { vi.stubGlobal("fetch", vi.fn(async (url: string) => { const params = new URL(url, "http://localhost").searchParams; return { ok: true, json: async () => consultarCatalogosSat({ regimen: params.get("regimen") ?? undefined, persona: params.get("persona") as "fisica" | "moral" | undefined }) }; })); vi.clearAllMocks(); mocks.listar.mockResolvedValue([]); mocks.fiscal.mockResolvedValue(undefined); mocks.subir.mockResolvedValue({ tipo: "licencia", ruta: "auth/licencia/nueva.pdf", estado: "en_revision", subido_en: "2026-10-14T12:00:00Z" }); });
async function abrirLicencia() {
  const row = screen.getByRole("button", { name: /^Licencia de Conducir/ });
  await waitFor(() => expect(row).toBeEnabled(), { timeout: 5000 });
  fireEvent.click(row);
  return screen.findByRole("dialog", { name: "Licencia de Conducir" });
}
it("mantiene cinco tareas sin formularios, selectores de archivos ni FAB en la raíz", async () => {
  const { container } = render(<VerificacionDocumentos usuario={usuario} />);
  await waitFor(() => expect(screen.getByRole("button", { name: /^Licencia/ })).toBeEnabled(), { timeout: 5000 });
  expect(within(screen.getByRole("navigation", { name: "Tareas de verificación y facturación" })).getAllByRole("button")).toHaveLength(5);
  expect(screen.queryByLabelText("RFC")).not.toBeInTheDocument();
  expect(container.querySelector('input[type="file"]')).toBeNull();
  expect(screen.queryByRole("link", { name: "Solicitar traslado" })).not.toBeInTheDocument();
});
it("sube automáticamente, bloquea el cierre pendiente y actualiza el estado después del servidor", async () => {
  mocks.listar.mockResolvedValue([{ tipo: "licencia", ruta: "anterior.pdf", estado: "verificado", subido_en: "2026-09-01T12:00:00Z" }]);
  let resolver!: (value: unknown) => void;
  mocks.subir.mockReturnValue(new Promise(resolve => { resolver = resolve; }));
  render(<VerificacionDocumentos usuario={usuario} />);
  const dialog = await abrirLicencia();
  const archivo = new File(["pdf"], "licencia.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText("Seleccionar archivo · Licencia de Conducir"), { target: { files: [archivo] } });
  expect(mocks.subir).toHaveBeenCalledWith({}, "licencia", archivo);
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  resolver({ ruta: "nueva.pdf", estado: "en_revision", subido_en: "2026-10-14T12:00:00Z" });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: /^Licencia de Conducir En revisión/ })).toBeInTheDocument();
});
it("conserva el panel abierto al fallar y rechaza archivos inválidos antes de enviar", async () => {
  render(<VerificacionDocumentos usuario={usuario} />); await abrirLicencia();
  const input = screen.getByLabelText("Seleccionar archivo · Licencia de Conducir");
  fireEvent.change(input, { target: { files: [new File(["txt"], "no.txt", { type: "text/plain" })] } });
  expect(await screen.findByRole("alert")).toHaveTextContent("PDF, JPG o PNG");
  expect(mocks.subir).not.toHaveBeenCalled();
  mocks.subir.mockRejectedValueOnce(new Error("No pudimos guardar el archivo."));
  fireEvent.change(input, { target: { files: [new File(["pdf"], "licencia.pdf", { type: "application/pdf" })] } });
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No pudimos guardar el archivo."));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
it("distingue consulta fallida de documento sin cargar y permite reintentar", async () => {
  mocks.listar.mockRejectedValueOnce(new Error("offline"));
  render(<VerificacionDocumentos usuario={usuario} />);
  await screen.findByRole("alert");
  expect(screen.getAllByText("No disponible")).toHaveLength(3);
  expect(screen.getByRole("button", { name: /^Licencia/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await waitFor(() => expect(screen.getByRole("button", { name: /^Licencia/ })).toBeEnabled());
});
it("guarda datos fiscales en la hoja extendida y conserva los valores al reabrir", async () => {
  render(<VerificacionDocumentos usuario={usuario} />);
  fireEvent.click(screen.getByRole("button", { name: /^Datos de Facturación/ }));
  await screen.findByRole("dialog", { name: "Datos de Facturación" });
  for (const [label, valor] of [["RFC", "ABC010101AB1"], ["Razón social", "Empresa Prueba"], ["Código postal fiscal", "01234"]]) fireEvent.change(screen.getByLabelText(label), { target: { value: valor } });
  fireEvent.click(screen.getByLabelText("Régimen fiscal"));
  fireEvent.click(await screen.findByRole("button", { name: /^601 -/ }));
  fireEvent.click(screen.getByLabelText("Uso de CFDI"));
  fireEvent.click(await screen.findByRole("button", { name: /^G03 -/ }));
  fireEvent.submit(screen.getByRole("button", { name: "Guardar datos fiscales" }).closest("form")!);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: /^Datos de Facturación Configurado/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^Datos de Facturación/ }));
  expect(await screen.findByLabelText("RFC")).toHaveValue("ABC010101AB1");
  expect(mocks.fiscal).toHaveBeenCalledTimes(1);
});
it("cierra la tarea de INE después de actualizarla sin atribuirle verificación automática", async () => {
  mocks.ine.mockResolvedValue({ ruta: "ine.pdf", estado: "en_revision", subidoEn: "2026-10-16T12:00:00Z" });
  render(<VerificacionDocumentos usuario={usuario} />);
  fireEvent.click(screen.getByRole("button", { name: /^Identificación Oficial/ }));
  await screen.findByRole("dialog");
  fireEvent.change(screen.getByLabelText("Seleccionar archivo · Identificación Oficial (INE)"), { target: { files: [new File(["pdf"], "ine.pdf", { type: "application/pdf" })] } });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: /^Identificación Oficial \(INE\) En revisión/ })).toBeInTheDocument();
});
