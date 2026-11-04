import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY");

const cliente = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data, error } = await cliente.rpc("reconciliar_registro_saga_auth", { p_limite: 50 });
if (error) {
  console.error(JSON.stringify({ event: "registro_saga_reconciliacion_fallida", message: error.message }));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ event: "registro_saga_reconciliacion", ...data, frecuencia: "cada_5_minutos" }));
}
