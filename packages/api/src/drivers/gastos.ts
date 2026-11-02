import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { esquemaUuid } from "../services/_rpc-validado";

// FASE 6 (cierre) — Gastos del traslado (conductor): listar, registrar y
// eliminar. La subida del comprobante a Storage sigue en la app (Storage
// API, no PostgREST); la fila vive aquí.

type Cliente = SupabaseClient<Database>;
type GastoRow = Database["public"]["Tables"]["gastos_traslado"]["Row"];

export type GastoTraslado = GastoRow;

const esquemaRegistrar = z.object({
  p_id: esquemaUuid.optional(),
  p_traslado_id: esquemaUuid,
  p_tipo: z.string().trim().min(1, "Tipo requerido").max(60),
  p_monto: z.number().positive("El monto debe ser mayor a cero").max(10000000),
  p_descripcion: z.string().max(500).nullable().optional(),
  p_comprobante_ruta: z.string().max(500).nullable().optional()
});

export async function listarGastosTraslado(cliente: Cliente, trasladoId: string): Promise<GastoRow[]> {
  const { data, error } = await cliente
    .from("gastos_traslado")
    .select("*")
    .eq("traslado_id", trasladoId)
    .order("registrado_en", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GastoRow[];
}

export async function registrarGastoTraslado(
  cliente: Cliente,
  params: {
    id?: string;
    trasladoId: string;
    tipo: string;
    monto: number;
    descripcion?: string | null;
    comprobanteRuta?: string | null;
  }
): Promise<GastoRow> {
  const validado = esquemaRegistrar.parse({
    p_id: params.id,
    p_traslado_id: params.trasladoId,
    p_tipo: params.tipo,
    p_monto: params.monto,
    p_descripcion: params.descripcion ?? null,
    p_comprobante_ruta: params.comprobanteRuta ?? null
  });

  // Idempotencia: si ya existe una fila con este ID (por reintento o respuesta perdida), devolverla
  if (validado.p_id) {
    const { data: existente } = await cliente
      .from("gastos_traslado")
      .select("*")
      .eq("id", validado.p_id)
      .maybeSingle();

    if (existente) {
      return existente as GastoRow;
    }
  }

  const { data, error } = await cliente
    .from("gastos_traslado")
    .insert({
      ...(validado.p_id ? { id: validado.p_id } : {}),
      traslado_id: validado.p_traslado_id,
      tipo: validado.p_tipo,
      monto: validado.p_monto,
      descripcion: validado.p_descripcion,
      comprobante_ruta: validado.p_comprobante_ruta
    })
    .select()
    .single();

  if (error) {
    // Si ocurrió conflicto de unicidad por reintento tras commit, recuperar la fila
    if (validado.p_id && error.code === "23505") {
      const { data: existente } = await cliente
        .from("gastos_traslado")
        .select("*")
        .eq("id", validado.p_id)
        .maybeSingle();
      if (existente) return existente as GastoRow;
    }
    throw error;
  }
  if (!data) throw new Error("No se pudo registrar el gasto.");
  return data as GastoRow;
}

export async function eliminarGastoTraslado(cliente: Cliente, gastoId: string): Promise<void> {
  esquemaUuid.parse(gastoId);
  const { error } = await cliente.from("gastos_traslado").delete().eq("id", gastoId);
  if (error) throw error;
}
