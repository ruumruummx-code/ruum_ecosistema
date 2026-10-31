import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

const state = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0 }));
const api = vi.hoisted(() => ({ actualizar: vi.fn(), listar: vi.fn(), evidencia: vi.fn() }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: () => {},
  useCallback: (fn: unknown) => fn,
  useMemo: (fn: () => unknown) => fn(),
  useState: (initial: unknown) => {
    const index = state.cursor++;
    if (!(index in state.slots)) state.slots[index] = initial;
    return [state.slots[index], (next: unknown) => {
      state.slots[index] = typeof next === "function" ? next(state.slots[index]) : next;
    }];
  },
}));
vi.mock("@ruum/api/services", () => ({
  listarVehiculosAdminPaginados: api.listar,
  obtenerEvidenciaVehiculo: api.evidencia,
  actualizarVehiculoAdmin: api.actualizar,
  resolverUrlEvidencia: vi.fn(),
}));
vi.mock("../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: () => true,
}));
vi.mock("@ruum/ui", () => ({ Aviso: "aside" }));
vi.mock("../admin-ui", () => ({ AdminPageHeader: "header", AdminPanel: "section" }));
vi.mock("../admin-components", () => ({
  AdminButton: "button", AdminEmptyState: "div", AdminErrorState: "div", AdminLoadingState: "div",
}));
import PaginaVehiculosAdmin from "./page";

type Element = ReactElement<Record<string, any>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const el = node as Element;
  return [el, ...elements(el.props.children)];
}
function render() { state.cursor = 0; return elements(PaginaVehiculosAdmin()); }
function button(tree: Element[], text: string) {
  const el = tree.find((el) => el.type === "button" && el.props.children === text);
  expect(el, `Botón ${text}`).toBeDefined();
  return el!;
}
const vehicle = { id: "vehiculo-1", usuario_id: "usuario-1", marca: "Peugeot", modelo: "Boxer", anio: 2025, tipo: "van", placas: "TEST111", vin: "1HGCM82633A004352", version: 7 };

beforeEach(() => {
  vi.clearAllMocks();
  state.slots = [{ vehiculos: [vehicle], usuarios: [] }, false];
  state.cursor = 0;
  api.listar.mockResolvedValue({ vehiculos: [vehicle], usuarios: [], paginacion: { pagina: 1, total: 1, total_paginas: 1 } });
  api.actualizar.mockResolvedValue(vehicle);
});
describe("Corrección administrativa de vehículo", () => {
  it("abre la corrección directamente desde Editar sin consultar Evidencia", () => {
    button(render(), "Editar").props.onClick();
    const tree = render();
    expect(tree.some((el) => el.props.role === "dialog")).toBe(true);
    expect(tree.find((el) => el.type === "input" && el.props["data-ruum-label"] === "VIN")?.props.value).toBe(vehicle.vin);
    expect(api.evidencia).not.toHaveBeenCalled();
  });
  it("guarda las placas corregidas usando la versión del vehículo seleccionado", async () => {
    button(render(), "Editar").props.onClick();
    const field = render().find((el) => el.type === "input" && el.props["data-ruum-label"] === "Placas")!;
    field.props.onChange({ target: { value: "ABC1234" } });
    button(render(), "Guardar cambios").props.onClick();
    await vi.waitFor(() => expect(api.actualizar).toHaveBeenCalledWith({}, vehicle.id, expect.objectContaining({ placas: "ABC1234" }), 7));
    await vi.waitFor(() => expect(render().some((el) => el.props.role === "dialog")).toBe(false));
  });
  it("cierra la corrección sin modificar el vehículo", () => {
    button(render(), "Editar").props.onClick();
    button(render(), "Cancelar").props.onClick();
    expect(render().some((el) => el.props.role === "dialog")).toBe(false);
    expect(api.actualizar).not.toHaveBeenCalled();
  });
});
