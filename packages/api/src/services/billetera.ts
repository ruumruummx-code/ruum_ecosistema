import type { SupabaseClient } from "@supabase/supabase-js";

/** Solo servidor: requiere cliente service_role y authId verificado por Auth. */
export async function obtenerClienteBilleteraServidor(cliente: SupabaseClient, authId: string, modo: "test" | "live") {
  const { data, error } = await cliente.from("billetera_clientes_stripe")
    .select("stripe_customer_id").eq("auth_user_id", authId).eq("modo", modo).maybeSingle();
  if (error) throw error;
  return data?.stripe_customer_id as string | undefined;
}

export async function vincularClienteBilleteraServidor(cliente: SupabaseClient, authId: string, modo: "test" | "live", customerId: string) {
  const { error } = await cliente.from("billetera_clientes_stripe").upsert({
    auth_user_id: authId, modo, stripe_customer_id: customerId,
  }, { onConflict: "auth_user_id,modo", ignoreDuplicates: true });
  if (error) throw error;
  const guardado = await obtenerClienteBilleteraServidor(cliente, authId, modo);
  if (!guardado) throw new Error("No se confirmó la asociación de la billetera.");
  return guardado;
}
