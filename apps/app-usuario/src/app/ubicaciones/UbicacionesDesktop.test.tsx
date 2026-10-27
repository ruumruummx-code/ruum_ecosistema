/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Database } from "@ruum/shared/types";
import { UbicacionesDesktop } from "./UbicacionesDesktop";
import { construirUbicaciones, enlaceBuscarUbicacion } from "./ubicaciones-usuario";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Traslado = Database["public"]["Views"]["pasaporte_digital"]["Row"];
const usuario = { calle: "Reforma", numero: "10", colonia: "Roma", codigo_postal: "06700", ciudad: "Ciudad de México" } as Usuario;
const traslados = [
  { origen_direccion: "Reforma 10, Roma, 06700", origen_ciudad: "Ciudad de México", destino_direccion: "Juárez 25", destino_ciudad: "Toluca", creado_en: "2026-10-27T12:00:00Z" },
  { origen_direccion: "Juárez 25", origen_ciudad: "Toluca", destino_direccion: "", destino_ciudad: "Metepec", creado_en: "2026-10-26T12:00:00Z" },
] as Traslado[];

describe("Mis ubicaciones desktop", () => {
  it("combina el perfil con el historial sin duplicar la misma dirección", () => {
    const lista = construirUbicaciones(usuario, traslados);
    expect(lista).toHaveLength(2);
    expect(lista[0].fuentes).toEqual(["perfil", "origen"]);
    expect(lista[1].fuentes).toEqual(["destino", "origen"]);
    expect(lista[1].ultimoUso).toBe("2026-10-27T12:00:00Z");
    expect(lista[1].usos).toBe(2);
  });

  it("no inventa una dirección cuando solo existe un código postal o ciudad", () => {
    expect(construirUbicaciones({ codigo_postal: "06700", ciudad: "CDMX" } as Usuario, [])).toEqual([]);
  });

  it("conserva la dirección principal legacy y excluye fechas inválidas", () => {
    const lista = construirUbicaciones({ direccion_principal: "Hidalgo 8", ciudad: "Toluca" } as Usuario, [{ origen_direccion: "Juárez 25", creado_en: "fecha inválida" } as Traslado]);
    expect(lista[0].direccion).toBe("Hidalgo 8");
    expect(lista[1].ultimoUso).toBeNull();
  });

  it("mantiene separadas direcciones iguales de distintas ciudades", () => {
    expect(construirUbicaciones({} as Usuario, [{ origen_direccion: "Centro 1", origen_ciudad: "Toluca", destino_direccion: "Centro 1", destino_ciudad: "Lerma" } as Traslado])).toHaveLength(2);
  });

  it("busca sin distinguir acentos y conserva los resultados vacíos", () => {
    render(<UbicacionesDesktop ubicaciones={construirUbicaciones(usuario, traslados)} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "JUAREZ" } });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "inexistente" } });
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Mostrando 0 de 2 ubicaciones");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("filtra el origen de los datos y abre el editor real del domicilio", () => {
    render(<UbicacionesDesktop ubicaciones={construirUbicaciones(usuario, traslados)} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "perfil" } });
    const fila = screen.getByRole("article");
    expect(within(fila).getByRole("link", { name: "Editar domicilio del perfil" })).toHaveAttribute("href", "/cuenta/datos-personales");
    expect(screen.queryByRole("button", { name: /Eliminar/ })).not.toBeInTheDocument();
  });

  it("genera un enlace codificado para buscar la dirección como destino", () => {
    const lugar = construirUbicaciones(usuario, traslados)[1];
    const url = new URL(enlaceBuscarUbicacion(lugar, "destino"), "https://example.test");
    expect(url.pathname).toBe("/viajes/nuevo");
    expect(url.searchParams.get("buscar_destino")).toBe("Juárez 25, Toluca");
    render(<UbicacionesDesktop ubicaciones={[lugar]} />);
    expect(screen.getByRole("link", { name: "Buscar como destino" })).toHaveAttribute("href", url.pathname + url.search);
  });

  it("muestra un vacío útil y permite actualizar los datos", () => {
    render(<UbicacionesDesktop ubicaciones={[]} />);
    expect(screen.getByRole("heading", { name: "Aún no tienes direcciones registradas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Completar domicilio del perfil" })).toHaveAttribute("href", "/cuenta/datos-personales");
    fireEvent.click(screen.getByRole("button", { name: "Actualizar ubicaciones" }));
    expect(refresh).toHaveBeenCalled();
  });
});
