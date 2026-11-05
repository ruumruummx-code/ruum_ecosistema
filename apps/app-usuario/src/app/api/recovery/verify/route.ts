import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_RECOVERY_USUARIO } from "@ruum/shared/utils";
import { crearClienteServidor } from "@/lib/supabase-server";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import {
  hashIdentificador,
  RECOVERY_VENTANA_MS,
  RECOVERY_VERIFY_LIMITES,
} from "@/lib/recovery-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * RUUM-USR-F4-001 (CB-1) & PR-02 P0 — Verifica autorización de recuperación.
 * Retorna { authorized: true } solo si:
 *  - existe cookie httpOnly ruum_rec_usuario (seteada por /auth/callback tras PKCE recovery)
 *  - existe sesión válida (supabase.auth.getUser)
 *  - la cookie contiene el userId (UUID) y coincide con el user actual
 *
 * Rate Limit con clave compuesta (IP + cuenta/marcador + dispositivo) con
 * umbrales diferenciados para mitigar falsos positivos en CGNAT de México.
 */
export async function GET(request: NextRequest) {
  const sinCache = { "Cache-Control": "no-store" };

  try {
    const cookieStore = await cookies();
    const marcador = cookieStore.get(COOKIE_RECOVERY_USUARIO)?.value ?? null;
    const ip = obtenerIp(request);
    const dispositivo = request.headers.get("x-device-id")?.trim().slice(0, 128) || null;

    // Rate Limit Compuesto (CB-1): IP + Cuenta/UUID + Dispositivo
    const dimensiones = await Promise.all([
      rateLimitConVentana(ip, "recovery-verify-ip", RECOVERY_VERIFY_LIMITES.ip, RECOVERY_VENTANA_MS),
      rateLimitConVentana(
        marcador ? hashIdentificador(marcador) : null,
        "recovery-verify-account",
        RECOVERY_VERIFY_LIMITES.cuenta,
        RECOVERY_VENTANA_MS
      ),
      rateLimitConVentana(
        dispositivo ? hashIdentificador(dispositivo) : null,
        "recovery-verify-device",
        RECOVERY_VERIFY_LIMITES.dispositivo,
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
        { authorized: false },
        { status: 429, headers: { ...sinCache, "Retry-After": String(retryAfter || 60) } }
      );
    }

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
    return NextResponse.json({ authorized: false }, { status: 200, headers: sinCache });
  }
}
