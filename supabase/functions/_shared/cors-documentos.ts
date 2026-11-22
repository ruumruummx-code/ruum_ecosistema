// Cabeceras CORS restrictivas para endpoints de Edge Functions y PII (RUUM-SEC-011 / F1.3)
// Prohíbe terminantemente el uso de comodín "*" para mitigar fugas cross-origin.

const ORIGENES_AUTORIZADOS_BASE = [
  "https://ruum.mx",
  "https://app.ruum.mx",
  "https://admin.ruum.mx",
  "https://conductor.ruum.mx",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
];

export function esOrigenPermitido(originHeader: string | null): boolean {
  if (!originHeader) return false;
  let envOrigins = "";
  try {
    if (typeof Deno !== "undefined" && typeof Deno.env?.get === "function") {
      envOrigins = Deno.env.get("ALLOWED_ORIGINS") ?? "";
    } else if (typeof globalThis !== "undefined" && "process" in globalThis) {
      const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
      envOrigins = proc?.env?.ALLOWED_ORIGINS ?? "";
    }
  } catch {
    envOrigins = "";
  }
  const listaEnv = envOrigins.split(",").map((o: string) => o.trim().toLowerCase()).filter(Boolean);
  const permitidos = new Set([...ORIGENES_AUTORIZADOS_BASE.map(o => o.toLowerCase()), ...listaEnv]);

  const origenLimpio = originHeader.trim().toLowerCase();
  return (
    permitidos.has(origenLimpio) ||
    /^https:\/\/ruum-[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/.test(origenLimpio) ||
    /^https:\/\/[a-z0-9-]+\.ruum\.mx$/.test(origenLimpio) ||
    // Dominio operativo actual de las apps (usuario, www.usuario, conductor, admin…).
    /^https:\/\/([a-z0-9-]+\.)*ruumruum-moviliax\.online$/.test(origenLimpio)
  );
}

export function resolverOrigenPermitido(originHeader: string | null): string {
  if (!originHeader) return "https://ruum.mx";
  if (esOrigenPermitido(originHeader)) {
    return originHeader.trim();
  }
  // Fallback seguro: dominio canónico de producción (nunca "*")
  return "https://ruum.mx";
}

export function construirCabecerasCors(req?: Request | { headers: Headers }): Record<string, string> {
  const originHeader = req ? req.headers.get("Origin") : null;
  const origin = resolverOrigenPermitido(originHeader);
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": [
      "authorization", "apikey", "content-type", "x-client-info", "x-region",
      "x-supabase-api-version", "x-supabase-client-platform",
      "x-supabase-client-platform-version", "x-supabase-client-version",
      "x-supabase-client-runtime", "x-supabase-client-runtime-version",
      "x-signature", "x-signature-v2", "x-signature-simple", "x-timestamp",
      "sentry-trace", "baggage",
    ].join(", "),
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

/**
 * Validador de origen CORS.
 * Si el request tiene cabecera `Origin` y no pertenece al allowlist, rechaza con 403 Forbidden.
 * Si es una petición OPTIONS preflight de un origen válido, devuelve 204 con cabeceras CORS.
 * Retorna `Response` si la petición debe terminar aquí, o `null` si puede continuar.
 */
export function manejarCors(req: Request): Response | null {
  const origin = req.headers.get("Origin");
  if (origin && !esOrigenPermitido(origin)) {
    return new Response(
      JSON.stringify({ error: "Origen no permitido por política CORS." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: construirCabecerasCors(req)
    });
  }

  return null;
}

// Export estático seguro para compatibilidad regresiva
export const CORS_DOCUMENTOS = construirCabecerasCors();
