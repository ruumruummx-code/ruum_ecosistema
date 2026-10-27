/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PantallaCuentaResponsive } from "./PantallaCuentaResponsive";
import type { CuentaReal } from "./cuenta-ui";

vi.mock("../NavegacionUsuario", () => ({ NavegacionUsuario: () => null }));
vi.mock("../../components/layout/UserDashboardLayout", () => ({ UserDashboardLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
afterEach(() => vi.unstubAllGlobals());

describe("editores de cuenta responsivos", () => {
  it.each([true, false])("monta solo un editor con viewport desktop=%s", (matches) => {
    vi.stubGlobal("matchMedia", () => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<PantallaCuentaResponsive cuenta={{ usuario: { nombre: "Ana" }, vehiculos: [] } as unknown as CuentaReal} titulo="Mi perfil" descripcion="Datos del perfil" movil={<input aria-label="Editor móvil" />} escritorio={<input aria-label="Editor desktop" />} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: matches ? "Editor desktop" : "Editor móvil" })).toBeInTheDocument();
  });
});
