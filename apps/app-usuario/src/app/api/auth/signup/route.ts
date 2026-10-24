import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@ruum/api/supabase";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import {
  normalizarCorreoRegistro,
  nombreCompleto,
  soloDigitos,
  telefonoMx,
} from "@/lib/registro-usuario";
import { validarTokenTelefono, bypassVerificacionTelefonoPermitido } from "@/lib/phone-verification";
import { VERSION_TERMINOS_VIGENTE } from "@ruum/shared/constants";
import { passwordCumpleRequisitos } from "@ruum/shared/utils";
import { verificarCsrfORechazar } from "@/lib/csrf";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POR_IP_HORA = 10;
const MAX_POR_CORREO_HORA = 5;
const VENTANA_MS = 60 * 60 * 1000;
const MENSAJE_REGISTRO_NO_COMPLETADO =
  "No pudimos completar el registro. Si ya tienes una cuenta, inicia sesión o recupera tu contraseña.";

/**
 * Alta de cuenta de usuario con rate limit de servidor.
 *
 * Antes el `signUp` se llamaba directo desde el navegador sin throttling de
 * aplicación: un script podía crear cuentas en masa o enumerar correos. Ahora
 * el único camino es este endpoint (10/h por IP, 5/h por correo).
 */
export async function POST(request: NextRequest) {
  try {
    const rechazoCsrf = verificarCsrfORechazar(request);
    if (rechazoCsrf) return rechazoCsrf;

    const body = (await request.json().catch(() => null)) as {
      nombre?: unknown;
      apellido?: unknown;
      telefono?: unknown;
      email?: unknown;
      password?: unknown;
      aceptaTerminos?: unknown;
      tokenVerificacionTelefono?: unknown;
    } | null;

    const nombre = typeof body?.nombre === "string" ? body.nombre.trim().slice(0, 80) : "";
    const apellido = typeof body?.apellido === "string" ? body.apellido.trim().slice(0, 80) : "";
    const telefonoDigitos = typeof body?.telefono === "string" ? soloDigitos(body.telefono, 10) : "";
    const correo =
      typeof body?.email === "string" ? normalizarCorreoRegistro(body.email).slice(0, 254) : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const tokenTelefono =
      typeof body?.tokenVerificacionTelefono === "string" ? body.tokenVerificacionTelefono : "";

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

    // Validación de verificación telefónica por SMS.
    // La suspensión explícita permite el alta sin acreditar la propiedad del teléfono.
    if (!bypassVerificacionTelefonoPermitido()) {
      const verificacionTelefono = validarTokenTelefono(telefonoDigitos, tokenTelefono);
      if (!verificacionTelefono.valido) {
        return NextResponse.json(
          { error: verificacionTelefono.error || "Debes verificar tu número de teléfono celular por SMS antes de continuar." },
          { status: 400 }
        );
      }
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
    // Con la verificación suspendida el teléfono NO quedó verificado: registrarlo
    // así en metadata para no contaminar datos con una verificación falsa.
    const telefonoVerificadoReal = !bypassVerificacionTelefonoPermitido();
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password,
      options: {
        data: {
          tipo_registro: "usuario",
          nombre: nombreCompleto(nombre, apellido),
          telefono: telefonoMx(telefonoDigitos),
          telefono_verificado: telefonoVerificadoReal,
          telefono_verificado_en: telefonoVerificadoReal ? ahora : null,
          tipo_cuenta: "personal",
          version_terminos_aceptada: VERSION_TERMINOS_VIGENTE,
          terminos_aceptados_en: ahora,
        },
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback?next=%2F`,
      },
    });

    if (error) {
      // No revelar si el correo ya existe: mensaje genérico.
      // 422 también puede indicar problemas de correo/configuración: usar el
      // código de Auth o el mensaje explícito, nunca solo el estado HTTP.
      const esDuplicado =
        error.code === "user_already_exists" || error.code === "email_exists" ||
        /already[\s_-]?registered|already[\s_-]?exists|\bemail[\s_-]?taken\b|en uso/i.test(error.message ?? "");
      if (esDuplicado) {
        return NextResponse.json(
          { error: MENSAJE_REGISTRO_NO_COMPLETADO },
          { status: 400 }
        );
      }
      console.warn("[auth/signup] supabase devolvio error", { status: error.status, code: error.code });
      return NextResponse.json(
        { error: "No pudimos crear la cuenta. Intenta de nuevo." },
        { status: 400 }
      );
    }
    if (!data.user) {
      return NextResponse.json({ error: "No se pudo crear el usuario." }, { status: 500 });
    }

    // Auth puede ocultar un registro repetido con un usuario ficticio sin
    // identidades y sin sesión. Esa respuesta no implica que haya enviado correo.
    if (!data.session && data.user.identities?.length === 0) {
      return NextResponse.json({ error: MENSAJE_REGISTRO_NO_COMPLETADO }, { status: 400 });
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
