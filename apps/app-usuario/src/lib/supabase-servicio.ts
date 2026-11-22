import "server-only";
import { crearClienteServiceRole } from "@ruum/api/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

export function crearClienteServicio(): SupabaseClient<Database> {
  return crearClienteServiceRole();
}

