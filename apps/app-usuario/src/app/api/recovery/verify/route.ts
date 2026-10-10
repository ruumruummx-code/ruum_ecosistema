import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_RECOVERY_USUARIO } from "@ruum/shared/utils";
import { crearClienteServidor } from "@/lib/supabase-server";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// M8: como el resto de endpoints de auth. La página lo llama una vez por
// carga; 30/hora por IP deja margen a reintentos sin abrir abuso.
const MAX_POR_HORA = 30;
const VENTANA_MS = 60 * 60 * 1000;

/**
 * PR-02 P0 — Verifica autorización de recuperación.
 * Retorna { authorized: true } solo si:
 *  - existe cookie httpOnly ruum_rec_usuario (seteada por /auth/callback tras PKCE recovery)
 *  - existe sesión válida (supabase.auth.getUser)
 *  - la cookie contiene el userId (UUID) y debe coincidir con el user actual
 *
 * Así la autorización sobrevive al callback server-side sin depender de PASSWORD_RECOVERY,
 * y no permite a cualquier usuario autenticado cambiar password sin haber pasado por el enlace.
 *
 * A5: respuesta mínima { authorized } sin `reason` ni `error`. El detalle del
 * fallo iba al cliente (oráculo de estado de sesión + mensajes internos de
 * Supabase vía String(e)); ahora solo va al log del servidor.
 */
export async function GET(request: NextRequest) {
  const sinCache = { "Cache-Control": "no-store" };

  // M8: este endpoint decide si se puede cambiar la contraseña; sin límite un
  // script podía sondearlo sin restricción de aplicación.
  const limite = await rateLimitConVentana(obtenerIp(request), "recovery-verify-ip", MAX_POR_HORA, VENTANA_MS);
  if (!limite.allowed) {
    return NextResponse.json(
      { authorized: false },
      { status: 429, headers: { ...sinCache, "Retry-After": String(limite.retryAfterSec ?? 3600) } }
    );
  }

  try {
    const cookieStore = await cookies();
    const marcador = cookieStore.get(COOKIE_RECOVERY_USUARIO)?.value ?? null;

    /* CORRECCIÓN: se elimina la lectura de la cookie legacy "ruum_recovery" y
       cualquier autorización basada en sesión sin cookie válida. Antes un
       marcador "1" (fallback antiguo) autorizaba a cualquier usuario con
       sesión activa a cambiar su contraseña sin pasar por el enlace. */

    if (!marcador) {
      return NextResponse.json({ authorized: false }, { status: 200, headers: sinCache });
    }

    let cliente: Awaited<ReturnType<typeof crearClienteServidor>>;
    try {
      cliente = await crearClienteServidor();
    } catch (e) {
      console.warn("[recovery/verify] sin cliente supabase", e);
      return NextResponse.json({ authorized: false }, { status: 200, headers: sinCache });
    }

    const { data, error } = await cliente.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ authorized: false }, { status: 200, headers: sinCache });
    }

    // El marcador debe ser el userId (UUID) y coincidir con el usuario actual.
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(marcador);
    if (!esUuid || marcador !== data.user.id) {
      console.warn("[recovery/verify] marcador no coincide con la sesion");
      return NextResponse.json({ authorized: false }, { status: 200, headers: sinCache });
    }

    return NextResponse.json({ authorized: true }, { status: 200, headers: sinCache });
  } catch (e) {
    console.warn("[recovery/verify] error inesperado", e);
    return NextResponse.json({ authorized: false }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
