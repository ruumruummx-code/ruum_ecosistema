import "server-only";
import { createClient } from "@supabase/supabase-js";

export function crearClienteServicio() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    throw new Error("El cliente de servicio de Supabase no está configurado.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
