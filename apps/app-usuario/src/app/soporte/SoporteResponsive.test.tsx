/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { SoporteResponsive } from "./SoporteResponsive";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../../components/layout/UserDashboardLayout", () => ({ UserDashboardLayout: ({ children }: { children: ReactNode }) => <main data-testid="desktop">{children}</main> }));
vi.mock("../NavegacionUsuario", () => ({ NavegacionUsuario: () => <nav data-testid="mobile" /> }));

beforeEach(() => vi.clearAllMocks());
describe("Ayuda responsive", () => {
  it("conserva el reporte abierto y su texto al cambiar de resolución", async () => {
    let cambiar = () => {};
    const media = { matches: true, addEventListener: (_: string, callback: () => void) => { cambiar = callback; }, removeEventListener: vi.fn() };
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => media });
    render(<SoporteResponsive usuario={null} traslados={[]} canalPreseleccionado="chat" />);
    const descripcion = await screen.findByLabelText(/Descripción/);
    fireEvent.change(descripcion, { target: { value: "Mi pago ya fue aprobado pero el lote no avanza." } });
    const dialog = screen.getByRole("dialog");
    act(() => { media.matches = false; cambiar(); });
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(screen.getByLabelText(/Descripción/)).toBe(descripcion);
    expect(descripcion).toHaveValue("Mi pago ya fue aprobado pero el lote no avanza.");
    act(() => { media.matches = true; cambiar(); });
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
  it.each([true, false])("monta un solo reporte con desktop=%s", async desktop => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: desktop, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
    render(<SoporteResponsive usuario={null} traslados={[]} canalPreseleccionado="chat" />);
    expect(await screen.findAllByRole("dialog")).toHaveLength(1);
    expect(screen.getAllByLabelText(/Descripción/)).toHaveLength(1);
    expect(screen.getByTestId(desktop ? "desktop" : "mobile")).toBeInTheDocument();
  });
  it("conserva los canales y permite reintentar cuando falla la carga", async () => {
    render(<SoporteResponsive usuario={null} traslados={[]} errorCarga />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar");
    expect(screen.getByRole("link", { name: "Correo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refresh).toHaveBeenCalledOnce();
  });
});
