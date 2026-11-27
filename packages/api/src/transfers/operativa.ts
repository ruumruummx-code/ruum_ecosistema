import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FotoEvidencia } from "@ruum/shared/types";
import { transicionValida } from "@ruum/shared/states";
import { evidenciaCompleta } from "@ruum/shared/rules";
import { clasificarTrasladoFallido } from "@ruum/shared/rules";
import { assertAdminAnyPermission, assertAdminPermission } from "../services/permisos-admin";
import { registrarEvento } from "../services/auditoria";
import { withIdempotentRetry } from "../operations/infrastructure/retry";

type Cliente = SupabaseClient<Database>;
type EvidenciaRow = Database["public"]["Tables"]["evidencia_fotos"]["Row"];
type TipoEvidencia = Database["public"]["Enums"]["tipo_evidencia"];
type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];
type TrasladoRow = Database["public"]["Tables"]["traslados"]["Row"];
type CausaFallido = Database["public"]["Enums"]["causa_fallido"];

function aFotoEvidencia(fila: EvidenciaRow): FotoEvidencia {
  return {
    id: fila.id,
    traslado_id: fila.traslado_id,
    tipo: fila.tipo,
    angulo: fila.angulo,
    ...(fila.url ? { url: fila.url } : {}),
    ...(fila.local_path ? { local_path: fila.local_path } : {}),
    timestamp: fila.capturada_en,
    ...(fila.lat !== null ? { lat: fila.lat } : {}),
    ...(fila.lng !== null ? { lng: fila.lng } : {}),
    sincronizada: fila.sincronizada
  };
}

async function validarEvidenciaCompletaParaAdmin(cliente: Cliente, trasladoId: string, tipo: TipoEvidencia) {
  const { data, error } = await cliente
    .from("evidencia_fotos")
    .select("*")
    .eq("traslado_id", trasladoId)
    .eq("tipo", tipo);

  if (error) throw error;

  const resultado = evidenciaCompleta((data ?? []).map(aFotoEvidencia), tipo);
  if (!resultado.completa) {
    throw new Error(`No se puede cambiar a evidencia_${tipo}_completada: faltan ${resultado.angulosFaltantes.join(", ")}.`);
  }
}

/*
 * Los roles operativos de Torre (operador, supervisor) gestionan traslados pero
 * no tienen `pagos:leer`, así que la RLS de `pagos` les devuelve 0 filas. Leer
 * `pagos` desde el navegador hacía que todo traslado pagado pareciera "sin pago"
 * y Torre no podía publicarlo a conductores. El pago se valida con la RPC
 * SECURITY DEFINER `traslado_tiene_metodo_pago_registrado` y, para
 * `pago_completado`, en `admin_cambiar_estado_traslado` (PAGO_INEXISTENTE);
 * el trigger `exigir_pago_anticipado_antes_de_operar` sigue siendo la garantía final.
 */
async function validarPagoAnticipadoParaOperar(cliente: Cliente, trasladoId: string, nuevoEstado: EstadoTraslado) {
  if (nuevoEstado !== "servicio_confirmado" && nuevoEstado !== "pendiente_de_conductor") return;
  const { data: traslado, error } = await cliente
    .from("traslados")
    .select("tipo_pago")
    .eq("id", trasladoId)
    .maybeSingle();

  if (error) throw error;
  if (!traslado || traslado.tipo_pago !== "anticipado") return;

  const { data: pagado, error: errorPago } = await cliente.rpc("traslado_tiene_metodo_pago_registrado", {
    p_traslado_id: trasladoId
  });

  if (errorPago) throw errorPago;

  if (!pagado) {
    throw new Error(
      `No se puede avanzar a ${nuevoEstado}: el traslado anticipado no tiene un pago electrónico completado (Stripe).`
    );
  }
}

async function validarPrerequisitosEstatusAdmin(cliente: Cliente, trasladoId: string, nuevoEstado: EstadoTraslado) {
  if (nuevoEstado === "evidencia_inicial_completada") {
    await validarEvidenciaCompletaParaAdmin(cliente, trasladoId, "inicial");
  }
  if (nuevoEstado === "evidencia_final_completada") {
    await validarEvidenciaCompletaParaAdmin(cliente, trasladoId, "final");
  }
  await validarPagoAnticipadoParaOperar(cliente, trasladoId, nuevoEstado);
}

function mensajeErrorCambioEstatus(error: unknown): unknown {
  const mensaje = (error as { message?: string } | null)?.message ?? "";
  if (mensaje.includes("PAGO_INEXISTENTE")) {
    return new Error("No se puede cambiar a pago_completado: no existe un pago con estado completado para este viaje.");
  }
  if (mensaje.includes("PAGO_ANTICIPADO_REQUERIDO")) {
    return new Error("No se puede avanzar: el traslado anticipado no tiene un pago electrónico completado (Stripe).");
  }
  return error;
}

export async function asignarConductorAdmin(
  cliente: Cliente,
  trasladoId: string,
  conductorId: string,
  estadoActual: EstadoTraslado
) {
  if (estadoActual !== "pendiente_de_conductor" && estadoActual !== "conductor_asignado") {
    throw new Error("La asignación manual solo está disponible cuando el traslado espera conductor o requiere reasignación antes de iniciar.");
  }
  await assertAdminPermission(cliente, "Traslados:gestionar");
  const { error } = await cliente.rpc("admin_asigna_conductor", {
    p_traslado_id: trasladoId,
    p_conductor_id: conductorId
  });
  if (error) throw mensajeErrorAsignacion(error);
}

const MOTIVOS_NO_ELEGIBLE: Record<string, string> = {
  conductor_no_encontrado: "no se encontró el conductor",
  estado_conductor_no_operativo: "el conductor no está activo",
  expediente_no_aprobado: "su expediente aún no está aprobado",
  documentos_no_vigentes: "sus documentos no están vigentes",
  suspension_activa: "tiene una suspensión activa",
  nivel_concer_insuficiente: "su nivel CONCER no alcanza el requerido por este vehículo",
  conductor_con_traslado_activo: "ya tiene otro traslado en curso",
  conductor_no_disponible: "no está disponible",
  preferencia_no_foraneos: "no acepta traslados foráneos",
  preferencia_no_locales: "no acepta traslados locales",
  preferencia_no_nocturnos: "no acepta traslados nocturnos",
  traslado_no_disponible: "el traslado ya no espera conductor",
  traslado_no_encontrado: "no se encontró el traslado"
};

/**
 * Convierte el error crudo de `admin_asigna_conductor` en un mensaje legible para
 * Torre. PostgREST devuelve un objeto (no `Error`), así que sin esta traducción la
 * pantalla solo mostraba "No pudimos asignar el conductor." sin decir por qué.
 */
export function mensajeErrorAsignacion(error: unknown): Error {
  const mensaje = typeof error === "string"
    ? error
    : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message ?? "")
      : "";
  const noElegible = /Conductor no elegible:\s*(.*)$/i.exec(mensaje);
  if (noElegible) {
    const motivos = noElegible[1].split(",").map(m => m.trim()).filter(Boolean)
      .map(m => MOTIVOS_NO_ELEGIBLE[m] ?? m.replace(/_/g, " "));
    return new Error(motivos.length
      ? `No se puede asignar este conductor: ${motivos.join("; ")}.`
      : "No se puede asignar este conductor: no cumple los requisitos de elegibilidad.");
  }
  if (mensaje) return new Error(mensaje);
  return new Error("No pudimos asignar el conductor.");
}

/**
 * PRD §17.4 — "cambiar estatus". Valida contra TRANSICIONES (mismo mapa que
 * el trigger de Postgres en 0005) antes de intentarlo, para dar un mensaje
 * claro en vez de depender solo del error crudo de la base. También valida
 * los prerequisitos de contenido real (evidencia completa, pago completado,
 * pago anticipado antes de operar) antes de aplicar el cambio — cierra el
 * hueco donde este selector genérico podía marcar evidencia_*_completada o
 * pago_completado sin que existiera evidencia o pago real detrás (mismo
 * criterio que ya aplicaban evidencia.ts::confirmarEvidenciaCompleta y el
 * webhook de Stripe), y donde Torre podía confirmar o poner en operación
 * un traslado anticipado sin pago electrónico completado.
 */
export const ESTADOS_CRITICOS_TRASLADO: readonly EstadoTraslado[] = ["pago_completado"];

export async function cambiarEstatusAdmin(
  cliente: Cliente,
  trasladoId: string,
  estadoActual: EstadoTraslado,
  nuevoEstado: EstadoTraslado,
  aprobacionId?: string,
  versionEsperada?: number
) {
  await assertAdminPermission(cliente, "Traslados:gestionar");

  if (!transicionValida(estadoActual, nuevoEstado)) {
    throw new Error(`Transición no permitida: ${estadoActual} -> ${nuevoEstado}`);
  }

  await validarPrerequisitosEstatusAdmin(cliente, trasladoId, nuevoEstado);

  return withIdempotentRetry(async () => {
    const rpc = cliente.rpc.bind(cliente) as unknown as (
      fn: "admin_cambiar_estado_traslado",
      args: { p_traslado_id: string; p_nuevo_estado: string; p_version_esperada?: number; p_aprobacion_id?: string }
    ) => Promise<{ data: { ejecutado?: boolean; version?: number } | null; error: unknown }>;
    const { data, error } = await rpc("admin_cambiar_estado_traslado", {
      p_traslado_id: trasladoId,
      p_nuevo_estado: nuevoEstado,
      p_version_esperada: versionEsperada,
      p_aprobacion_id: aprobacionId
    });
    if (error) throw mensajeErrorCambioEstatus(error);
    if (!data?.ejecutado) throw new Error("No se pudo cambiar el estado del traslado.");
  });
}

export async function marcarTrasladoFallido(cliente: Cliente, trasladoId: string, causa: CausaFallido) {
  await assertAdminPermission(cliente, "Traslados:gestionar");
  const resultado = clasificarTrasladoFallido(causa);

  const { error } = await cliente.rpc("admin_marca_traslado_fallido", {
    p_traslado_id: trasladoId,
    p_causa: causa,
    p_cargo_aplica_cliente: resultado.cargo_aplica_cliente,
    p_requiere_reagendamiento: resultado.requiere_reagendamiento,
    p_porcentaje_descuento_segundo_intento: (resultado.porcentaje_descuento_segundo_intento ?? null) as never,
    p_mensaje: resultado.mensaje
  });

  if (error) throw error;

  return resultado;
}
