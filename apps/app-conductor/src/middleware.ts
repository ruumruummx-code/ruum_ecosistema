import { type NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@ruum/api/supabase";
import { buildCsp, CSP_PRESETS } from "@ruum/shared/seguridad";

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

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esPublica = esRutaPublicaConductor(pathname);
  const esRutaAuth = pathname === "/login" || pathname === "/onboarding";

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
    // Gate de rol: verificar que un pasajero/usuario no opere en la app conductor
    try {
      const { clasificarRolApp } = await import("@ruum/api/identity");
      const rol = await clasificarRolApp(supabase, user.id);
      if (rol === "usuario") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/403";
        redirectUrl.search = "";
        redirectUrl.searchParams.set("reason", "rol_usuario");
        return applyCspHeaders(NextResponse.redirect(redirectUrl), nonce);
      }
    } catch (e) {
      // Si falla la verificación (red, etc.), se permite continuar; RLS en Supabase sigue protegiendo mutaciones
      console.error("[security] Error al clasificar rol en middleware:", e);
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
