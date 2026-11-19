import type { Database } from "@ruum/shared/types";
import {
  coordenadasValidas,
  leerLibreta,
  type LibretaUbicaciones,
} from "./libreta-ubicaciones";
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Traslado = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type FuenteUbicacion =
  | "perfil"
  | "origen"
  | "destino"
  | "trabajo"
  | "otro";
export interface UbicacionUsuario {
  id: string;
  direccion: string;
  ciudad: string;
  fuentes: FuenteUbicacion[];
  usos: number;
  ultimoUso: string | null;
  alias?: string;
  estado?: string;
  codigoPostal?: string;
  referencia?: string;
  lat?: number | null;
  lng?: number | null;
  favorita?: boolean;
  guardada?: boolean;
  version?: number;
  creadoEn?: string;
}
export const ETIQUETAS_UBICACION: Record<FuenteUbicacion, string> = {
  perfil: "Domicilio del perfil",
  origen: "Origen de traslado",
  destino: "Destino de traslado",
  trabajo: "Trabajo",
  otro: "Otro",
};
export function tipoUbicacion(u: UbicacionUsuario): FuenteUbicacion {
  return u.fuentes.includes("perfil")
    ? "perfil"
    : u.fuentes.includes("trabajo")
      ? "trabajo"
      : (u.fuentes[0] ?? "otro");
}
export function normalizarBusqueda(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
const CONECTORES = new Set(["al", "de", "del", "la", "las", "el", "los", "y"]);

function formatearUbicacion(texto: string): string {
  return texto.trim().replace(/\s+/g, " ").replace(/\p{L}+/gu, (palabra, inicio: number, cadena: string) => {
    const minusculas = palabra.toLocaleLowerCase("es-MX");
    if (/^cdmx$/i.test(palabra)) return palabra.toUpperCase();
    if (inicio > 0 && CONECTORES.has(minusculas) && !/,\s*$/.test(cadena.slice(0, inicio))) return minusculas;
    return minusculas.charAt(0).toLocaleUpperCase("es-MX") + minusculas.slice(1);
  });
}

function estadoVisible(estado?: string): string {
  return ["mexico", "edomex"].includes(normalizarBusqueda(estado ?? ""))
    ? "Estado de México"
    : formatearUbicacion(estado ?? "");
}

function partesDireccion(u: UbicacionUsuario) {
  const partes = u.direccion.split(",").map(p => p.trim()).filter(Boolean);
  const [municipio, ...calificadores] = u.ciudad.split(",").map(p => p.trim());
  const estadoExplicito = [...calificadores, ...partes.slice(1)].find(p =>
    ["estado de mexico", "edomex", "cdmx"].includes(normalizarBusqueda(p)),
  );
  const estado = estadoVisible(u.estado || estadoExplicito);
  const ciudad = calificadores.every(p => normalizarBusqueda(p) === normalizarBusqueda(estadoExplicito ?? ""))
    ? municipio
    : u.ciudad.trim();
  const sufijos = [ciudad, estado, estadoExplicito ?? "", "México"].map(normalizarBusqueda).filter(Boolean);
  while (partes.length > 1 && sufijos.includes(normalizarBusqueda(partes.at(-1)!))) partes.pop();
  const direccion = partes.join(", ");
  const postal = u.codigoPostal && !direccion.split(/\D+/).includes(u.codigoPostal) ? u.codigoPostal : "";
  return { direccion, ciudad, estado, postal };
}

/** Coincidencia de calle, número, detalles postales y ciudad, sin aproximar nombres distintos. */
function claveDomicilio({ direccion, ciudad, postal }: ReturnType<typeof partesDireccion>): string | null {
  if (!ciudad || !/\d/.test(direccion)) return null;
  return normalizarBusqueda([direccion, postal].join(" ").replace(/[,.;]+/g, " ")) + "|" + normalizarBusqueda(ciudad);
}

function agruparDomicilio(base: UbicacionUsuario[], libreta: LibretaUbicaciones): UbicacionUsuario[] {
  const perfil = base.find(u => u.fuentes.includes("perfil"));
  if (!perfil) return base.filter(u => !libreta.ocultas.includes(u.id));
  const partesPerfil = partesDireccion(perfil);
  const clave = claveDomicilio(partesPerfil);
  if (!clave) return base.filter(u => !libreta.ocultas.includes(u.id));
  const estadoPerfil = normalizarBusqueda(partesPerfil.estado);
  const compatibles = base.filter(u => {
    if (u.id === perfil.id || u.guardada) return false;
    const partes = partesDireccion(u);
    const estado = normalizarBusqueda(partes.estado);
    return claveDomicilio(partes) === clave && (!estado || !estadoPerfil || estado === estadoPerfil);
  });
  const ids = new Set(compatibles.map(u => u.id));
  const visibles = compatibles.filter(u => !libreta.ocultas.includes(u.id));
  const conCoordenadas = coordenadasValidas(perfil.lat, perfil.lng)
    ? perfil
    : visibles.find(u => coordenadasValidas(u.lat, u.lng));
  const domicilio = {
    ...perfil,
    fuentes: [...new Set([...perfil.fuentes, ...visibles.flatMap(u => u.fuentes)])],
    usos: perfil.usos + visibles.reduce((total, u) => total + u.usos, 0),
    ultimoUso: [perfil.ultimoUso, ...visibles.map(u => u.ultimoUso)]
      .filter((fecha): fecha is string => Boolean(fecha))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null,
    lat: conCoordenadas?.lat,
    lng: conCoordenadas?.lng,
    favorita: libreta.favoritos[perfil.id] ?? visibles.some(u => libreta.favoritos[u.id] === true),
  };
  return base.filter(u => !ids.has(u.id) && !libreta.ocultas.includes(u.id))
    .map(u => u.id === perfil.id ? domicilio : u);
}

export function ladoHabitual(u: UbicacionUsuario): "origen" | "destino" {
  return u.fuentes.includes("destino") && !u.fuentes.includes("origen") && !u.fuentes.includes("perfil")
    ? "destino"
    : "origen";
}

/** The original service addresses remain immutable; the address book is a separate account namespace. */
export function construirUbicacionesBase(
  usuario: Usuario,
  traslados: Traslado[],
): UbicacionUsuario[] {
  const ubicaciones = new Map<string, UbicacionUsuario>();
  const agregar = (
    direccion: string | null | undefined,
    ciudad: string | null | undefined,
    fuente: FuenteUbicacion,
    fecha?: string | null,
    metadata: Partial<UbicacionUsuario> = {},
  ) => {
    if (!direccion?.trim()) return;
    const clave = normalizarBusqueda(direccion + " " + (ciudad ?? ""));
    const fechaValida =
      fecha && Number.isFinite(Date.parse(fecha)) ? fecha : null;
    const existente = ubicaciones.get(clave);
    if (existente) {
      if (!existente.fuentes.includes(fuente)) existente.fuentes.push(fuente);
      if (fuente !== "perfil") existente.usos++;
      if (
        !coordenadasValidas(existente.lat, existente.lng) &&
        coordenadasValidas(metadata.lat, metadata.lng)
      ) {
        existente.lat = metadata.lat;
        existente.lng = metadata.lng;
      }
      if (!existente.referencia && metadata.referencia)
        existente.referencia = metadata.referencia;
      if (
        fechaValida &&
        (!existente.ultimoUso ||
          Date.parse(fechaValida) > Date.parse(existente.ultimoUso))
      )
        existente.ultimoUso = fechaValida;
      return;
    }
    ubicaciones.set(clave, {
      ...metadata,
      id: clave,
      direccion: direccion.trim(),
      ciudad: ciudad?.trim() ?? "",
      fuentes: [fuente],
      usos: fuente === "perfil" ? 0 : 1,
      ultimoUso: fechaValida,
    });
  };
  const domicilioPerfil = [
    [usuario.calle, usuario.numero].filter((v) => v?.trim()).join(" "),
    usuario.colonia,
    usuario.codigo_postal,
  ]
    .filter((v) => v?.trim())
    .join(", ");
  agregar(
    usuario.calle?.trim() ? domicilioPerfil : usuario.direccion_principal,
    usuario.ciudad,
    "perfil",
    null,
    {
      alias: "Domicilio del perfil",
      estado: usuario.estado ?? undefined,
      codigoPostal: usuario.codigo_postal ?? undefined,
      referencia: usuario.referencias ?? undefined,
    },
  );
  for (const t of traslados) {
    agregar(t.origen_direccion, t.origen_ciudad, "origen", t.creado_en, {
      lat: coordenadasValidas(t.origen_lat, t.origen_lng) ? t.origen_lat : null,
      lng: coordenadasValidas(t.origen_lat, t.origen_lng) ? t.origen_lng : null,
      referencia: t.origen_referencias ?? undefined,
    });
    agregar(t.destino_direccion, t.destino_ciudad, "destino", t.creado_en, {
      lat: coordenadasValidas(t.destino_lat, t.destino_lng)
        ? t.destino_lat
        : null,
      lng: coordenadasValidas(t.destino_lat, t.destino_lng)
        ? t.destino_lng
        : null,
      referencia: t.destino_referencias ?? undefined,
    });
  }
  return [...ubicaciones.values()].sort(
    (a, b) =>
      Number(b.fuentes.includes("perfil")) -
        Number(a.fuentes.includes("perfil")) ||
      (b.ultimoUso ? Date.parse(b.ultimoUso) : 0) -
        (a.ultimoUso ? Date.parse(a.ultimoUso) : 0) ||
      a.direccion.localeCompare(b.direccion, "es"),
  );
}
export function aplicarLibreta(
  base: UbicacionUsuario[],
  libreta: LibretaUbicaciones,
): UbicacionUsuario[] {
  const entradas: UbicacionUsuario[] = libreta.entradas.map((e) => ({
    id: e.id,
    alias: e.alias,
    direccion: e.direccion,
    ciudad: e.ciudad,
    estado: e.estado,
    codigoPostal: e.codigoPostal,
    referencia: e.referencia,
    lat: e.lat,
    lng: e.lng,
    fuentes: [e.tipo],
    usos: 0,
    ultimoUso: null,
    guardada: true,
    version: e.version,
    creadoEn: e.creadoEn,
  }));
  return [...agruparDomicilio(base, libreta), ...entradas]
    .filter((u) => !libreta.ocultas.includes(u.id))
    .map((u) => {
      const partes = partesDireccion(u);
      return {
        ...u,
        alias: u.fuentes.includes("perfil") ? ETIQUETAS_UBICACION.perfil : formatearUbicacion(u.alias ?? ""),
        direccion: formatearUbicacion(partes.direccion),
        ciudad: formatearUbicacion(partes.ciudad),
        estado: partes.estado,
        favorita: libreta.favoritos[u.id] ?? u.favorita ?? false,
      };
    });
}
export function construirUbicaciones(
  usuario: Usuario,
  traslados: Traslado[],
): UbicacionUsuario[] {
  return aplicarLibreta(
    construirUbicacionesBase(usuario, traslados),
    leerLibreta(usuario.preferencias),
  );
}
export function direccionCompleta(u: UbicacionUsuario): string {
  const { direccion, ciudad, estado, postal } = partesDireccion(u);
  return [formatearUbicacion(direccion), postal, formatearUbicacion(ciudad), estado]
    .filter((parte, i, partes) => parte && partes.indexOf(parte) === i)
    .join(", ");
}
export function enlaceBuscarUbicacion(
  u: UbicacionUsuario,
  lado: "origen" | "destino",
): string {
  return (
    "/viajes/nuevo?" +
    new URLSearchParams({ ["buscar_" + lado]: direccionCompleta(u) }).toString()
  );
}
