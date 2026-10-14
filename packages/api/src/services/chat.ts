import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { suscribirCanalSeguro, type OpcionesSuscripcionSegura } from "@ruum/shared/utils";

type Cliente = SupabaseClient<Database>;
type MensajeRow = Database["public"]["Tables"]["mensajes_chat"]["Row"];

/** PRD §4.12 — historial del chat de un traslado, más antiguo primero. */
export async function obtenerMensajes(cliente: Cliente, trasladoId: string): Promise<MensajeRow[]> {
  const { data, error } = await cliente
    .from("mensajes_chat")
    .select("*")
    .eq("traslado_id", trasladoId)
    .order("enviado_en", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Auditoría H-3 / migración 0046 — el remitente NO se acepta del cliente: la
 * RPC security definer `enviar_mensaje_chat` lo deriva de auth.uid() contra el
 * traslado, así un participante no puede insertar mensajes en nombre del otro.
 * El INSERT directo sobre mensajes_chat ya no está permitido por RLS.
 *
 * D-1: rate limit en memoria por traslado (ventana deslizante) para frenar
 * spam/rafagas accidentales antes de llegar a la RPC.
 */
const LIMITE_VENTANA_MS = 30_000;
const LIMITE_MAX_MENSAJES = 5;
const LIMITE_INTERVALO_MIN_MS = 1_000;
const LIMITE_MAX_CARACTERES = 1000;
const enviosPorTraslado = new Map<string, number[]>();

export function validarRateLimitChat(trasladoId: string, ahora = Date.now()): void {
  const previos = (enviosPorTraslado.get(trasladoId) ?? []).filter((t) => ahora - t < LIMITE_VENTANA_MS);
  if (previos.length > 0 && ahora - previos[previos.length - 1]! < LIMITE_INTERVALO_MIN_MS) {
    throw new Error("Envía un mensaje a la vez. Espera un segundo antes del siguiente.");
  }
  if (previos.length >= LIMITE_MAX_MENSAJES) {
    throw new Error("Estás enviando mensajes muy rápido. Espera unos segundos e inténtalo de nuevo.");
  }
  previos.push(ahora);
  enviosPorTraslado.set(trasladoId, previos);
}

export function _limpiarRateLimitChat(trasladoId?: string): void {
  if (trasladoId) enviosPorTraslado.delete(trasladoId);
  else enviosPorTraslado.clear();
}

export async function enviarMensaje(cliente: Cliente, trasladoId: string, contenido: string) {
  const texto = contenido.trim();
  if (!texto) throw new Error("El mensaje está vacío.");
  if (texto.length > LIMITE_MAX_CARACTERES) {
    throw new Error(`El mensaje supera el máximo de ${LIMITE_MAX_CARACTERES} caracteres.`);
  }
  validarRateLimitChat(trasladoId);
  const { error } = await cliente.rpc("enviar_mensaje_chat", {
    p_traslado_id: trasladoId,
    p_contenido: texto
  });
  if (error) throw error;
}

/**
 * PRD §4.12 — el chat debe sentirse en vivo, no como un formulario que hay
 * que recargar. Usa Supabase Realtime (Postgres Changes) en vez de polling.
 * Devuelve el canal para que quien llame lo desuscriba en su cleanup de
 * useEffect y acepta opciones de suscripción segura para evitar leaks.
 */
export function suscribirseAMensajes(
  cliente: Cliente,
  trasladoId: string,
  alRecibir: (mensaje: MensajeRow) => void,
  opciones?: OpcionesSuscripcionSegura
): RealtimeChannel {
  const canal = cliente
    .channel(`mensajes_chat:${trasladoId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mensajes_chat", filter: `traslado_id=eq.${trasladoId}` },
      (payload) => alRecibir(payload.new as MensajeRow)
    );

  suscribirCanalSeguro(cliente, canal, opciones);
  return canal;
}

/**
 * PRD §4.12 — invoca la Edge Function que crea/reutiliza la sesión de
 * Twilio Proxy y devuelve el número virtual real al que hay que llamar.
 * El llamado real lo hace el navegador/dispositivo (enlace `tel:`), esto
 * solo obtiene el número — no hay softphone embebido en la app.
 */
export async function crearLlamadaEnmascarada(cliente: Cliente, trasladoId: string): Promise<string> {
  const { data, error } = await cliente.functions.invoke("crear-llamada-enmascarada", {
    body: { traslado_id: trasladoId }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.numeroProxy as string;
}