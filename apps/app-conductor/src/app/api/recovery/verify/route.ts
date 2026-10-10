import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_RECOVERY_CONDUCTOR } from "@ruum/shared/utils";
import { crearClienteServidor } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// M8: como el resto de endpoints de auth (ver nota en app-usuario).
const MAX_POR_HORA = 30;
const VENTANA_MS = 60 * 60 * 1000;
const MAX_CLAVES = 2000;

const intentos = new Map<string, { count: number; resetAt: number }>();

function ipDeRequest(request: NextRequest): string | null {
  const vercel = request.headers.get("x-vercel-forwarded-for")?.split(",").map((t) => t.trim()).filter(Boolean).pop();
  if (vercel && /^\d{1,3}(\.\d{1,3}){3}$/.test(vercel)) return vercel;
  const real = request.headers.get("x-real-ip")?.trim();
  if (real && /^\d{1,3}(\.\d{1,3}){3}$/.test(real)) return real;
  const fwd = request.headers.get("x-forwarded-for")?.split(",").map((t) => t.trim()).filter(Boolean).pop();
  if (fwd && /^\d{1,3}(\.\d{1,3}){3}$/.test(fwd)) return fwd;
  return null;
}

function limiteExcedido(ip: string | null): boolean {
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

/**
 * PR-02 P0 — Verifica autorización de recuperación (conductor).
 * Misma lógica que app-usuario pero con COOKIE_RECOVERY_CONDUCTOR.
 *
 * A5: respuesta mínima { authorized } sin `reason` ni `error`. El detalle del
 * fallo iba al cliente (oráculo de estado de sesión + mensajes internos de
 * Supabase vía String(e)); ahora solo va al log del servidor.
 */
export async function GET(request: NextRequest) {
  const sinCache = { "Cache-Control": "no-store" };

  // M8: este endpoint decide si se puede cambiar la contraseña.
  if (limiteExcedido(ipDeRequest(request))) {
    return NextResponse.json({ authorized: false }, { status: 429, headers: sinCache });
  }

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
