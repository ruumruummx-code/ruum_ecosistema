import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@ruum/api/supabase";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import {
  normalizarCorreoRegistro,
  nombreCompleto,
  soloDigitos,
  telefonoMx,
} from "@/lib/registro-usuario";
import { VERSION_TERMINOS_VIGENTE } from "@ruum/shared/constants";
import { passwordCumpleRequisitos } from "@ruum/shared/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POR_IP_HORA = 10;
const MAX_POR_CORREO_HORA = 5;
const VENTANA_MS = 60 * 60 * 1000;

/**
 * Alta de cuenta de usuario con rate limit de servidor.
 *
 * Antes el `signUp` se llamaba directo desde el navegador sin throttling de
 * aplicación: un script podía crear cuentas en masa o enumerar correos. Ahora
 * el único camino es este endpoint (10/h por IP, 5/h por correo).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      nombre?: unknown;
      apellido?: unknown;
      telefono?: unknown;
      email?: unknown;
      password?: unknown;
      tipoCuenta?: unknown;
      aceptaTerminos?: unknown;
    } | null;

    const nombre = typeof body?.nombre === "string" ? body.nombre.trim().slice(0, 80) : "";
    const apellido = typeof body?.apellido === "string" ? body.apellido.trim().slice(0, 80) : "";
    const telefonoDigitos = typeof body?.telefono === "string" ? soloDigitos(body.telefono, 10) : "";
    const correo =
      typeof body?.email === "string" ? normalizarCorreoRegistro(body.email).slice(0, 254) : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const tipoCuenta = body?.tipoCuenta === "empresa" ? "empresa" : "personal";

    if (!nombre) return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
    if (!apellido) return NextResponse.json({ error: "Escribe tu apellido." }, { status: 400 });
    if (telefonoDigitos.length !== 10) {
      return NextResponse.json({ error: "El teléfono debe tener 10 dígitos." }, { status: 400 });
    }
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return NextResponse.json({ error: "El formato del correo no es válido." }, { status: 400 });
    }
    if (typeof password !== "string" || !passwordCumpleRequisitos(password)) {
      return NextResponse.json(
        { error: "La contraseña debe incluir minúscula, mayúscula y número." },
        { status: 400 }
      );
    }
    if (body?.aceptaTerminos !== true) {
      return NextResponse.json({ error: "Acepta los términos para continuar." }, { status: 400 });
    }

    const ip = obtenerIp(request);

    const porIp = await rateLimitConVentana(ip, "auth-signup-ip", MAX_POR_IP_HORA, VENTANA_MS);
    if (!porIp.allowed) {
      return NextResponse.json(
        { error: "Demasiados registros desde esta conexión. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(porIp.retryAfterSec ?? 3600) } }
      );
    }
    const porCorreo = await rateLimitConVentana(correo, "auth-signup-correo", MAX_POR_CORREO_HORA, VENTANA_MS);
    if (!porCorreo.allowed) {
      return NextResponse.json(
        { error: "Ese correo ya tiene varios intentos. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(porCorreo.retryAfterSec ?? 3600) } }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
    }

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = crearClienteServidor(url, anonKey, {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            /* best-effort */
          }
        }
      },
    });

    const ahora = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password,
      options: {
        data: {
          tipo_registro: "usuario",
          nombre: nombreCompleto(nombre, apellido),
          telefono: telefonoMx(telefonoDigitos),
          tipo_cuenta: tipoCuenta,
          version_terminos_aceptada: VERSION_TERMINOS_VIGENTE,
          terminos_aceptados_en: ahora,
        },
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback?next=%2F`,
      },
    });

    if (error) {
      // No revelar si el correo ya existe: mensaje genérico.
      // Anti-enumeración sin falsos positivos: la señal es el 422 de
      // Supabase ("User already registered"); el "uso" a secas anterior marcaba
      // como duplicado cualquier mensaje con esa subcadena ("uso", "incluso",
      // "exclusivo"...) y degradaba el diagnóstico de errores reales.
      const esDuplicado =
        error.status === 422 ||
        /already[\s_-]?registered|already[\s_-]?exists|\bemail[\s_-]?taken\b|en uso/i.test(error.message ?? "");
      if (esDuplicado) {
        return NextResponse.json(
          { error: "Si el correo corresponde a una cuenta, recibirás instrucciones para continuar." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "No pudimos crear la cuenta. Intenta de nuevo." },
        { status: 400 }
      );
    }
    if (!data.user) {
      return NextResponse.json({ error: "No se pudo crear el usuario." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, requiereConfirmacion: !data.session, correo });
  } catch (e) {
    console.warn("[auth/signup] error inesperado", e);
    return NextResponse.json({ error: "No pudimos crear la cuenta." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
