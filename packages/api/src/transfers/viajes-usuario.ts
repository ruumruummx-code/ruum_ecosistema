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
