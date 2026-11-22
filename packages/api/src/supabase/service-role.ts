import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

export interface OpcionesClienteServiceRole {
  url?: string;
  serviceRoleKey?: string;
  anonKey?: string;
}

/**
 * Factory único de cliente Supabase con privilegios elevados (service_role).
 *
 * Exige:
 * 1. Import "server-only" para evitar fugas en bundles cliente.
 * 2. Tipado estricto contra el esquema `Database`.
 * 3. Guarda fail-closed: verifica presencia de URL y service_role, y asegura
 *    que service_role sea distinta de la anon_key pública (`serviceRoleKey !== anonKey`).
 */
export function crearClienteServiceRole(opciones?: OpcionesClienteServiceRole): SupabaseClient<Database> {
  const url = opciones?.url?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = opciones?.serviceRoleKey?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = opciones?.anonKey?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role no está configurado para operaciones privilegiadas.");
  }

  if (anonKey && serviceRoleKey === anonKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no puede ser idéntica a NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

/** Alias semántico para compatibilidad */
export const crearClienteServicio = crearClienteServiceRole;
