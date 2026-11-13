/** @vitest-environment jsdom */
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SolicitudCalificacion } from "./SolicitudCalificacion";
const mocks = vi.hoisted(() => ({ consultar: vi.fn(), crear: vi.fn() }));
vi.mock("@ruum/api/transfers", () => ({ obtenerCalificacionTraslado: mocks.consultar }));
vi.mock("@ruum/api/services", () => ({ crearCalificacion: mocks.crear }));
vi.mock("@/lib/supabase-browser", () => ({ crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: () => true }));
const props = { trasladoId: "trip-test", conductorId: "driver-test", estado: "servicio_cerrado", cerradoEn: new Date().toISOString() };
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function() { this.removeAttribute("open"); };
});
beforeEach(() => { vi.clearAllMocks(); mocks.consultar.mockResolvedValue(null); mocks.crear.mockResolvedValue(undefined); });
it("ofrece evaluación al frente sin abrir datos o recibos", async () => {
  render(<SolicitudCalificacion {...props} calificada={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Calificar traslado" }));
  expect(await screen.findByRole("radiogroup")).toBeVisible();
  expect(mocks.consultar).not.toHaveBeenCalled();
});
it("guarda la elección del usuario y retira la solicitud después del envío", async () => {
  render(<SolicitudCalificacion {...props} calificada={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Calificar traslado" }));
  fireEvent.click(screen.getByRole("radio", { name: /^4 estrellas/ }));
  fireEvent.click(screen.getByRole("button", { name: "Enviar calificación" }));
  await waitFor(() => expect(mocks.crear).toHaveBeenCalledWith({}, "trip-test", "driver-test", 4, ""));
  expect(await screen.findByText(/Calificación registrada/)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Calificar traslado" })).not.toBeInTheDocument();
});
it("consulta si hay evaluación antes de ofrecerla en el detalle desktop", async () => {
  mocks.consultar.mockResolvedValue({ estrellas: 5 });
  render(<SolicitudCalificacion {...props} />);
  await waitFor(() => expect(mocks.consultar).toHaveBeenCalledWith({}, "trip-test"));
  expect(screen.queryByRole("button", { name: "Calificar traslado" })).not.toBeInTheDocument();
});
it.each([
  { estado: "traslado_en_curso", cerradoEn: props.cerradoEn },
  { estado: "servicio_cerrado", cerradoEn: new Date(Date.now()-73*3_600_000).toISOString() },
])("no ofrece evaluación en estado o plazo inelegible: $estado", dato => {
  render(<SolicitudCalificacion {...props} {...dato} calificada={false} />);
  expect(screen.queryByRole("button", { name: "Calificar traslado" })).not.toBeInTheDocument();
});
it("permite reintentar una consulta fallida sin asumir que falta la evaluación", async () => {
  mocks.consultar.mockRejectedValueOnce(new Error("offline"));
  render(<SolicitudCalificacion {...props} />);
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar evaluación" }));
  expect(await screen.findByRole("button", { name: "Calificar traslado" })).toBeVisible();
});
