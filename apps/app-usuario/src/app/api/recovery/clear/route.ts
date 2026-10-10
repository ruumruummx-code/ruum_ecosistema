import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_RECOVERY_USUARIO, COOKIE_RECOVERY_LEGACY, RUTA_COOKIE_RECOVERY } from "@ruum/shared/utils";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POR_HORA = 20;
const VENTANA_MS = 60 * 60 * 1000;

function opcionesExpiracion() {
  // Debe coincidir con las opciones del callback (S-6) o la cookie no se borra.
  const secure = process.env.NODE_ENV !== "development";
  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    maxAge: 0,
    path: RUTA_COOKIE_RECOVERY,
  };
}

/**
 * M7: el llamante legítimo es fetch same-origin desde /nueva-password.
 * Si el request trae Origin/Referer de otro origen se rechaza (CSRF): un
 * formulario cross-site no puede forzar el borrado del contexto de recovery.
 * Sin cabeceras (curl/app nativa) pasa; el rate limit por IP sigue aplicando.
 */
function esMismoOrigen(request: NextRequest): boolean {
  const esperado = request.nextUrl.origin;
  const origen = request.headers.get("origin");
  if (origen) return origen === esperado;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === esperado;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * PR-02 P0 — Invalida el contexto temporal de recovery después de updateUser exitoso.
 * Debe llamarse tras `supabase.auth.updateUser({ password })`.
 * Borra las cookies httpOnly de recovery para que no sea reutilizable.
 *
 * M7: antes era escritura pública sin auth, rate limit ni CSRF. Ahora exige
 * mismo origen y aplica rate limit por IP como el resto de auth.
 */
export async function POST(request: NextRequest) {
  if (!esMismoOrigen(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const limite = await rateLimitConVentana(obtenerIp(request), "recovery-clear-ip", MAX_POR_HORA, VENTANA_MS);
  if (!limite.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSec ?? 3600), "Cache-Control": "no-store" } }
    );
  }

  const cookieStore = await cookies();
  const opts = opcionesExpiracion();
  try {
    cookieStore.set(COOKIE_RECOVERY_USUARIO, "", opts);
    cookieStore.set(COOKIE_RECOVERY_LEGACY, "", opts);
    cookieStore.set("ruum_recovery", "", opts);
    // También probar delete
    try { cookieStore.delete(COOKIE_RECOVERY_USUARIO); } catch {}
    try { cookieStore.delete(COOKIE_RECOVERY_LEGACY); } catch {}
    try { cookieStore.delete("ruum_recovery"); } catch {}
  } catch {}
  return NextResponse.json({ cleared: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: NextRequest) {
  return POST(request);
}
