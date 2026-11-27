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
import { Ubicaciones } from "./Ubicaciones";
import {
  construirUbicaciones,
  direccionCompleta,
  enlaceBuscarUbicacion,
  type UbicacionUsuario,
} from "./ubicaciones-usuario";
import {
  aplicarOperacionLibreta,
  libretaVacia,
  leerLibreta,
  validarDatosUbicacion,
  type DatosUbicacion,
  type OperacionUbicacion,
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
/* jsdom no implementa <dialog> modal; Sheet lo usa. */
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
};
function simularAncho(ancho: number) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0) <= ancho,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}
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
  simularAncho(1280);
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
  it("reutiliza el domicilio con distintos formatos sin confundir calles del mismo código postal", () => {
    const perfil = {
      calle: "LOS SERRANOS", numero: "225", colonia: "La Magdalena",
      codigo_postal: "52104", ciudad: "San Mateo Atenco", estado: "México",
    } as Usuario;
    const historial = [{
      origen_direccion: "Calle de los Serrano 225, La Magdalena, 52104",
      origen_ciudad: "San Mateo Atenco",
      destino_direccion: "LOS SERRANOS 225, LA MAGDALENA, 52104, ESTADO DE MÉXICO, SAN MATEO ATENCO",
      destino_ciudad: "SAN MATEO ATENCO",
      creado_en: "2026-10-27T12:00:00Z",
    }] as Traslado[];
    const [domicilio, otra] = construirUbicaciones(perfil, historial);
    expect(domicilio.fuentes).toEqual(["perfil", "destino"]);
    expect(domicilio.usos).toBe(1);
    expect(direccionCompleta(domicilio)).toBe("Los Serranos 225, La Magdalena, 52104, San Mateo Atenco, Estado de México");
    expect(otra.direccion).toMatch(/^Calle de los Serrano/);
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
describe("Mis ubicaciones", () => {
  it("selecciona filas y sincroniza metadata y enlace", () => {
    render(<Ubicaciones ubicaciones={lista()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver Juárez 25" }));
    const detalle = screen.getByRole("complementary", {
      name: "Detalle de Juárez 25",
    });
    expect(within(detalle).getByText("19.2, -99.5")).toBeInTheDocument();
    expect(
      within(detalle).getByRole("link", { name: "Usar como origen" }),
    ).toHaveAttribute("href", enlaceBuscarUbicacion(lista()[1], "origen"));
    fireEvent.click(
      within(detalle).getByRole("button", { name: "Cerrar detalle" }),
    );
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
  it("filtra sin acentos, admite vacío y limpia filtros", () => {
    render(<Ubicaciones ubicaciones={lista()} />);
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
  it("usa una sola clasificación y permite acceder a una dirección por cada rol", () => {
    render(<Ubicaciones ubicaciones={lista()} />);
    expect(screen.queryByRole("combobox", { name: "Tipo de ubicación" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Orígenes (2)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Destinos (1)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Destinos (1)" })).toHaveAttribute("aria-pressed", "true");
  });
  it("identifica de forma explícita el destino y ofrece ambos campos en el panel", () => {
    const destino = { ...lista()[1], fuentes: ["destino"] } satisfies UbicacionUsuario;
    render(<Ubicaciones ubicaciones={[destino]} />);
    const fila = within(screen.getByRole("listitem"));
    const panel = within(screen.getByRole("complementary"));
    expect(fila.getByRole("link", { name: "Usar como destino" })).toHaveAttribute("href", enlaceBuscarUbicacion(destino, "destino"));
    expect(panel.getByRole("link", { name: "Usar como origen" })).toHaveAttribute("href", enlaceBuscarUbicacion(destino, "origen"));
    expect(panel.getByRole("link", { name: "Usar como destino" })).toHaveAttribute("href", enlaceBuscarUbicacion(destino, "destino"));
  });
  it("copia y notifica únicamente el resultado del portapapeles", async () => {
    render(<Ubicaciones ubicaciones={lista()} />);
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
    render(<Ubicaciones ubicaciones={lista()} />);
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
    render(<Ubicaciones ubicaciones={muchas} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Mostrando 21–23 de 23 ubicaciones",
    );
  });
  it("abre el editor real del perfil y refresca la lista", () => {
    render(<Ubicaciones ubicaciones={lista()} />);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(push).toHaveBeenCalledWith("/cuenta/datos-personales");
    fireEvent.click(
      screen.getByRole("button", { name: "Actualizar ubicaciones" }),
    );
    expect(refresh).toHaveBeenCalled();
  });
  it("presenta un estado vacío útil", () => {
    render(<Ubicaciones ubicaciones={[]} />);
    expect(
      screen.getByRole("heading", {
        name: "Aún no tienes direcciones registradas",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Completar domicilio del perfil" }),
    ).toHaveAttribute("href", "/cuenta/datos-personales");
  });

  it("en pantallas angostas no abre detalle hasta elegir y lo muestra en una hoja", () => {
    simularAncho(390);
    render(<Ubicaciones ubicaciones={lista()} />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver Juárez 25" }));
    const hoja = within(screen.getByRole("dialog", { name: "Juárez 25" }));
    expect(hoja.getByText("19.2, -99.5")).toBeInTheDocument();
    expect(hoja.getByRole("link", { name: "Usar como origen" })).toHaveAttribute("href", enlaceBuscarUbicacion(lista()[1], "origen"));
    fireEvent.click(hoja.getByRole("button", { name: "Cerrar detalle" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("crea una ubicación desde el editor y la deja seleccionada", async () => {
    mutar.mockImplementationOnce(async (op: OperacionUbicacion) => ({ ok: true, libreta: aplicarOperacionLibreta(libretaVacia(), op) }));
    render(<Ubicaciones ubicaciones={lista()} />);
    fireEvent.click(screen.getByRole("button", { name: "Nueva ubicación" }));
    const editor = within(screen.getByRole("dialog", { name: "Nueva ubicación" }));
    fireEvent.change(editor.getByLabelText("Alias o nombre"), { target: { value: "Oficina Norte" } });
    fireEvent.change(editor.getByLabelText("Dirección"), { target: { value: "Insurgentes 100" } });
    fireEvent.change(editor.getByLabelText("Ciudad o municipio"), { target: { value: "Toluca" } });
    fireEvent.click(editor.getByRole("button", { name: "Guardar ubicación" }));
    await waitFor(() => expect(screen.getByRole("complementary", { name: "Detalle de Oficina Norte" })).toBeInTheDocument());
    expect(screen.queryByRole("dialog", { name: "Nueva ubicación" })).not.toBeInTheDocument();
    expect(screen.getByText("Ubicación guardada")).toBeInTheDocument();
  });
});
