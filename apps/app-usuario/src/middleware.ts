import { type NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@ruum/api/supabase";
import { buildCspUsuario as buildCspUsuarioCanonica, HSTS_HEADER, PERMISSIONS_POLICY } from "./lib/csp";

/**
 * P1 Hardening: CSP + HSTS + Control de Sesión para app-usuario
 * 1. Generación de nonce por request con 'strict-dynamic' en producción.
 * 2. HSTS (Strict-Transport-Security) en producción.
 * 3. Report-Only en staging (/api/csp-report) para migración progresiva sin bloqueo intempestivo.
 * 4. Preservación explícita de excepciones para Stripe Elements, Didit, Mapbox, Supabase y Capacitor móvil.
 * 5. Refresco de sesión y protección de rutas autenticadas.
 * Fuente canónica: src/lib/csp.ts
 */

/* CORRECCIÓN (auditoría A-3): la ruta real es "/mis-viajes" (minúsculas). Con
   "/mis-Traslados" el predicado nunca casaba y los visitantes anónimos llegaban a
   la pantalla de traslados sin redirect a /login. */
const RUTAS_PROTEGIDAS_USUARIO = [
  "/viajes",
  "/mis-viajes",
  "/cuenta",
  "/pasaporte",
  "/verificacion",
  "/soporte",
  "/onboarding"
];

function esRutaProtegidaUsuario(pathname: string): boolean {
  return RUTAS_PROTEGIDAS_USUARIO.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );
}

/** Rutas cuyo render depende de quién esté conectado. */
const RUTAS_DEPENDIENTES_DE_SESION = new Set<string>([
  "/login",
  "/registro",
  "/cuenta",
  "/pasaporte",
  "/verificacion",
  "/soporte",
  "/onboarding",
  "/mis-viajes",
  "/viajes"
]);

function RUTAS_NECESITAN_SESION(pathname: string): boolean {
  return (
    esRutaProtegidaUsuario(pathname) ||
    [...RUTAS_DEPENDIENTES_DE_SESION].some(
      (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
    )
  );
}

export function buildCspUsuario(nonce: string, isProd: boolean, isStaging: boolean): string {
  return buildCspUsuarioCanonica(nonce, isProd, isStaging);
}

export function applySecurityHeadersUsuario(res: NextResponse, nonce: string): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const isStaging = process.env.NEXT_PUBLIC_RUUM_AMBIENTE === "staging" || process.env.CSP_REPORT_ONLY === "true" || process.env.NEXT_PUBLIC_CSP_REPORT_ONLY === "true";
  const csp = buildCspUsuario(nonce, isProd, isStaging);

  // Progressive CSP: En staging o Report-Only, emitir Content-Security-Policy-Report-Only
  if (isStaging) {
    res.headers.set("Content-Security-Policy-Report-Only", csp + "; report-uri /api/csp-report; report-to csp-endpoint");
    res.headers.set("Content-Security-Policy", buildCspUsuario(nonce, false, isStaging));
  } else {
    res.headers.set("Content-Security-Policy", csp);
  }

  res.headers.set("x-nonce", nonce);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", PERMISSIONS_POLICY);

  if (isProd) {
    res.headers.set("Strict-Transport-Security", HSTS_HEADER);
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
    console.error("[security] app-usuario bloqueado: Supabase no configurado en producción", {
      pathname: request.nextUrl.pathname
    });
    return applySecurityHeadersUsuario(new NextResponse("Configuración de producción incompleta", { status: 503 }), nonce);
  }

  if (!url || !anonKey) {
    return applySecurityHeadersUsuario(response, nonce);
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

  /* CORRECCIÓN (auditoría S-5): getUser() es un round-trip a GoTrue por request.
     Antes se ejecutaba para CADA request, incluidos los ~200 catálogos postales
     JSON estáticos (98 × 2 copias en public/), lo que permitía agotar el rate
     limit de Supabase Auth con peticiones estáticas. Solo hace falta cuando la
     ruta depende de la sesión. */
  if (!RUTAS_NECESITAN_SESION(pathname)) {
    return applySecurityHeadersUsuario(response, nonce);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && esRutaProtegidaUsuario(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", pathname);
    login.searchParams.set("reason", "authentication_required");
    return applySecurityHeadersUsuario(NextResponse.redirect(login), nonce);
  }

  if (user && (pathname === "/login" || pathname === "/registro")) {
    return applySecurityHeadersUsuario(NextResponse.redirect(new URL("/", request.url)), nonce);
  }

  return applySecurityHeadersUsuario(response, nonce);
}

/* CORRECCIÓN (auditoría S-5): se excluyen también json/xml/txt/ico/woff para que los
   assets estáticos no atraviesen el middleware. */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|xml|txt|ico|woff2?|map)$).*)"
  ]
};
