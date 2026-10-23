import { type NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@ruum/api/supabase";
import { verificarRolConReintentos } from "./lib/role-verification-retry";
import {
  buildCsp,
  COOKIE_ROL_APP,
  CSP_PRESETS,
  EVENTO_FALLO_VERIFICACION_ROL,
  firmarRolApp,
  opcionesCookieRolApp,
  verificarRolAppFirmado
} from "@ruum/shared/seguridad";

const RUTAS_PUBLICAS_CONDUCTOR = [
  "/login",
  "/registro",
  "/onboarding",
  "/recuperar-password",
  "/nueva-password",
  "/legal",
  "/auth",
  "/actualizacion-requerida",
  "/403",
  "/api/health",
  "/api/csp-report",
  "/api/recovery/verify",
  "/api/recovery/clear",
  "/theme-init.js",
  "/sw.js",
  "/manifest.json",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/auth-callback-fallback.js"
];

function esRutaPublicaConductor(pathname: string): boolean {
  return RUTAS_PUBLICAS_CONDUCTOR.some((ruta) => {
    if (ruta.startsWith("/api/") || ruta.includes(".")) {
      return pathname === ruta;
    }
    return pathname === ruta || pathname.startsWith(`${ruta}/`);
  });
}

/**
 * P0.1 / P1 — Seguridad + sesión (producción)
 * 1. Fail-closed en producción si Supabase no está configurado.
 * 2. Refresca el token en cada petición (getUser valida contra Auth).
 * 3. Gate de autenticación: rutas protegidas sin sesión → /login?next=... (o 401 si es /api/*).
 * 4. Gate de rol: un usuario/pasajero no puede operar en app-conductor → /403?reason=rol_usuario.
 *    El rol se cachea en cookie httpOnly firmada (TTL 5 min) y, si la verificación
 *    falla tras dos reintentos, el middleware deniega temporalmente con 503 y
 *    emite la métrica `conductor_role_verification_failed`.
 * 5. Redirección inversa: sesión válida en /login|/onboarding → /panel.
 */
function buildCspConductor(nonce: string, isProd: boolean) {
  return buildCsp({ nonce, isProd, extras: CSP_PRESETS.conductor });
}

function applyCspHeaders(res: NextResponse, nonce: string) {
  const isProd = process.env.NODE_ENV === "production";
  const isStaging = process.env.NEXT_PUBLIC_RUUM_AMBIENTE === "staging";
  const csp = buildCspConductor(nonce, isProd);
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  if (isStaging) {
    res.headers.set("Content-Security-Policy-Report-Only", csp + "; report-uri /api/csp-report; report-to csp-endpoint");
  }
  return res;
}

/** Código de error corto y no sensible (nunca el mensaje completo). */
function codigoErrorCorto(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code.trim()) return code.slice(0, 80);
  }
  if (error instanceof Error && error.name) return error.name.slice(0, 80);
  return "unknown_error";
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-nonce", nonce);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const esProduccion = process.env.NODE_ENV === "production";

  if (esProduccion && (!url || !anonKey)) {
    console.error("[security] app-conductor bloqueado: Supabase no configurado en producción", {
      pathname: request.nextUrl.pathname
    });
    return applyCspHeaders(new NextResponse("Configuración de producción incompleta", { status: 503 }), nonce);
  }

  if (!url || !anonKey) {
    return applyCspHeaders(response, nonce);
  }

  const supabase = crearClienteServidor(url, anonKey, {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      response.headers.set("x-nonce", nonce);
      cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    }
  });

  const { pathname } = request.nextUrl;
  const esPublica = esRutaPublicaConductor(pathname);
  const esRutaAuth = pathname === "/login" || pathname === "/onboarding";

  // Si la ruta es pública y no es de autenticación (/login, /onboarding),
  // no se necesita contactar a GoTrue por cada request.
  if (esPublica && !esRutaAuth) {
    return applyCspHeaders(response, nonce);
  }

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  } catch {
    // Si GoTrue no responde o falla la red, user queda null (fail-closed para rutas protegidas sin emitir 500)
    user = null;
  }

  if (!user && !esPublica) {
    if (pathname.startsWith("/api/")) {
      return applyCspHeaders(
        NextResponse.json({ error: "No autorizado" }, { status: 401 }),
        nonce
      );
    }
    const destino = new URL("/login", request.url);
    destino.searchParams.set("next", pathname);
    return applyCspHeaders(NextResponse.redirect(destino), nonce);
  }

  if (user && !esPublica) {
    // Gate de rol: verificar que un pasajero/usuario no opere en la app conductor.
    //
    // El rol se cachea en una cookie httpOnly firmada (HMAC-SHA256, TTL 5 min)
    // para no pagar 2 SELECT a PostgREST en cada petición protegida.
    // Ante un fallo transitorio se reintenta dos veces; si la identidad sigue
    // sin poder verificarse, se deniega con 503. No se asume que RLS compense
    // una clasificación de rol fallida.
    const secretoRol = process.env.RUUM_ROLE_COOKIE_SECRET?.trim() ?? "";
    const cacheable = secretoRol.length >= 32;
    let valorCookieRol: string | null = null;
    let rol: "usuario" | "conductor" | "ninguno" | null = null;

    if (cacheable) {
      const verificado = await verificarRolAppFirmado(
        request.cookies.get(COOKIE_ROL_APP)?.value,
        secretoRol
      );
      // La cookie solo sirve si pertenece al usuario de esta sesión.
      if (verificado && verificado.authUserId === user.id) rol = verificado.rol;
    }

    if (!rol) {
      try {
        const { clasificarRolApp } = await import("@ruum/api/identity");
        rol = await verificarRolConReintentos(() => clasificarRolApp(supabase, user.id));
      } catch (e) {
        // Fallo cerrado: una sesión autenticada sin rol verificable no entra a la app.
        const motivo = codigoErrorCorto(e);
        console.error(
          JSON.stringify({
            event: EVENTO_FALLO_VERIFICACION_ROL,
            level: "error",
            scope: "conductor_middleware",
            kind: "security_event",
            timestamp: new Date().toISOString(),
            context: { pathname, motivo, accessDecision: "deny_503", attempts: 3 }
          })
        );
        try {
          const { registrarFalloVerificacionRol } = await import("@ruum/api/identity");
          await registrarFalloVerificacionRol(supabase, {
            pathname,
            motivo,
            ambito: "app-conductor"
          });
        } catch {
          /* la métrica nunca debe cambiar la denegación por fallo cerrado */
        }
        return applyCspHeaders(
          NextResponse.json({ error: "No se pudo verificar el rol. Inténtalo de nuevo." }, { status: 503 }),
          nonce
        );
      }
      if (cacheable && rol) {
        try {
          valorCookieRol = await firmarRolApp(rol, user.id, secretoRol);
          response.cookies.set(COOKIE_ROL_APP, valorCookieRol, opcionesCookieRolApp());
        } catch (e) {
          // El rol sí fue verificado; fallar la cache sólo fuerza otra consulta.
          console.warn("[security] No se pudo cachear el rol verificado", { motivo: codigoErrorCorto(e) });
        }
      }
    }

    if (rol === "usuario") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/403";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("reason", "rol_usuario");
      const redirectResponse = NextResponse.redirect(redirectUrl);
      if (valorCookieRol) {
        redirectResponse.cookies.set(COOKIE_ROL_APP, valorCookieRol, opcionesCookieRolApp());
      }
      return applyCspHeaders(redirectResponse, nonce);
    }
  }

  if (user && esRutaAuth) {
    return applyCspHeaders(NextResponse.redirect(new URL("/panel", request.url)), nonce);
  }

  return applyCspHeaders(response, nonce);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|theme-init\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|json|txt|webmanifest)$).*)"]
};
