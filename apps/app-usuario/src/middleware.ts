import { type NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@ruum/api/supabase";
import { buildCspUsuario as buildCspUsuarioCanonica, headersSeguridadEstaticos, cabeceraReportToCsp, sufijoReporteCsp } from "./lib/csp";

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
/* M6: "/onboarding" sale de la lista protegida. Es una intro pre-auth (sus
   CTAs apuntan a /login y /registro y nadie la enlazaba): exigir sesión la
   dejaba inalcanzable para su público — el usuario nuevo anónimo rebotaba a
   /login antes de verla. */
const RUTAS_PROTEGIDAS_USUARIO = [
  "/viajes",
  "/mis-viajes",
  "/cuenta",
  "/pasaporte",
  "/verificacion",
  "/soporte"
];

function esRutaProtegidaUsuario(pathname: string): boolean {
  return RUTAS_PROTEGIDAS_USUARIO.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );
}

/** Rutas cuyo render depende de quién esté conectado. */
/* M6: "/onboarding" tampoco pertenece aquí: su render (contenido estático +
   localStorage) no depende de la sesión. Sacarlo evita el round-trip de
   getUser en cada visita anónima. */
const RUTAS_DEPENDIENTES_DE_SESION = new Set<string>([
  "/login",
  "/registro",
  "/cuenta",
  "/pasaporte",
  "/verificacion",
  "/soporte",
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

export function applySecurityHeadersUsuario(res: NextResponse, nonce: string, origen?: string): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const isStaging = process.env.NEXT_PUBLIC_RUUM_AMBIENTE === "staging" || process.env.CSP_REPORT_ONLY === "true" || process.env.NEXT_PUBLIC_CSP_REPORT_ONLY === "true";
  const csp = buildCspUsuario(nonce, isProd, isStaging);

  // Progressive CSP: En staging o Report-Only, emitir Content-Security-Policy-Report-Only
  /* M12: staging debe probar la CSP real. Antes la cabecera de bloqueo se
     generaba con isProd=false (script-src con 'unsafe-inline' 'unsafe-eval')
     mientras solo se REPORTABA la estricta: staging nunca ejercía la política
     de producción y un bloqueo real solo aparecía en prod. Ahora el bloqueo
     es siempre la política estricta; el Report-Only sigue informando. */
  if (isStaging) {
    res.headers.set("Content-Security-Policy-Report-Only", csp + sufijoReporteCsp());
    res.headers.set("Content-Security-Policy", buildCspUsuario(nonce, true, isStaging));
    // M13: definir el grupo `csp-endpoint` o la directiva report-to es no-op.
    if (origen) {
      const reportTo = cabeceraReportToCsp(origen);
      res.headers.set(reportTo.key, reportTo.value);
    }
  } else {
    res.headers.set("Content-Security-Policy", csp);
  }

  res.headers.set("x-nonce", nonce);
  // M16: fuente única (lib/csp) en vez de literales duplicados con next.config.
  for (const { key, value } of headersSeguridadEstaticos(isProd)) {
    res.headers.set(key, value);
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
    return applySecurityHeadersUsuario(new NextResponse("Configuración de producción incompleta", { status: 503 }), nonce, request.nextUrl.origin);
  }

  if (!url || !anonKey) {
    return applySecurityHeadersUsuario(response, nonce, request.nextUrl.origin);
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
    return applySecurityHeadersUsuario(response, nonce, request.nextUrl.origin);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && esRutaProtegidaUsuario(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", pathname);
    login.searchParams.set("reason", "authentication_required");
    return applySecurityHeadersUsuario(NextResponse.redirect(login), nonce, request.nextUrl.origin);
  }

  if (user && (pathname === "/login" || pathname === "/registro")) {
    return applySecurityHeadersUsuario(NextResponse.redirect(new URL("/", request.url)), nonce, request.nextUrl.origin);
  }

  return applySecurityHeadersUsuario(response, nonce, request.nextUrl.origin);
}

/* CORRECCIÓN (auditoría S-5): se excluyen también json/xml/txt/ico/woff para que los
   assets estáticos no atraviesen el middleware. */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|xml|txt|ico|woff2?|map)$).*)"
  ]
};
