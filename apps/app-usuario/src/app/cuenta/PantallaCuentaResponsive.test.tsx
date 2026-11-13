/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { PantallaCuentaResponsive } from "./PantallaCuentaResponsive";
import type { CuentaReal } from "./cuenta-ui";

vi.mock("../NavegacionUsuario", () => ({ NavegacionUsuario: () => null }));
vi.mock("../../components/layout/UserDashboardLayout", () => ({ UserDashboardLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
afterEach(() => vi.unstubAllGlobals());
const montar = vi.fn();
const desmontar = vi.fn();
function Editor({ desktop = false }: { desktop?: boolean }) {
  const [nombre, setNombre] = useState("Ana");
  useEffect(() => { montar(); return () => desmontar(); }, []);
  return <><input aria-label="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} /><input aria-label="Foto" type="file" /><span>{desktop ? "Desktop" : "Móvil"}</span></>;
}

describe("editores de cuenta responsivos", () => {
  it("conserva campos y archivos al cruzar el breakpoint sin desmontar el editor", () => {
    montar.mockClear(); desmontar.mockClear();
    let cambiar = () => {};
    const media = { matches: true, addEventListener: (_: string, callback: () => void) => { cambiar = callback; }, removeEventListener: vi.fn() };
    vi.stubGlobal("matchMedia", () => media);
    const { unmount } = render(<PantallaCuentaResponsive cuenta={{ usuario: { nombre: "Ana" }, vehiculos: [] } as unknown as CuentaReal} titulo="Mi perfil" descripcion="Datos" movil={<Editor />} escritorio={<Editor desktop />} />);
    const nombre = screen.getByLabelText("Nombre");
    const foto = screen.getByLabelText("Foto");
    const archivo = new File(["foto"], "perfil.png", { type: "image/png" });
    fireEvent.change(nombre, { target: { value: "Ana editada" } });
    fireEvent.change(foto, { target: { files: [archivo] } });
    act(() => { media.matches = false; cambiar(); });
    expect(screen.getByLabelText("Nombre")).toBe(nombre);
    expect(nombre).toHaveValue("Ana editada");
    expect((screen.getByLabelText("Foto") as HTMLInputElement).files?.[0]).toBe(archivo);
    act(() => { media.matches = true; cambiar(); });
    expect(screen.getByLabelText("Nombre")).toBe(nombre);
    expect(montar).toHaveBeenCalledOnce();
    expect(desmontar).not.toHaveBeenCalled();
    unmount();
    expect(desmontar).toHaveBeenCalledOnce();
  });
  it.each([true, false])("monta solo un editor con viewport desktop=%s", (matches) => {
    vi.stubGlobal("matchMedia", () => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<PantallaCuentaResponsive cuenta={{ usuario: { nombre: "Ana" }, vehiculos: [] } as unknown as CuentaReal} titulo="Mi perfil" descripcion="Datos del perfil" movil={<input aria-label="Editor móvil" />} escritorio={<input aria-label="Editor desktop" />} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: matches ? "Editor desktop" : "Editor móvil" })).toBeInTheDocument();
  });
});
