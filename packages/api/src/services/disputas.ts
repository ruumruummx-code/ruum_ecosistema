import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { puedeAbrirseDisputa } from "@ruum/shared/rules";

type Cliente = SupabaseClient<Database>;
type TipoDisputa = Database["public"]["Enums"]["tipo_disputa"];
type AbiertaPor = Database["public"]["Enums"]["abierta_por_actor"];

async function actorActual(cliente: Cliente): Promise<{ rol: AbiertaPor; id: string }> {
  const { data: sesion } = await cliente.auth.getUser();
  if (!sesion.user) throw new Error("No hay sesión para solicitar revisión de un traslado.");

  const [usuario, conductor] = await Promise.all([
    cliente.from("usuarios").select("id").eq("auth_user_id", sesion.user.id).maybeSingle(),
    cliente.from("conductores").select("id").eq("auth_user_id", sesion.user.id).maybeSingle()
  ]);

  if (usuario.error) throw usuario.error;
  if (conductor.error) throw conductor.error;
  if (usuario.data) return { rol: "usuario", id: usuario.data.id };
  if (conductor.data) return { rol: "conductor", id: conductor.data.id };
  throw new Error("La sesión actual no corresponde a un usuario o conductor.");
}

export async function abrirDisputa(
  cliente: Cliente,
  trasladoId: string,
  tipo: TipoDisputa,
  descripcion: string,
  opciones?: { mantenerEstado?: boolean }
) {
  const descripcionLimpia = descripcion.trim();
  if (descripcionLimpia.length < 20) {
    throw new Error("Describe la revisión con al menos 20 caracteres.");
  }

  // CB-3 / T9 / CA-7: Ownership repetido en cada mutación
  const { data: traslado, error: errorTraslado } = await cliente
    .from("traslados")
    .select("id, usuario_id, conductor_id, cerrado_en, actualizado_en")
    .eq("id", trasladoId)
    .maybeSingle();

  if (errorTraslado) throw errorTraslado;
  if (!traslado) throw new Error("No se encontró el traslado para solicitar revisión.");

  const actor = await actorActual(cliente);
  if (actor.rol === "usuario" && traslado.usuario_id && traslado.usuario_id !== actor.id) {
    throw new Error("No autorizado para abrir una disputa sobre este traslado: solo el titular puede disputar.");
  }
  if (actor.rol === "conductor" && traslado.conductor_id && traslado.conductor_id !== actor.id) {
    throw new Error("No autorizado para abrir una disputa sobre este traslado: solo el conductor asignado puede disputar.");
  }

  const fechaRef = traslado.cerrado_en ?? traslado.actualizado_en;
  const horasDesdeCierre = (Date.now() - new Date(fechaRef).getTime()) / (1000 * 60 * 60);
  if (!puedeAbrirseDisputa(horasDesdeCierre)) {
    throw new Error("El plazo de 72 horas para solicitar revisión ya venció.");
  }

  const { data, error } = await cliente.rpc("abrir_disputa_traslado", {
    p_traslado_id: trasladoId,
    p_abierta_por: actor.rol,
    p_tipo: tipo,
    p_descripcion: descripcionLimpia,
    p_mantener_estado: opciones?.mantenerEstado ?? false
  });

  if (error) throw error;
  return data;
}
