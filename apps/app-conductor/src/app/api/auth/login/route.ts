import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@ruum/api/supabase/server-client";
import { ipDeRequest, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MENSAJE_NEUTRO = "No pudimos iniciar sesión. Verifica tus datos e intenta de nuevo.";
const VENTANA_MS = 15 * 60 * 1000;
const MAX_POR_IP = 20;
const MAX_POR_CORREO = 10;

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
        timer = setTimeout(() => reject(new Error("AUTH_LOGIN_TIMEOUT")), ms);
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

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const correo = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || password.length < 1 || password.length > 256) {
    return NextResponse.json({ error: MENSAJE_NEUTRO }, { status: 400, headers: sinCache });
  }

  const ip = ipDeRequest(request);
  const emailHash = hashIdentificador(correo);
  const [porIp, porCorreo] = await Promise.all([
    rateLimit(ip, { max: MAX_POR_IP, ventanaMs: VENTANA_MS, clave: "conductor-login-ip", failClosed: true }),
    rateLimit(emailHash, { max: MAX_POR_CORREO, ventanaMs: VENTANA_MS, clave: "conductor-login-email", failClosed: true }),
  ]);

  if (!porIp.allowed || !porCorreo.allowed) {
    const espera = Math.max(porIp.retryAfterSec ?? 0, porCorreo.retryAfterSec ?? 0, 60);
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
      { status: 429, headers: { ...sinCache, "Retry-After": String(espera) } }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503, headers: sinCache });
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

    const { data, error } = await conTimeout(cliente.auth.signInWithPassword({ email: correo, password }), 10_000);
    if (error || !data.session) {
      return NextResponse.json({ error: MENSAJE_NEUTRO }, { status: 401, headers: sinCache });
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: sinCache });
  } catch {
    return NextResponse.json(
      { error: "El servicio de acceso está temporalmente no disponible. Intenta de nuevo." },
      { status: 503, headers: { ...sinCache, "Retry-After": "30" } }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
