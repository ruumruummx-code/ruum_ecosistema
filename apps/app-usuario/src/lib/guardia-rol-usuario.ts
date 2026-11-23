import { NextResponse } from "next/server";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { clasificarRolApp } from "@ruum/api/identity";
import { crearClienteServidor } from "./supabase-server";

export type ValidacionRolUsuario =
  | { ok: true; user: User; cliente: SupabaseClient<Database>; errorResponse: null }
  | { ok: false; user: null; cliente: SupabaseClient<Database> | null; errorResponse: NextResponse };

/**
 * Helper único de autenticación y autorización RBAC para Route Handlers de app-usuario.
 *
 * 1. Obtiene la sesión activa (`getUser`). Si no hay sesión o falla -> 401 JSON.
 * 2. Consulta el rol en el ecosistema (`clasificarRolApp`).
 * 3. Si el rol no es "usuario" (es "conductor", "admin" o "ninguno") -> 403 JSON fail-closed.
 * 4. Retorna el usuario y cliente autenticados listos para su consumo en el Route Handler.
 */
export async function validarSesionYRolUsuario(
  clienteExistente?: SupabaseClient<Database>
): Promise<ValidacionRolUsuario> {
  const cliente = clienteExistente ?? (await crearClienteServidor());
  const {
    data: { user },
    error
  } = await cliente.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      user: null,
      cliente,
      errorResponse: NextResponse.json(
        { error: "Inicia sesión para acceder a este recurso." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      )
    };
  }

  const rol = await clasificarRolApp(cliente, user.id);
  if (rol !== "usuario") {
    return {
      ok: false,
      user: null,
      cliente,
      errorResponse: NextResponse.json(
        { error: "Acceso denegado: cuenta no autorizada para operar en la app de pasajeros." },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      )
    };
  }

  return { ok: true, user, cliente, errorResponse: null };
}

/**
 * Guardia complementaria para cuando el `User` ya fue recuperado y solo se requiere
 * verificar su pertenencia al rol "usuario". Retorna `NextResponse` con 403 o `null` si está autorizado.
 */
export async function exigirRolUsuario(
  cliente: SupabaseClient<Database>,
  userId: string
): Promise<NextResponse | null> {
  const rol = await clasificarRolApp(cliente, userId);
  if (rol !== "usuario") {
    return NextResponse.json(
      { error: "Acceso denegado: cuenta no autorizada para operar en la app de pasajeros." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }
  return null;
}
