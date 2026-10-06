import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_RECOVERY_USUARIO } from "@ruum/shared/utils";
import { crearClienteServidor } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * PR-02 P0 — Verifica autorización de recuperación.
 * Retorna { authorized: true } solo si:
 *  - existe cookie httpOnly ruum_rec_usuario (seteada por /auth/callback tras PKCE recovery)
 *  - existe sesión válida (supabase.auth.getUser)
 *  - la cookie contiene el userId (UUID) y debe coincidir con el user actual
 *
 * Así la autorización sobrevive al callback server-side sin depender de PASSWORD_RECOVERY,
 * y no permite a cualquier usuario autenticado cambiar password sin haber pasado por el enlace.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const marcador = cookieStore.get(COOKIE_RECOVERY_USUARIO)?.value ?? null;

    /* CORRECCIÓN: se elimina la lectura de la cookie legacy "ruum_recovery" y
       cualquier autorización basada en sesión sin cookie válida. Antes un
       marcador "1" (fallback antiguo) autorizaba a cualquier usuario con
       sesión activa a cambiar su contraseña sin pasar por el enlace. */

    if (!marcador) {
      return NextResponse.json({ authorized: false, reason: "no_cookie" }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    let cliente: Awaited<ReturnType<typeof crearClienteServidor>>;
    try {
      cliente = await crearClienteServidor();
    } catch {
      return NextResponse.json({ authorized: false, reason: "no_supabase" }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    const { data, error } = await cliente.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ authorized: false, reason: "no_session" }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    // El marcador debe ser el userId (UUID) y coincidir con el usuario actual.
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(marcador);
    if (!esUuid || marcador !== data.user.id) {
      return NextResponse.json({ authorized: false, reason: "user_mismatch" }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ authorized: true, userId: data.user.id }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ authorized: false, reason: "error", error: String(e).slice(0, 200) }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
