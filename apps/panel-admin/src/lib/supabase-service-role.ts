import "server-only";
import { crearClienteServiceRole as crearClienteServiceRoleApi } from "@ruum/api/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

export function crearClienteServiceRole(): SupabaseClient<Database> {
  return crearClienteServiceRoleApi();
}

