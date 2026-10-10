import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@ruum/api/supabase";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { normalizarCorreoRegistro, soloDigitos } from "@/lib/registro-usuario";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_INTENTOS_POR_IP = 20;
const MAX_INTENTOS_POR_CORREO = 5;
const VENTANA_MS = 15 * 60 * 1000;

/**
 * Verificación del código OTP de 6 dígitos con rate limit de servidor.
 *
 * Antes se llamaba directamente a `supabase.auth.verifyOtp` desde el navegador
 * (registro/confirma-correo). El espacio de búsqueda es de 10^6 códigos y el
 * correo objetivo venía del query param, así que un script podía iterar contra
 * un correo ajeno sin ninguna restricción de aplicación.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { email?: unknown; codigo?: unknown }
      | null;

    const correo =
      typeof body?.email === "string" ? normalizarCorreoRegistro(body.email) : "";
    const codigo = typeof body?.codigo === "string" ? soloDigitos(body.codigo, 6) : "";

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
    }
    if (codigo.length !== 6) {
      return NextResponse.json({ error: "El código debe tener 6 dígitos." }, { status: 400 });
    }

    const ip = obtenerIp(request);

    const porIp = await rateLimitConVentana(ip, "otp-ip", MAX_INTENTOS_POR_IP, VENTANA_MS);
    if (!porIp.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
        { status: 429, headers: { "Retry-After": String(porIp.retryAfterSec ?? 900) } }
      );
    }

    const porCorreo = await rateLimitConVentana(
      correo,
      "otp-correo",
      MAX_INTENTOS_POR_CORREO,
      VENTANA_MS
    );
    if (!porCorreo.allowed) {
      return NextResponse.json(
        { error: "Superaste los intentos disponibles para este código. Solicita uno nuevo." },
        { status: 429, headers: { "Retry-After": String(porCorreo.retryAfterSec ?? 900) } }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
    }

    const cookieStore = await cookies();
    const supabase = crearClienteServidor(url, anonKey, {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Route Handler puede escribir cookies: la sesión queda en el navegador.
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            /* best-effort */
          }
        }
      },
    });

    const { error } = await supabase.auth.verifyOtp({ type: "email", token: codigo, email: correo });

    if (error) {
      // Mensaje genérico: no revela si el correo existe ni si el código fue
      // el único campo incorrecto.
      return NextResponse.json(
        { error: "No pudimos verificar el código. Revisa que esté escrito correctamente e inténtalo de nuevo." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn("[auth/verify-otp] error inesperado", e);
    return NextResponse.json({ error: "No pudimos verificar el código." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}