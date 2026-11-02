/** @vitest-environment jsdom */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
const m = vi.hoisted(() => ({ listar: vi.fn(), resolver: vi.fn() }));
vi.mock("@ruum/api/services", () => ({ listarTicketsSoporte: m.listar, resolverTicketSoporte: m.resolver }));
vi.mock("../../lib/supabase-browser", () => ({ crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: () => true }));
import { TicketsSoporte } from "./TicketsSoporte";
const ticket = { id: "94800000-0000-4000-8000-000000000001", motivo: "Consulta general", descripcion: "Necesito ayuda con mi cuenta", estado: "abierto", creado_en: "2026-11-01T12:00:00Z", traslado_id: null };
let root: Root;
let contenedor: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  m.listar.mockResolvedValue([ticket]); m.resolver.mockResolvedValue(undefined);
  contenedor = document.createElement("div"); document.body.append(contenedor); root = createRoot(contenedor);
});
afterEach(async () => { await act(async () => root.unmount()); contenedor.remove(); vi.unstubAllGlobals(); });
it("muestra y resuelve consultas sin traslado desde la bandeja administrativa", async () => {
  m.listar.mockResolvedValueOnce([ticket]).mockResolvedValueOnce([{ ...ticket, estado: "resuelto" }]);
  await act(async () => root.render(<TicketsSoporte />));
  const boton = Array.from(contenedor.querySelectorAll("button")).find(b => b.textContent === "Marcar resuelto");
  expect(boton).toBeDefined();
  await act(async () => boton!.click());
  expect(contenedor.textContent).toContain("Estado: resuelto");
  expect(m.resolver).toHaveBeenCalledWith({}, ticket.id);
  expect(contenedor.querySelector("a")).toBeNull();
});
it("no presenta una consulta fallida como bandeja vacía", async () => {
  m.listar.mockRejectedValue(new Error("fallo"));
  await act(async () => root.render(<TicketsSoporte />));
  expect(contenedor.querySelector('[role="alert"]')?.textContent).toContain("No pudimos consultar");
  expect(contenedor.textContent).not.toContain("No hay consultas registradas.");
});
