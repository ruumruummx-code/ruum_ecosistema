/** @vitest-environment jsdom */
import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VerificacionDocumentos } from "../VerificacionDocumentos";
import type { Database } from "@ruum/shared/types";
const mocks = vi.hoisted(() => ({ listar: vi.fn(), subir: vi.fn(), ine: vi.fn() }));
vi.mock("../../../lib/supabase-browser", () => ({ crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: () => true }));
vi.mock("@ruum/api/services", () => ({ listarDocumentosCuentaUsuario: mocks.listar, subirDocumentoCuentaUsuario: mocks.subir, subirDocumentoIdentidad: mocks.ine, actualizarFacturacionUsuario: vi.fn() }));
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
const usuario = { id: "u1", rfc: "", estado_verificacion: "pendiente", doc_identidad_url: null } as Usuario;
beforeEach(() => {
  vi.clearAllMocks(); mocks.listar.mockResolvedValue([]);
  mocks.subir.mockResolvedValue({ tipo: "licencia", ruta: "auth/licencia/nueva.pdf", estado: "en_revision", subido_en: "2026-10-14T12:00:00Z" });
});
it("reúne documentos y un solo formulario fiscal opcional sin estados ficticios", async () => {
  render(<VerificacionDocumentos usuario={usuario} />);
  await waitFor(() => expect(screen.getByLabelText("Seleccionar archivo · Licencia de conducir")).not.toBeDisabled());
  expect(screen.getByRole("heading", { name: "Verificación y facturación" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Licencia de conducir" })).toBeInTheDocument();
  expect(screen.queryByText("75%")).not.toBeInTheDocument();
  expect(screen.getByText("Necesito factura").closest("details")).not.toHaveAttribute("open");
  expect(screen.getAllByLabelText("RFC")).toHaveLength(1);
});
it("actualiza una licencia guardada sólo tras confirmar el servidor", async () => {
  mocks.listar.mockResolvedValue([{ tipo: "licencia", ruta: "auth/licencia/anterior.pdf", estado: "verificado", subido_en: "2026-09-01T12:00:00Z" }]);
  let resolver!: (value: unknown) => void;
  mocks.subir.mockReturnValue(new Promise(resolve => { resolver = resolve; }));
  render(<VerificacionDocumentos usuario={usuario} />);
  const input = await screen.findByLabelText("Seleccionar archivo actualizado · Licencia de conducir");
  const archivo = new File(["pdf"], "licencia.pdf", { type: "application/pdf" });
  fireEvent.change(input, { target: { files: [archivo] } });
  fireEvent.click(screen.getByRole("button", { name: "Actualizar Licencia de conducir" }));
  expect(screen.queryByText("Documento guardado. En revisión.")).not.toBeInTheDocument();
  expect(mocks.subir).toHaveBeenCalledWith({}, "licencia", archivo);
  resolver({ tipo: "licencia", ruta: "auth/licencia/nueva.pdf", estado: "en_revision", subido_en: "2026-10-14T12:00:00Z" });
  expect(await screen.findByText("Documento guardado. En revisión.")).toBeInTheDocument();
});
it("muestra un fallo de carga sin confirmar éxito", async () => {
  mocks.subir.mockRejectedValue(new Error("No pudimos guardar el archivo."));
  render(<VerificacionDocumentos usuario={usuario} />);
  const input = screen.getByLabelText("Seleccionar archivo · Licencia de conducir");
  await waitFor(() => expect(input).not.toBeDisabled());
  fireEvent.change(input, { target: { files: [new File(["pdf"], "licencia.pdf", { type: "application/pdf" })] } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar Licencia de conducir" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos guardar el archivo.");
  expect(screen.queryByText("Documento guardado. En revisión.")).not.toBeInTheDocument();
});
it("distingue un error de consulta de un documento faltante", async () => {
  mocks.listar.mockRejectedValue(new Error("offline"));
  render(<VerificacionDocumentos usuario={usuario} />);
  await screen.findByRole("alert");
  expect(screen.getAllByText("Estado no disponible")).toHaveLength(3);
  expect(screen.getByLabelText("Seleccionar archivo · Licencia de conducir")).toBeDisabled();
});
