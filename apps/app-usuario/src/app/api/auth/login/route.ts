import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@ruum/api/supabase";
import { normalizarCorreoRegistro } from "@/lib/registro-usuario";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { verificarCsrfORechazar } from "@/lib/csrf";
import { logStructuredInfo, logStructuredWarn } from "@/lib/logger";
import { hashIdentificador, LOGIN_LIMITES, LOGIN_VENTANA_MS, requiereCaptcha, verificarCaptchaAdaptativo } from "@/lib/login-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MENSAJE_NEUTRO = "No pudimos iniciar sesión. Verifica tus datos e intenta de nuevo.";

async function conTimeout<T>(operacion: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operacion,
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("AUTH_LOGIN_TIMEOUT")), ms); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function POST(request: NextRequest) {
  const rechazoCsrf = verificarCsrfORechazar(request);
  if (rechazoCsrf) return rechazoCsrf;
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown; captchaToken?: unknown } | null;
  const correo = typeof body?.email === "string" ? normalizarCorreoRegistro(body.email).slice(0, 254) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const captchaToken = typeof body?.captchaToken === "string" ? body.captchaToken : null;
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || password.length < 1 || password.length > 256) {
    return NextResponse.json({ error: MENSAJE_NEUTRO }, { status: 400 });
  }

  const ip = obtenerIp(request);
  const dispositivo = request.headers.get("x-device-id")?.trim().slice(0, 128) || null;
  const dimensiones = await Promise.all([
    rateLimitConVentana(ip, "auth-login-ip", LOGIN_LIMITES.ip, LOGIN_VENTANA_MS),
    rateLimitConVentana(hashIdentificador(correo), "auth-login-email", LOGIN_LIMITES.email, LOGIN_VENTANA_MS),
    rateLimitConVentana(dispositivo ? hashIdentificador(dispositivo) : null, "auth-login-device", LOGIN_LIMITES.dispositivo, LOGIN_VENTANA_MS),
  ]);
  const [porIp, porEmail, porDispositivo] = dimensiones;
  const retryAfter = Math.max(porIp.retryAfterSec ?? 0, porEmail.retryAfterSec ?? 0, porDispositivo.retryAfterSec ?? 0);
  if (dimensiones.some((dimension) => !dimension.allowed)) {
    logStructuredWarn("auth/login", "login_rate_limited", undefined, { dimensiones: ["ip", "email", "dispositivo"] });
    return NextResponse.json({ error: "Demasiados intentos. Intenta más tarde." }, { status: 429, headers: { "Retry-After": String(retryAfter || 60), "Cache-Control": "no-store" } });
  }

  const riesgo = { ip: porIp.restantes, email: porEmail.restantes, dispositivo: porDispositivo.restantes };
  if (requiereCaptcha(riesgo)) {
    const captcha = await verificarCaptchaAdaptativo(captchaToken, ip);
    if (!captcha.aprobado) {
      logStructuredWarn("auth/login", captcha.proveedorCaido ? "captcha_degradado" : "captcha_requerido", undefined, { riesgo: Object.keys(riesgo) });
      return NextResponse.json(
        { error: captcha.proveedorCaido ? "No pudimos validar el acceso de forma segura. Intenta de nuevo en unos minutos." : "Confirma la verificación de seguridad para continuar.", captchaRequerido: true },
        { status: captcha.proveedorCaido ? 429 : 428, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
      );
    }
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
    const cookieStore = await cookies();
    const cliente = crearClienteServidor(url, anonKey, {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => { for (const item of items) { try { cookieStore.set(item.name, item.value, item.options); } catch { /* best effort */ } } },
    });
    const { data, error } = await conTimeout(cliente.auth.signInWithPassword({ email: correo, password }), 10_000);
    if (error || !data.session) {
      logStructuredWarn("auth/login", "login_fallido", undefined, { motivo: "credenciales_rechazadas" });
      return NextResponse.json({ error: MENSAJE_NEUTRO }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    logStructuredInfo("auth/login", "login_exitoso", { destinoProtegido: true });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logStructuredWarn("auth/login", "login_degradado", error, { motivo: "dependencia_auth" });
    return NextResponse.json({ error: "El servicio de acceso está temporalmente no disponible. Intenta de nuevo." }, { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
