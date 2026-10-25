import { NextRequest, NextResponse } from "next/server";
import { logStructuredWarn } from "./logger";

export const COOKIE_CSRF_USUARIO = "ruum_csrf_token";
export const HEADER_CSRF_TOKEN = "x-csrf-token";

const METODOS_MUTACION = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RUTAS_EXENTAS_CSRF = new Set(["/api/csp-report"]);
const PATRON_TOKEN_CSRF = /^[a-f0-9]{32,128}$/i;

export type MotivoRechazoCsrf =
  | "cross_site_fetch"
  | "origin_mismatch"
  | "referer_mismatch"
  | "token_missing"
  | "cookie_missing"
  | "token_invalid"
  | "token_mismatch";

export interface ResultadoValidacionCsrf {
  valido: boolean;
  motivo?: MotivoRechazoCsrf;
  error?: string;
}

export interface OpcionesValidacionCsrf {
  /**
   * Cuando es `true`, exige siempre que estén presentes tanto la cookie
   * `ruum_csrf_token` como el header `x-csrf-token` y que coincidan.
   * Cuando es `false` o no se especifica, aplica validación estricta siempre
   * que exista la cookie CSRF, el header CSRF, o `CSRF_STRICT=true`.
   */
  exigirToken?: boolean;
}

/**
 * Determina si el método HTTP corresponde a una mutación de estado.
 */
export function esMetodoMutacion(metodo: string): boolean {
  return METODOS_MUTACION.has(metodo.toUpperCase());
}

/**
 * Determina si una ruta está exenta de validación CSRF (ej. reportes CSP del navegador).
 */
export function esRutaExentaCsrf(pathname: string): boolean {
  return RUTAS_EXENTAS_CSRF.has(pathname);
}

/**
 * Genera un token CSRF criptográficamente aleatorio (32 bytes = 64 caracteres hex).
 * Compatible con Edge Runtime, Node.js y navegador vía Web Crypto API.
 */
export function generarTokenCsrf(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifica que el token tenga el formato hexadecimal esperado (32 a 128 chars hex).
 */
export function esFormatoTokenCsrfValido(token: string | null | undefined): token is string {
  if (typeof token !== "string") return false;
  return PATRON_TOKEN_CSRF.test(token.trim());
}

/**
 * Comparación en tiempo constante compatible con Edge Runtime y Node.js.
 */
export function compararTiempoConstante(a: string, b: string): boolean {
  const strA = a.trim();
  const strB = b.trim();
  if (strA.length !== strB.length || strA.length === 0) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < strA.length; i++) {
    diff |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifica si un par cookie/header CSRF es válido.
 */
export function verificarParTokenCsrf(
  cookieToken: string | null | undefined,
  headerToken: string | null | undefined
): ResultadoValidacionCsrf {
  const cToken = cookieToken?.trim() ?? "";
  const hToken = headerToken?.trim() ?? "";

  if (!cToken) {
    return {
      valido: false,
      motivo: "cookie_missing",
      error: "Token CSRF inválido o ausente.",
    };
  }
  if (!hToken) {
    return {
      valido: false,
      motivo: "token_missing",
      error: "Token CSRF inválido o ausente.",
    };
  }
  if (!esFormatoTokenCsrfValido(cToken) || !esFormatoTokenCsrfValido(hToken)) {
    return {
      valido: false,
      motivo: "token_invalid",
      error: "Formato de token CSRF inválido.",
    };
  }
  if (!compararTiempoConstante(cToken, hToken)) {
    return {
      valido: false,
      motivo: "token_mismatch",
      error: "Token CSRF no coincide.",
    };
  }
  return { valido: true };
}

/**
 * Valida la protección CSRF en peticiones que mutan estado (POST, PUT, PATCH, DELETE):
 * 1. Rechaza peticiones con `Sec-Fetch-Site: cross-site`.
 * 2. Verifica que `Origin` o `Referer` (cuando están presentes) coincidan con el origen del request.
 * 3. Verifica el token Double-Submit (`ruum_csrf_token` cookie === `x-csrf-token` header)
 *    en tiempo constante.
 */
export function validarCsrfRequest(
  request: NextRequest,
  opciones: OpcionesValidacionCsrf = {}
): ResultadoValidacionCsrf {
  if (!esMetodoMutacion(request.method)) {
    return { valido: true };
  }

  const pathname = request.nextUrl?.pathname ?? "";
  if (esRutaExentaCsrf(pathname)) {
    return { valido: true };
  }

  // 1. Fetch Metadata: bloquear solicitudes cross-site iniciadas por navegador
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") {
    return {
      valido: false,
      motivo: "cross_site_fetch",
      error: "Solicitud cross-site bloqueada por protección CSRF.",
    };
  }

  // 2. Validación de Origin / Referer cuando el cliente los envía
  const origenEsperado = request.nextUrl.origin;
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    if (originHeader !== origenEsperado) {
      return {
        valido: false,
        motivo: "origin_mismatch",
        error: "Origen no permitido por protección CSRF.",
      };
    }
  } else {
    const refererHeader = request.headers.get("referer");
    if (refererHeader) {
      try {
        if (new URL(refererHeader).origin !== origenEsperado) {
          return {
            valido: false,
            motivo: "referer_mismatch",
            error: "Referer no permitido por protección CSRF.",
          };
        }
      } catch {
        return {
          valido: false,
          motivo: "referer_mismatch",
          error: "Referer inválido en validación CSRF.",
        };
      }
    }
  }

  // 3. Validación de token Double-Submit (cookie + header x-csrf-token)
  const cookieToken = request.cookies?.get?.(COOKIE_CSRF_USUARIO)?.value?.trim();
  const headerToken = request.headers.get(HEADER_CSRF_TOKEN)?.trim();
  const exigirPorEntorno = process.env.CSRF_STRICT === "true";
  const debeValidarToken =
    Boolean(opciones.exigirToken) ||
    exigirPorEntorno ||
    Boolean(cookieToken) ||
    Boolean(headerToken);

  if (debeValidarToken) {
    return verificarParTokenCsrf(cookieToken, headerToken);
  }

  return { valido: true };
}

/**
 * Helper para Route Handlers y Middleware: si la petición de mutación no pasa
 * la validación CSRF, registra un warning estructurado y devuelve una respuesta 403.
 * Si pasa, devuelve `null`.
 */
export function verificarCsrfORechazar(
  request: NextRequest,
  opciones: OpcionesValidacionCsrf = {}
): NextResponse | null {
  const resultado = validarCsrfRequest(request, opciones);
  if (resultado.valido) {
    return null;
  }

  logStructuredWarn("csrf", "csrf_validation_failed", resultado.error ?? "Token CSRF inválido", {
    path: request.nextUrl?.pathname ?? "unknown",
    method: request.method,
    motivo: resultado.motivo ?? "unknown",
  });

  return NextResponse.json(
    {
      error: resultado.error ?? "Token CSRF inválido o ausente.",
      code: "CSRF_INVALID",
    },
    {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

/**
 * Asegura que la respuesta incluya una cookie `ruum_csrf_token` válida y la
 * exponga también en el header `x-csrf-token` para clientes del mismo origen.
 */
export function asegurarCookieCsrf(
  request: NextRequest,
  response: NextResponse
): string {
  const existente = request.cookies?.get?.(COOKIE_CSRF_USUARIO)?.value?.trim();
  const token = esFormatoTokenCsrfValido(existente) ? existente : generarTokenCsrf();

  if (!esFormatoTokenCsrfValido(existente)) {
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set(COOKIE_CSRF_USUARIO, token, {
      httpOnly: false, // Necesario para estrategia Double-Submit desde cliente same-origin
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 12, // 12 horas
    });
  }

  response.headers.set(HEADER_CSRF_TOKEN, token);
  return token;
}

/**
 * Obtiene el token CSRF actual desde `document.cookie` en el navegador.
 */
export function obtenerTokenCsrfCliente(): string | null {
  if (typeof document === "undefined" || typeof document.cookie !== "string") {
    return null;
  }
  const cookies = document.cookie.split(";");
  for (const raw of cookies) {
    const [nombre, ...resto] = raw.trim().split("=");
    if (nombre === COOKIE_CSRF_USUARIO) {
      const valor = decodeURIComponent(resto.join("=")).trim();
      return esFormatoTokenCsrfValido(valor) ? valor : null;
    }
  }
  return null;
}

/**
 * Asegura que exista un token CSRF válido en el cliente. Si no se encuentra
 * en document.cookie, consulta `/api/csrf` para emitirlo.
 */
export async function asegurarTokenCsrfCliente(): Promise<string | null> {
  const token = obtenerTokenCsrfCliente();
  if (token) return token;

  // En entorno de pruebas (Vitest/jsdom), no interferir con mocks de fetch existentes
  if (typeof window === "undefined" || process.env.VITEST) return null;

  try {
    const res = await fetch("/api/csrf", { method: "GET", cache: "no-store" });
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as { csrfToken?: string } | null;
      if (data?.csrfToken && esFormatoTokenCsrfValido(data.csrfToken)) {
        return data.csrfToken;
      }
    }
  } catch {
    // ignore
  }
  return obtenerTokenCsrfCliente();
}

/**
 * Construye las cabeceras para peticiones `fetch` que mutan estado,
 * inyectando `x-csrf-token` cuando la cookie CSRF está presente en el navegador.
 */
export function obtenerHeadersCsrf(
  headersBase: Record<string, string> = {}
): Record<string, string> {
  const token = obtenerTokenCsrfCliente();
  if (!token) {
    return { ...headersBase };
  }
  return {
    ...headersBase,
    [HEADER_CSRF_TOKEN]: token,
  };
}

/**
 * Construye las cabeceras para peticiones `fetch` que mutan estado,
 * asegurando la presencia del token CSRF (obteniéndolo de `/api/csrf` si aún no existe en cookies).
 */
export async function obtenerHeadersCsrfAsync(
  headersBase: Record<string, string> = {}
): Promise<Record<string, string>> {
  const token = await asegurarTokenCsrfCliente();
  if (!token) {
    return { ...headersBase };
  }
  return {
    ...headersBase,
    [HEADER_CSRF_TOKEN]: token,
  };
}
