import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Traslado = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type FuenteUbicacion = "perfil" | "origen" | "destino";
export interface UbicacionUsuario {
  id: string;
  direccion: string;
  ciudad: string;
  fuentes: FuenteUbicacion[];
  usos: number;
  ultimoUso: string | null;
}

export function normalizarBusqueda(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Son direcciones registradas, no una colección de favoritos ni puntos GPS. */
export function construirUbicaciones(usuario: Usuario, traslados: Traslado[]): UbicacionUsuario[] {
  const ubicaciones = new Map<string, UbicacionUsuario>();
  const agregar = (direccion: string | null | undefined, ciudad: string | null | undefined, fuente: FuenteUbicacion, fecha?: string | null) => {
    if (!direccion?.trim()) return;
    const clave = normalizarBusqueda(direccion + " " + (ciudad ?? ""));
    const fechaValida = fecha && Number.isFinite(Date.parse(fecha)) ? fecha : null;
    const existente = ubicaciones.get(clave);
    if (existente) {
      if (!existente.fuentes.includes(fuente)) existente.fuentes.push(fuente);
      if (fuente !== "perfil") existente.usos++;
      if (fechaValida && (!existente.ultimoUso || Date.parse(fechaValida) > Date.parse(existente.ultimoUso))) existente.ultimoUso = fechaValida;
      return;
    }
    ubicaciones.set(clave, { id: clave, direccion: direccion.trim(), ciudad: ciudad?.trim() ?? "", fuentes: [fuente], usos: fuente === "perfil" ? 0 : 1, ultimoUso: fechaValida });
  };
  const domicilioPerfil = [
    [usuario.calle, usuario.numero].filter(v => v?.trim()).join(" "),
    usuario.colonia,
    usuario.codigo_postal,
  ].filter(v => v?.trim()).join(", ");
  // Un CP o colonia sin calle no es una dirección utilizable.
  agregar(usuario.calle?.trim() ? domicilioPerfil : usuario.direccion_principal, usuario.ciudad, "perfil");
  for (const traslado of traslados) {
    agregar(traslado.origen_direccion, traslado.origen_ciudad, "origen", traslado.creado_en);
    agregar(traslado.destino_direccion, traslado.destino_ciudad, "destino", traslado.creado_en);
  }
  return [...ubicaciones.values()].sort((a, b) => Number(b.fuentes.includes("perfil")) - Number(a.fuentes.includes("perfil")) || (b.ultimoUso ? Date.parse(b.ultimoUso) : 0) - (a.ultimoUso ? Date.parse(a.ultimoUso) : 0) || a.direccion.localeCompare(b.direccion, "es"));
}

export function enlaceBuscarUbicacion(ubicacion: UbicacionUsuario, lado: "origen" | "destino"): string {
  const consulta = new URLSearchParams({ ["buscar_" + lado]: [ubicacion.direccion, ubicacion.ciudad].filter(Boolean).join(", ") });
  return "/viajes/nuevo?" + consulta.toString();
}
