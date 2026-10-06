import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@ruum/api/supabase";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { normalizarCorreoRegistro } from "@/lib/registro-usuario";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POR_HORA = 10;
const VENTANA_MS = 60 * 60 * 1000;

/**
 * Reenvío de confirmación de correo con rate limit de servidor.
 *
 * El cooldown de 60 s vivía solo en localStorage, que se limpia con
 * removeItem, una ventana privada nueva o cualquier script. Con este endpoint el
 * límite real es el del servidor (10/hora por IP y por correo).
 *
 * Respuesta neutra a propósito: no revela si el correo existe.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { email?: unknown; origen?: unknown }
      | null;

    const correo =
      typeof body?.email === "string" ? normalizarCorreoRegistro(body.email) : "";
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
    }

    const ip = obtenerIp(request);

    const porIp = await rateLimitConVentana(ip, "auth-resend-ip", MAX_POR_HORA, VENTANA_MS);
    if (!porIp.allowed) {
      return NextResponse.json(
        { error: "Superaste el límite de correos por hora. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(porIp.retryAfterSec ?? 3600) } }
      );
    }

    const porCorreo = await rateLimitConVentana(
      correo,
      "auth-resend-correo",
      MAX_POR_HORA,
      VENTANA_MS
    );
    if (!porCorreo.allowed) {
      return NextResponse.json(
        { error: "Ese correo ya recibió varios envíos. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(porCorreo.retryAfterSec ?? 3600) } }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
    }

    const origenSolicitado = typeof body?.origen === "string" ? body.origen : "";
    // Solo se acepta el origen si es http(s) y sin rutas; evita usar un
    // attacker-controlled origen como redirectTo.
    let redirectTo = `${request.nextUrl.origin}/auth/callback?next=%2F`;
    try {
      const u = new URL(origenSolicitado);
      if ((u.protocol === "http:" || u.protocol === "https:") && u.pathname === "/") {
        redirectTo = `${u.origin}/auth/callback?next=%2F`;
      }
    } catch {
      /* origen inválido: se usa el fallback derivado del request */
    }

    const supabase = crearClienteServidor(url, anonKey, {
      getAll() {
        return [];
      },
      setAll() {
        /* sin cookies: este endpoint no establece sesión */
      },
    });

    const { error } = await supabase.auth.resend({ type: "signup", email: correo, options: { emailRedirectTo: redirectTo } });

    // Mismo mensaje en éxito y en "usuario inexistente": no enumeramos cuentas.
    if (error) {
      console.warn("[auth/resend] supabase devolvio error", {
        codigo: error.status,
        ip,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn("[auth/resend] error inesperado", e);
    return NextResponse.json({ error: "No pudimos reenviar el correo." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 });
}