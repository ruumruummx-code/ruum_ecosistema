import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_RECOVERY_CONDUCTOR, COOKIE_RECOVERY_LEGACY, RUTA_COOKIE_RECOVERY } from "@ruum/shared/utils";
import { rateLimit, ipDeRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POR_HORA = 20;
const VENTANA_MS = 60 * 60 * 1000;

function opcionesExpiracion() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: 0,
    path: RUTA_COOKIE_RECOVERY,
  };
}

/**
 * M7: el llamante legítimo es fetch same-origin desde /nueva-password.
 * Si el request trae Origin/Referer de otro origen se rechaza (CSRF).
 * Sin cabeceras pasa; el rate limit por IP sigue aplicando.
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

export async function POST(request: NextRequest) {
  if (!esMismoOrigen(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const ip = ipDeRequest(request);
  const { allowed, remaining, resetAt } = await rateLimit(
    `recovery-clear:${ip ?? "anon"}`,
    { max: MAX_POR_HORA, ventanaMs: VENTANA_MS }
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(MAX_POR_HORA),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(resetAt),
        },
      }
    );
  }

  const cookieStore = await cookies();
  const opts = opcionesExpiracion();
  try {
    cookieStore.set(COOKIE_RECOVERY_CONDUCTOR, "", opts);
    cookieStore.set(COOKIE_RECOVERY_LEGACY, "", opts);
    cookieStore.set("ruum_recovery", "", opts);
    try { cookieStore.delete(COOKIE_RECOVERY_CONDUCTOR); } catch {}
    try { cookieStore.delete(COOKIE_RECOVERY_LEGACY); } catch {}
    try { cookieStore.delete("ruum_recovery"); } catch {}
  } catch {}
  return NextResponse.json({ cleared: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: NextRequest) {
  return POST(request);
}
