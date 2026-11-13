/** @vitest-environment jsdom */
import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HistorialPasaportes, type PasaporteAnterior } from "./HistorialPasaportes";
const pasaporte: PasaporteAnterior = { id: "94910000-0000-4000-8000-000000000001", marca: "Nissan", modelo: "Versa", anio: 2024, placas: "ABC123", origen: "CDMX", destino: "Puebla", cerradoEn: "2026-10-30T12:00:00Z", creadoEn: "2026-10-29T12:00:00Z" };
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("ordena por cierre y permite consultar todos los pasaportes mediante paginación", () => {
  const pasaportes = Array.from({ length: 12 }, (_, i) => ({ ...pasaporte, id: `viaje-${String(i).padStart(2, "0")}`, cerradoEn: new Date(Date.UTC(2026, 9, i + 1)).toISOString() }));
  render(<HistorialPasaportes pasaportes={pasaportes} />);
  expect(screen.getAllByRole("article")).toHaveLength(10);
  expect(screen.getAllByRole("article")[0]).toHaveAccessibleName("Pasaporte VIAJE-11");
  expect(screen.getByRole("button", { name: "Anteriores" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Siguientes" }));
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getByRole("status")).toHaveTextContent("Mostrando 11–12 de 12 pasaportes");
  expect(screen.getByRole("button", { name: "Siguientes" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Ver pasaporte VIAJE-00" })).toHaveAttribute("href", "/viajes/viaje-00");
});
it("descarga el PDF del traslado elegido usando el exportador existente", async () => {
  const descargar = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function(this: HTMLAnchorElement) {
    expect(this.download).toBe("pasaporte-94910000-0000-4000-8000-000000000001.pdf");
  });
  const crear = vi.fn(() => "blob:pasaporte");
  vi.stubGlobal("URL", class extends URL { static createObjectURL = crear; static revokeObjectURL = vi.fn(); });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["pdf"], { type: "application/pdf" }) }));
  render(<HistorialPasaportes pasaportes={[pasaporte]} />);
  fireEvent.click(within(screen.getByRole("article")).getByRole("button", { name: "Exportar pasaporte completo" }));
  await waitFor(() => expect(descargar).toHaveBeenCalledOnce());
  expect(fetch).toHaveBeenCalledWith("/api/viajes/94910000-0000-4000-8000-000000000001/pasaporte", { cache: "no-store" });
});
it("muestra errores de exportación sin ocultar el expediente ni fingir una descarga", async () => {
  const descargar = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "No se pudo descargar el pasaporte." }) }));
  render(<HistorialPasaportes pasaportes={[pasaporte]} />);
  fireEvent.click(screen.getByRole("button", { name: "Exportar pasaporte completo" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo descargar");
  expect(screen.getByRole("link", { name: /Ver pasaporte/ })).toBeInTheDocument();
  expect(descargar).not.toHaveBeenCalled();
});
