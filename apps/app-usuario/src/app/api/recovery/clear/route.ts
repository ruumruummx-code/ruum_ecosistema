import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_RECOVERY_USUARIO, COOKIE_RECOVERY_LEGACY, RUTA_COOKIE_RECOVERY } from "@ruum/shared/utils";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { verificarCsrfORechazar } from "@/lib/csrf";
import {
  hashIdentificador,
  RECOVERY_CLEAR_LIMITES,
  RECOVERY_VENTANA_MS,
} from "@/lib/recovery-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
 * Sin cabeceras (curl/app nativa) pasa; el rate limit sigue aplicando.
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
 * RUUM-USR-F4-001 (CB-1) & PR-02 P0 — Invalida el contexto temporal de recovery después de updateUser exitoso.
 * Debe llamarse tras `supabase.auth.updateUser({ password })`.
 * Borra las cookies httpOnly de recovery para que no sea reutilizable.
 *
 * Aplica clave compuesta (IP + cuenta/marcador + dispositivo) con umbrales diferenciados.
 */
export async function POST(request: NextRequest) {
  if (!esMismoOrigen(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const rechazoCsrf = verificarCsrfORechazar(request);
  if (rechazoCsrf) return rechazoCsrf;

  const cookieStore = await cookies();
  const marcador = cookieStore.get(COOKIE_RECOVERY_USUARIO)?.value ?? null;
  const ip = obtenerIp(request);
  const dispositivo = request.headers.get("x-device-id")?.trim().slice(0, 128) || null;

  // Rate Limit Compuesto (CB-1): IP + Cuenta + Dispositivo
  const dimensiones = await Promise.all([
    rateLimitConVentana(ip, "recovery-clear-ip", RECOVERY_CLEAR_LIMITES.ip, RECOVERY_VENTANA_MS),
    rateLimitConVentana(
      marcador ? hashIdentificador(marcador) : null,
      "recovery-clear-account",
      RECOVERY_CLEAR_LIMITES.cuenta,
      RECOVERY_VENTANA_MS
    ),
    rateLimitConVentana(
      dispositivo ? hashIdentificador(dispositivo) : null,
      "recovery-clear-device",
      RECOVERY_CLEAR_LIMITES.dispositivo,
      RECOVERY_VENTANA_MS
    ),
  ]);

  const retryAfter = Math.max(
    dimensiones[0].retryAfterSec ?? 0,
    dimensiones[1].retryAfterSec ?? 0,
    dimensiones[2].retryAfterSec ?? 0
  );

  if (dimensiones.some((d) => !d.allowed)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(retryAfter || 60), "Cache-Control": "no-store" } }
    );
  }

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
