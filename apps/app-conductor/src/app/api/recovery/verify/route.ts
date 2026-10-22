import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_RECOVERY_CONDUCTOR } from "@ruum/shared/utils";
import { crearClienteServidor } from "@/lib/supabase-server";
import { rateLimit, ipDeRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// M8: como el resto de endpoints de auth (ver nota en app-usuario).
const MAX_POR_HORA = 30;
const VENTANA_MS = 60 * 60 * 1000;

/**
 * PR-02 P0 — Verifica autorización de recuperación (conductor).
 * Misma lógica que app-usuario pero con COOKIE_RECOVERY_CONDUCTOR.
 *
 * A5: respuesta mínima { authorized } sin `reason` ni `error`. El detalle del
 * fallo iba al cliente (oráculo de estado de sesión + mensajes internos de
 * Supabase vía String(e)); ahora solo va al log del servidor.
 *
 * A6: rate-limit distribuido por IP (preparado para Upstash/Redis vía rateLimitStore).
 */
export async function GET(request: NextRequest) {
  const sinCache = { "Cache-Control": "no-store" };

  // Rate-limit por IP (preparado para serverless: store inyectable)
  const ip = ipDeRequest(request);
  const { allowed, remaining, resetAt, retryAfterSec } = await rateLimit(
    ip,
    { max: MAX_POR_HORA, ventanaMs: VENTANA_MS, clave: "recovery-verify", failClosed: true }
  );

  if (!allowed) {
    const espera = retryAfterSec ?? Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { authorized: false },
      {
        status: 429,
        headers: {
          ...sinCache,
          "Retry-After": String(espera),
          "X-RateLimit-Limit": String(MAX_POR_HORA),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(resetAt)
        }
      }
    );
  }

  // M8: este endpoint decide si se puede cambiar la contraseña.
  try {
    const cookieStore = await cookies();
    const marcador = cookieStore.get(COOKIE_RECOVERY_CONDUCTOR)?.value ?? null;

    /* CORRECCIÓN: se elimina la lectura de la cookie legacy "ruum_recovery" y
       cualquier autorización basada solo en sesión. El marcador debe ser un
       UUID válido que coincida con el usuario actual. */

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
