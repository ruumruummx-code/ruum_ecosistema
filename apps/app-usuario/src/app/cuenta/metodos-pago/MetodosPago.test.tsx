/** @vitest-environment jsdom */
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MetodosPago } from "./MetodosPago";
vi.mock("../../../lib/csrf", () => ({ obtenerHeadersCsrfAsync: async (headers: Record<string, string>) => ({ ...headers, "x-csrf-token": "token" }) }));
const tarjeta = { id: "pm_tarjeta", marca: "visa", ultimos4: "4242", mes: 12, anio: 2030, predeterminada: false };
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function() { this.removeAttribute("open"); };
});
beforeEach(() => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ tarjetas: [tarjeta] }))); });
it("consulta tarjetas enmascaradas y diferencia error de billetera vacía", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ error: "Servicio no disponible" }, { status: 503 }));
  render(<MetodosPago />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Servicio no disponible");
  expect(screen.queryByText("No tienes tarjetas guardadas.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Actualizar lista" }));
  expect(await screen.findByRole("heading", { name: "VISA •••• 4242" })).toBeInTheDocument();
});
it("muestra estado vacío confirmado por el servidor", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ tarjetas: [] }));
  render(<MetodosPago />);
  expect(await screen.findByText("No tienes tarjetas guardadas.")).toBeInTheDocument();
});
it("predetermina y vuelve a consultar la fuente de verdad", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ tarjetas: [tarjeta] }))
    .mockResolvedValueOnce(Response.json({ ok: true }))
    .mockResolvedValueOnce(Response.json({ tarjetas: [{ ...tarjeta, predeterminada: true }] }));
  render(<MetodosPago />);
  fireEvent.click(await screen.findByRole("button", { name: "Predeterminar tarjeta terminada en 4242" }));
  expect(await screen.findByText("Predeterminada")).toBeInTheDocument();
  expect(fetch).toHaveBeenNthCalledWith(2, "/api/cuenta/metodos-pago", expect.objectContaining({ method: "POST", body: JSON.stringify({ accion: "predeterminar", id: "pm_tarjeta" }), headers: expect.objectContaining({ "x-csrf-token": "token" }) }));
});
it("solo elimina después de confirmar y no oculta el fallo dentro del diálogo", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ tarjetas: [tarjeta] }))
    .mockResolvedValueOnce(Response.json({ error: "No se pudo eliminar" }, { status: 503 }));
  render(<MetodosPago />);
  fireEvent.click(await screen.findByRole("button", { name: "Eliminar tarjeta terminada en 4242" }));
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo eliminar");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.queryByText("Tarjeta eliminada.")).not.toBeInTheDocument();
});
it("bloquea envíos duplicados mientras una operación está pendiente", async () => {
  let resolver!: (r: Response) => void;
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ tarjetas: [tarjeta] }))
    .mockImplementationOnce(() => new Promise(resolve => { resolver = resolve; }));
  render(<MetodosPago />);
  const boton = await screen.findByRole("button", { name: "Predeterminar tarjeta terminada en 4242" });
  fireEvent.click(boton); fireEvent.click(boton);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(boton).toBeDisabled();
  resolver(Response.json({ ok: true }));
  await screen.findByText("Tarjeta predeterminada actualizada.");
});
