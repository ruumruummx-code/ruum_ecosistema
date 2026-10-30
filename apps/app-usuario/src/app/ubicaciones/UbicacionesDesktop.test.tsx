/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { Database } from "@ruum/shared/types";
import { UbicacionesDesktop } from "./UbicacionesDesktop";
import {
  construirUbicaciones,
  enlaceBuscarUbicacion,
  type UbicacionUsuario,
} from "./ubicaciones-usuario";
import {
  aplicarOperacionLibreta,
  libretaVacia,
  leerLibreta,
  validarDatosUbicacion,
  type DatosUbicacion,
} from "./libreta-ubicaciones";
const { refresh, push, mutar, copiar } = vi.hoisted(() => ({
  refresh: vi.fn(),
  push: vi.fn(),
  mutar: vi.fn(),
  copiar: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));
vi.mock("./cliente-ubicaciones", () => ({ guardarOperacionUbicacion: mutar }));
vi.mock("next/dynamic", () => ({
  default: () => () => <div>Mapa de la ubicación</div>,
}));
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Traslado = Database["public"]["Views"]["pasaporte_digital"]["Row"];
const usuario = {
  calle: "Reforma",
  numero: "10",
  colonia: "Roma",
  codigo_postal: "06700",
  ciudad: "Ciudad de México",
} as Usuario;
const traslados = [
  {
    origen_direccion: "Reforma 10, Roma, 06700",
    origen_ciudad: "Ciudad de México",
    destino_direccion: "Juárez 25",
    destino_ciudad: "Toluca",
    creado_en: "2026-10-27T12:00:00Z",
    destino_lat: 19.2,
    destino_lng: -99.5,
  },
  {
    origen_direccion: "Juárez 25",
    origen_ciudad: "Toluca",
    destino_direccion: "",
    destino_ciudad: "Metepec",
    creado_en: "2026-10-26T12:00:00Z",
  },
] as Traslado[];
const datos: DatosUbicacion = {
  alias: "Oficina",
  direccion: "Reforma 296",
  ciudad: "CDMX",
  estado: "CDMX",
  codigoPostal: "06600",
  referencia: "Recepción",
  tipo: "trabajo",
  lat: 19.4,
  lng: -99.1,
};
const id = "guardada:80000000-0000-4000-8000-000000000001";
const lista = () => construirUbicaciones(usuario, traslados);
beforeEach(() => {
  vi.clearAllMocks();
  copiar.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: copiar },
  });
  let libro = libretaVacia();
  mutar.mockImplementation(async (op) => {
    libro = aplicarOperacionLibreta(libro, op);
    return { ok: true, libreta: libro };
  });
});
describe("Libreta de ubicaciones", () => {
  it("combina historial y perfil sin duplicados y conserva coordenadas reales", () => {
    const l = lista();
    expect(l).toHaveLength(2);
    expect(l[0].fuentes).toEqual(["perfil", "origen"]);
    expect(l[1].usos).toBe(2);
    expect(l[1].lat).toBe(19.2);
  });
  it("no inventa direcciones ni fechas", () => {
    expect(
      construirUbicaciones(
        { codigo_postal: "06700", ciudad: "CDMX" } as Usuario,
        [],
      ),
    ).toEqual([]);
    expect(
      construirUbicaciones({ direccion_principal: "Hidalgo 8" } as Usuario, [
        { origen_direccion: "Centro 1", creado_en: "invalida" } as Traslado,
      ])[1].ultimoUso,
    ).toBeNull();
  });
  it("distingue ciudades y codifica enlaces al wizard", () => {
    const u = lista()[1];
    const url = new URL(
      enlaceBuscarUbicacion(u, "destino"),
      "https://example.test",
    );
    expect(url.searchParams.get("buscar_destino")).toBe("Juárez 25, Toluca");
    expect(
      construirUbicaciones({} as Usuario, [
        {
          origen_direccion: "Centro 1",
          origen_ciudad: "Toluca",
          destino_direccion: "Centro 1",
          destino_ciudad: "Lerma",
        } as Traslado,
      ]),
    ).toHaveLength(2);
  });
  it("crea, actualiza y elimina con control de versión sin mutar el original", () => {
    const inicial = libretaVacia();
    const uno = aplicarOperacionLibreta(inicial, {
      tipo: "guardar",
      id,
      datos,
      versionEsperada: null,
      favorita: true,
    });
    expect(inicial.entradas).toHaveLength(0);
    expect(uno.entradas[0].version).toBe(1);
    const dos = aplicarOperacionLibreta(uno, {
      tipo: "guardar",
      id,
      datos: { ...datos, alias: "Oficina nueva" },
      versionEsperada: 1,
      favorita: false,
    });
    expect(dos.entradas[0].version).toBe(2);
    expect(() =>
      aplicarOperacionLibreta(dos, {
        tipo: "eliminar",
        id,
        versionEsperada: 1,
      }),
    ).toThrow(/otra sesión/);
    expect(
      aplicarOperacionLibreta(dos, { tipo: "eliminar", id, versionEsperada: 2 })
        .entradas,
    ).toEqual([]);
  });
  it("archiva las fuentes sin alterar el perfil o los viajes", () => {
    const base = lista();
    const libro = aplicarOperacionLibreta(libretaVacia(), {
      tipo: "eliminar",
      id: base[0].id,
    });
    expect(
      construirUbicaciones(
        {
          ...usuario,
          preferencias: { ubicaciones_v1: libro },
        } as unknown as Usuario,
        traslados,
      ),
    ).toHaveLength(1);
    expect(lista()).toHaveLength(2);
  });
  it("valida coordenadas, código postal y entradas malformadas", () => {
    expect(() => validarDatosUbicacion({ ...datos, lat: null })).toThrow(
      /ambas/,
    );
    expect(() => validarDatosUbicacion({ ...datos, lng: 181 })).toThrow(
      /coordenadas/,
    );
    expect(() =>
      validarDatosUbicacion({ ...datos, codigoPostal: "123a5" }),
    ).toThrow(/5 dígitos/);
    expect(
      leerLibreta({
        ubicaciones_v1: {
          version: 1,
          entradas: [{ id: "bad" }],
          favoritos: JSON.parse('{"__proto__":true}'),
        },
      }),
    ).toEqual(libretaVacia());
  });
});
describe("Mis ubicaciones desktop", () => {
  it("selecciona filas y sincroniza metadata y enlace", () => {
    render(<UbicacionesDesktop ubicaciones={lista()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver Juárez 25" }));
    const detalle = screen.getByRole("complementary", {
      name: "Detalle de Juárez 25",
    });
    expect(within(detalle).getByText("19.2, -99.5")).toBeInTheDocument();
    expect(
      within(detalle).getByRole("link", { name: "Usar en traslado" }),
    ).toHaveAttribute("href", enlaceBuscarUbicacion(lista()[1], "origen"));
    fireEvent.click(
      within(detalle).getByRole("button", { name: "Cerrar detalle" }),
    );
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
  it("filtra sin acentos, admite vacío y limpia filtros", () => {
    render(<UbicacionesDesktop ubicaciones={lista()} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "JUAREZ" },
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "no existe" },
    });
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Limpiar filtros" })[0],
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
  it("filtra por tipo y permite navegar categorías con teclado", () => {
    render(<UbicacionesDesktop ubicaciones={lista()} />);
    fireEvent.change(
      screen.getByRole("combobox", { name: "Tipo de ubicación" }),
      { target: { value: "perfil" } },
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    const todas = screen.getByRole("tab", { name: "Todas (2)" });
    fireEvent.keyDown(todas, { key: "ArrowRight" });
    expect(
      screen.getByRole("tab", { name: "Domicilio del perfil (1)" }),
    ).toHaveAttribute("aria-selected", "true");
  });
  it("copia y notifica únicamente el resultado del portapapeles", async () => {
    render(<UbicacionesDesktop ubicaciones={lista()} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar dirección" }));
    await waitFor(() =>
      expect(screen.getByText("Dirección copiada")).toBeInTheDocument(),
    );
    expect(copiar).toHaveBeenCalledWith(
      "Reforma 10, Roma, 06700, Ciudad de México",
    );
    copiar.mockRejectedValueOnce(new Error("denied"));
    fireEvent.click(screen.getByRole("button", { name: "Copiar dirección" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/No pudimos copiar/),
    );
  });
  it("persiste favoritos y conserva el estado ante un error", async () => {
    render(<UbicacionesDesktop ubicaciones={lista()} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Marcar ubicación seleccionada como frecuente",
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "Quitar ubicación seleccionada de frecuentes",
        }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    mutar.mockResolvedValueOnce({ ok: false, mensaje: "No pudimos guardar" });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Quitar ubicación seleccionada de frecuentes",
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("No pudimos guardar"),
    );
    expect(
      screen.getByRole("button", {
        name: "Quitar ubicación seleccionada de frecuentes",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("pagina internamente sin perder filas", () => {
    const muchas: UbicacionUsuario[] = Array.from({ length: 23 }, (_, i) => ({
      id: String(i),
      direccion: `Dirección ${i}`,
      ciudad: "Toluca",
      fuentes: ["otro"],
      usos: 0,
      ultimoUso: null,
    }));
    render(<UbicacionesDesktop ubicaciones={muchas} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Mostrando 21–23 de 23 ubicaciones",
    );
  });
  it("abre el editor real del perfil y refresca la lista", () => {
    render(<UbicacionesDesktop ubicaciones={lista()} />);
    fireEvent.click(screen.getByRole("button", { name: "Editar información" }));
    expect(push).toHaveBeenCalledWith("/cuenta/datos-personales");
    fireEvent.click(
      screen.getByRole("button", { name: "Actualizar ubicaciones" }),
    );
    expect(refresh).toHaveBeenCalled();
  });
  it("presenta un estado vacío útil", () => {
    render(<UbicacionesDesktop ubicaciones={[]} />);
    expect(
      screen.getByRole("heading", {
        name: "Aún no tienes direcciones registradas",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Completar domicilio del perfil" }),
    ).toHaveAttribute("href", "/cuenta/datos-personales");
  });
});
