import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

type Cliente = SupabaseClient<Database>;

// Consultas de viajes con el cliente de sesión: conservan RLS y propagan data/error.
export async function consultarInventarioPasaportesUsuario(cliente: Cliente, usuarioId: string) {
  return cliente
    .from("pasaporte_digital")
    .select("traslado_id, estado, estado_operativo, cerrado_en, creado_en")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false });
}

export async function consultarPaginaPasaportesUsuario(
  cliente: Cliente,
  usuarioId: string,
  desplazamiento: number,
  limite: number
) {
  return cliente
    .from("pasaporte_digital")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false })
    .range(desplazamiento, desplazamiento + limite - 1);
}

export async function consultarTrasladosPaginaUsuario(cliente: Cliente, idsPagina: string[]) {
  return cliente
    .from("traslados")
    .select("id, origen_direccion, origen_ciudad, destino_direccion, destino_ciudad, fecha_hora_programada")
    .in("id", idsPagina);
}

export async function consultarMontosPagosCompletados(cliente: Cliente) {
  return cliente
    .from("pagos")
    .select("monto")
    .eq("estado", "completado");
}

export async function consultarTrasladoEstadoPago(cliente: Cliente, id: string) {
  return cliente
    .from("traslados")
    .select("id, usuario_id, estado, precio_final, precio_cotizado, tipo_pago")
    .eq("id", id)
    .maybeSingle();
}

export async function consultarPagoCompletadoTraslado(cliente: Cliente, id: string) {
  return cliente
    .from("pagos")
    .select("id, monto, registrado_en, estado")
    .eq("traslado_id", id)
    .eq("estado", "completado")
    .limit(1);
}

export async function consultarEstadoTrasladoReconciliado(cliente: Cliente, id: string) {
  return cliente
    .from("traslados")
    .select("estado")
    .eq("id", id)
    .maybeSingle();
}

export async function consultarPermisoTarifaTraslado(cliente: Cliente, usuarioId: string | null) {
  if (!usuarioId) return { data: false, error: null };
  return cliente.rpc(
    "puede_ver_tarifa_traslado",
    { p_usuario_id: usuarioId }
  );
}

export async function consultarCatalogoVehiculoTarifa(cliente: Cliente, marca: string, modelo: string) {
  return cliente.rpc("catalogar_vehiculo_para_tarifa", {
    p_marca: marca,
    p_modelo: modelo,
  });
}

/**
 * Filtro de pestaña de «Mis traslados» traducido a PostgREST. La app define
 * qué estados pertenecen a cada pestaña (estados-traslado-policy); aquí solo se
 * construye la consulta para que el filtrado ocurra en el servidor y no sobre
 * los 10 elementos de la página.
 */
export type FiltroCategoriaPasaporte =
  | { modo: "todos" }
  /** Finalizados: cerrado operativamente o en un estado final. */
  | { modo: "cerrados"; estados: readonly string[] }
  /** Programados / activos / cancelados: estado del grupo y sin cierre operativo. */
  | { modo: "abiertos"; estados: readonly string[] }
  /** En revisión: huérfanos, sin estado o con estado no reconocido. */
  | { modo: "revision"; estadosConocidos: readonly string[] };

export interface FiltrosPasaportesUsuario {
  categoria: FiltroCategoriaPasaporte;
  buscar?: string | null;
  vehiculoTipo?: string | null;
  /** Restringe a estos traslados (filtro de fecha resuelto antes). `[]` = ninguno. */
  trasladoIds?: readonly string[] | null;
}

const CAMPOS_BUSQUEDA = [
  "origen_ciudad", "origen_direccion", "destino_ciudad", "destino_direccion",
  "vehiculo_marca", "vehiculo_modelo", "vehiculo_placas", "conductor_nombre",
] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Quita los caracteres con significado en la sintaxis `or=(...)` de PostgREST. */
export function sanitizarBusquedaPostgrest(texto: string | null | undefined): string {
  return String(texto ?? "").replace(/[,()*%\:"'.]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

function lista(estados: readonly string[]) {
  return `(${estados.map((e) => e.replace(/[^a-z_]/g, "")).join(",")})`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- builder de PostgREST genérico (select con o sin head)
function aplicarFiltrosPasaportes<Q extends { or: (...a: any[]) => Q; in: (...a: any[]) => Q; is: (...a: any[]) => Q; not: (...a: any[]) => Q; eq: (...a: any[]) => Q }>(
  consulta: Q,
  filtros: FiltrosPasaportesUsuario
): Q {
  let q = consulta;
  const c = filtros.categoria;
  if (c.modo === "cerrados") {
    q = q.not("traslado_id", "is", null).or(`cerrado_en.not.is.null,estado_operativo.eq.closed,estado.in.${lista(c.estados)}`);
  } else if (c.modo === "abiertos") {
    q = q.not("traslado_id", "is", null).in("estado", [...c.estados]).is("cerrado_en", null)
      .or("estado_operativo.is.null,estado_operativo.neq.closed");
  } else if (c.modo === "revision") {
    q = q.or(
      `traslado_id.is.null,and(cerrado_en.is.null,or(estado_operativo.is.null,estado_operativo.neq.closed),or(estado.is.null,estado.not.in.${lista(c.estadosConocidos)}))`
    );
  }
  const buscar = sanitizarBusquedaPostgrest(filtros.buscar);
  if (UUID.test(buscar)) {
    q = q.eq("traslado_id", buscar);
  } else if (buscar) {
    q = q.or(CAMPOS_BUSQUEDA.map((campo) => `${campo}.ilike.*${buscar}*`).join(","));
  }
  if (filtros.vehiculoTipo) q = q.eq("vehiculo_tipo", filtros.vehiculoTipo);
  if (filtros.trasladoIds) {
    q = q.in("traslado_id", filtros.trasladoIds.length ? [...filtros.trasladoIds] : ["00000000-0000-0000-0000-000000000000"]);
  }
  return q;
}

/** Conteo exacto sin traer filas (no lo corta el límite de 1,000 de PostgREST). */
export async function contarPasaportesUsuario(cliente: Cliente, usuarioId: string, filtros: FiltrosPasaportesUsuario) {
  const consulta = cliente.from("pasaporte_digital").select("traslado_id", { count: "exact", head: true }).eq("usuario_id", usuarioId);
  return aplicarFiltrosPasaportes(consulta, filtros);
}

/** Página filtrada en servidor, con el total exacto de coincidencias. */
export async function consultarPaginaPasaportesFiltrada(
  cliente: Cliente,
  usuarioId: string,
  filtros: FiltrosPasaportesUsuario,
  desplazamiento: number,
  limite: number
) {
  const consulta = cliente.from("pasaporte_digital").select("*", { count: "exact" }).eq("usuario_id", usuarioId);
  return aplicarFiltrosPasaportes(consulta, filtros)
    .order("creado_en", { ascending: false })
    .range(desplazamiento, desplazamiento + limite - 1);
}

/** Versión del snapshot: el pasaporte más reciente del usuario. */
export async function consultarUltimoPasaporteUsuario(cliente: Cliente, usuarioId: string) {
  return cliente.from("pasaporte_digital").select("creado_en").eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false }).limit(1).maybeSingle();
}

/** Traslados del usuario (RLS) programados dentro de una ventana, para el filtro de fecha. */
export async function consultarTrasladosProgramadosEnRango(cliente: Cliente, desdeIso: string, hastaIso: string) {
  return cliente.from("traslados").select("id, fecha_hora_programada")
    .gte("fecha_hora_programada", desdeIso).lte("fecha_hora_programada", hastaIso).limit(1000);
}
