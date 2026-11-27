import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@ruum/api/supabase/server-client";
import { ipDeRequest, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RESPUESTA_NEUTRA = {
  ok: true,
  mensaje: "Si el correo está registrado, enviamos el enlace para restablecer tu contraseña.",
};
const VENTANA_MS = 15 * 60 * 1000;
const MAX_POR_IP = 15;
const MAX_POR_CORREO = 3;

function hashIdentificador(valor: string): string {
  return crypto.createHash("sha256").update(valor).digest("hex").slice(0, 32);
}

function esMismoOrigen(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") return false;
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

async function conTimeout<T>(operacion: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operacion,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("RECOVERY_REQUEST_TIMEOUT")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function POST(request: NextRequest) {
  const sinCache = { "Cache-Control": "no-store" };
  if (!esMismoOrigen(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403, headers: sinCache });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const correo = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return NextResponse.json({ error: "Escribe un correo válido, como tu@correo.com." }, { status: 400, headers: sinCache });
  }

  const ip = ipDeRequest(request);
  const emailHash = hashIdentificador(correo);
  const [porIp, porCorreo] = await Promise.all([
    rateLimit(ip, { max: MAX_POR_IP, ventanaMs: VENTANA_MS, clave: "conductor-recovery-ip", failClosed: true }),
    rateLimit(emailHash, { max: MAX_POR_CORREO, ventanaMs: VENTANA_MS, clave: "conductor-recovery-email", failClosed: true }),
  ]);

  if (!porIp.allowed || !porCorreo.allowed) {
    const espera = Math.max(porIp.retryAfterSec ?? 0, porCorreo.retryAfterSec ?? 0, 60);
    return NextResponse.json(
      { error: "Ya enviamos un enlace hace unos momentos. Espera unos minutos antes de solicitar otro." },
      { status: 429, headers: { ...sinCache, "Retry-After": String(espera) } }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Servicio no disponible temporalmente." }, { status: 503, headers: sinCache });
  }

  try {
    const cookieStore = await cookies();
    const cliente = crearClienteServidor(url, anonKey, {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        for (const item of items) {
          try {
            cookieStore.set(item.name, item.value, item.options);
          } catch {
            /* best effort */
          }
        }
      },
    });

    const redirectTo = `${request.nextUrl.origin}/auth/callback?type=recovery&next=/nueva-password`;
    const { error } = await conTimeout(cliente.auth.resetPasswordForEmail(correo, { redirectTo }), 10_000);
    if (error && /rate limit|too many/i.test(error.message ?? "")) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera unos minutos antes de solicitar otro enlace." },
        { status: 429, headers: { ...sinCache, "Retry-After": "60" } }
      );
    }

    return NextResponse.json(RESPUESTA_NEUTRA, { status: 200, headers: sinCache });
  } catch {
    return NextResponse.json(
      { error: "No pudimos procesar la solicitud en este momento. Intenta de nuevo más tarde." },
      { status: 503, headers: { ...sinCache, "Retry-After": "30" } }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
