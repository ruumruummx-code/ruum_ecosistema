import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_RECOVERY_CONDUCTOR, COOKIE_RECOVERY_LEGACY, RUTA_COOKIE_RECOVERY } from "@ruum/shared/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POR_HORA = 20;
const VENTANA_MS = 60 * 60 * 1000;
const MAX_CLAVES = 2000;

// M7/M8: app-conductor no tiene el lib compartido de rate limit; limitador
// local en memoria con purga oportunista (suficiente para este endpoint de
// bajísimo volumen legítimo: una llamada por cambio de contraseña).
const intentos = new Map<string, { count: number; resetAt: number }>();

function ipDeRequest(request: NextRequest): string | null {
  const vercel = request.headers.get("x-vercel-forwarded-for")?.split(",").map((t) => t.trim()).filter(Boolean).pop();
  if (vercel && /^\d{1,3}(\.\d{1,3}){3}$/.test(vercel)) return vercel;
  const real = request.headers.get("x-real-ip")?.trim();
  if (real && /^\d{1,3}(\.\d{1,3}){3}$/.test(real)) return real;
  // X-Forwarded-For: el primer token lo inyecta el cliente; solo vale el último.
  const fwd = request.headers.get("x-forwarded-for")?.split(",").map((t) => t.trim()).filter(Boolean).pop();
  if (fwd && /^\d{1,3}(\.\d{1,3}){3}$/.test(fwd)) return fwd;
  return null;
}

function limiteExcedido(ip: string | null): boolean {
  // Sin IP confiable no hay bucket compartido: fail-open en esta dimensión.
  if (!ip) return false;
  const now = Date.now();
  const entry = intentos.get(ip);
  if (!entry || now > entry.resetAt) {
    if (intentos.size >= MAX_CLAVES) {
      for (const [k, v] of intentos) {
        if (now > v.resetAt) intentos.delete(k);
        if (intentos.size < MAX_CLAVES) break;
      }
    }
    intentos.set(ip, { count: 1, resetAt: now + VENTANA_MS });
    return false;
  }
  if (entry.count >= MAX_POR_HORA) return true;
  entry.count += 1;
  return false;
}

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
  if (limiteExcedido(ipDeRequest(request))) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
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
