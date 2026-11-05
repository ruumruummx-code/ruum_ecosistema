import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@ruum/api/supabase";
import { normalizarCorreoRegistro } from "@/lib/registro-usuario";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { verificarCsrfORechazar } from "@/lib/csrf";
import { logStructuredInfo, logStructuredWarn } from "@/lib/logger";
import {
  hashIdentificador,
  RECOVERY_SOLICITUD_LIMITES,
  RECOVERY_VENTANA_MS,
  requiereCaptchaRecovery,
  verificarCaptchaRecovery,
} from "@/lib/recovery-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RESPUESTA_NEUTRA = {
  ok: true,
  mensaje: "Si el correo está registrado, enviamos el enlace para restablecer tu contraseña.",
};

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

/**
 * RUUM-USR-F4-001 (CB-2): Endpoint de aplicación para resetPasswordForEmail.
 *
 * Sustituye la llamada directa desde el cliente navegador a GoTrue por un
 * endpoint seguro con rate limit durable sobre Redis (clave compuesta IP + email + dispositivo),
 * CAPTCHA adaptativo ante riesgo y telemetría estructurada sin PII.
 */
export async function POST(request: NextRequest) {
  // 1. Verificación Anti-CSRF
  const rechazoCsrf = verificarCsrfORechazar(request);
  if (rechazoCsrf) return rechazoCsrf;

  // 2. Parseo y sanitización de entrada
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    captchaToken?: unknown;
  } | null;

  const correo = typeof body?.email === "string" ? normalizarCorreoRegistro(body.email).slice(0, 254) : "";
  const captchaToken = typeof body?.captchaToken === "string" ? body.captchaToken : null;

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return NextResponse.json(
      { error: "Escribe un correo válido, como correo@ejemplo.com." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const ip = obtenerIp(request);
  const emailHash = hashIdentificador(correo);
  const dispositivo = request.headers.get("x-device-id")?.trim().slice(0, 128) || null;

  // 3. Rate Limit Compuesto (CB-1)
  const dimensiones = await Promise.all([
    rateLimitConVentana(ip, "recovery-req-ip", RECOVERY_SOLICITUD_LIMITES.ip, RECOVERY_VENTANA_MS),
    rateLimitConVentana(emailHash, "recovery-req-email", RECOVERY_SOLICITUD_LIMITES.email, RECOVERY_VENTANA_MS),
    rateLimitConVentana(
      dispositivo ? hashIdentificador(dispositivo) : null,
      "recovery-req-device",
      RECOVERY_SOLICITUD_LIMITES.dispositivo,
      RECOVERY_VENTANA_MS
    ),
  ]);

  const [porIp, porEmail, porDispositivo] = dimensiones;
  const retryAfter = Math.max(
    porIp.retryAfterSec ?? 0,
    porEmail.retryAfterSec ?? 0,
    porDispositivo.retryAfterSec ?? 0
  );

  if (dimensiones.some((dimension) => !dimension.allowed)) {
    logStructuredWarn("recovery/request", "solicitud_recovery_rate_limited", undefined, {
      dimensiones: ["ip", "email", "dispositivo"],
      emailHash,
    });
    return NextResponse.json(
      {
        error: "Ya enviamos un enlace hace unos momentos. Revisa tu bandeja o espera unos minutos antes de solicitar otro.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter || 60),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // 4. CAPTCHA Adaptativo (CB-2)
  const riesgo = {
    ip: porIp.restantes,
    email: porEmail.restantes,
    dispositivo: porDispositivo.restantes,
  };

  if (requiereCaptchaRecovery(riesgo)) {
    const captcha = await verificarCaptchaRecovery(captchaToken, ip);
    if (!captcha.aprobado) {
      logStructuredWarn(
        "recovery/request",
        captcha.proveedorCaido ? "captcha_recovery_degradado" : "captcha_recovery_requerido",
        undefined,
        { emailHash }
      );
      return NextResponse.json(
        {
          error: captcha.proveedorCaido
            ? "El servicio de validación de seguridad no está disponible temporalmente. Intenta de nuevo en unos minutos."
            : "Por seguridad, confirma la verificación humana para continuar.",
          captchaRequerido: true,
        },
        {
          status: captcha.proveedorCaido ? 429 : 428,
          headers: { "Retry-After": "60", "Cache-Control": "no-store" },
        }
      );
    }
  }

  // 5. Invocación segura de GoTrue en servidor
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      logStructuredWarn("recovery/request", "configuracion_supabase_ausente", undefined);
      return NextResponse.json({ error: "Servicio no disponible temporalmente." }, { status: 503 });
    }

    const cliente = crearClienteServidor(url, anonKey, {
      getAll: () => [],
      setAll: () => {},
    });

    const redirectTo = `${request.nextUrl.origin}/auth/callback?type=recovery&next=/nueva-password`;

    const { error: errReset } = await conTimeout(
      cliente.auth.resetPasswordForEmail(correo, { redirectTo }),
      10_000
    );

    if (errReset) {
      // Si GoTrue reporta rate limit de email del proveedor
      const msg = errReset.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("too many")) {
        logStructuredWarn("recovery/request", "gotrue_rate_limited", errReset, { emailHash });
        return NextResponse.json(
          { error: "Demasiados intentos. Espera unos momentos antes de solicitar otro enlace." },
          { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
        );
      }
      logStructuredWarn("recovery/request", "reset_password_proveedor_fallido", errReset, { emailHash });
      // Respuesta neutra para evitar oráculo de enumeración de usuarios
      return NextResponse.json(RESPUESTA_NEUTRA, { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    // Telemetría sin PII (solo hash de identificador)
    logStructuredInfo("recovery/request", "solicitud_recovery_exitosa", { emailHash });

    return NextResponse.json(RESPUESTA_NEUTRA, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logStructuredWarn("recovery/request", "error_inesperado_solicitud_recovery", error, { emailHash });
    return NextResponse.json(
      { error: "No pudimos procesar la solicitud en este momento. Intenta de nuevo más tarde." },
      { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
