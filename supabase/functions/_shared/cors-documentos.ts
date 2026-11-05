// Cabeceras CORS restrictivas para endpoints de documentos y PII (RUUM-USR-F13-001 / CB-2)
// Prohíbe terminantemente el uso de comodín "*" para mitigar fugas de PII cross-origin.

const ORIGENES_AUTORIZADOS_BASE = [
  "https://ruum.mx",
  "https://app.ruum.mx",
  "https://admin.ruum.mx",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

export function resolverOrigenPermitido(originHeader: string | null): string {
  if (!originHeader) return "https://ruum.mx";
  
  const envOrigins = (typeof Deno !== "undefined" ? Deno.env.get("ALLOWED_ORIGINS") : process.env.ALLOWED_ORIGINS) ?? "";
  const listaEnv = envOrigins.split(",").map(o => o.trim().toLowerCase()).filter(Boolean);
  const permitidos = new Set([...ORIGENES_AUTORIZADOS_BASE.map(o => o.toLowerCase()), ...listaEnv]);

  const origenLimpio = originHeader.trim().toLowerCase();
  if (
    permitidos.has(origenLimpio) ||
    /^https:\/\/ruum-[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/.test(origenLimpio) ||
    /^https:\/\/[a-z0-9-]+\.ruum\.mx$/.test(origenLimpio)
  ) {
    return originHeader.trim();
  }

  // Fallback seguro: dominio canónico de producción (nunca "*")
  return "https://ruum.mx";
}

export function construirCabecerasCors(req?: Request | { headers: Headers }): Record<string, string> {
  const origin = req ? resolverOrigenPermitido(req.headers.get("Origin")) : "https://ruum.mx";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": [
      "authorization", "apikey", "content-type", "x-client-info", "x-region",
      "x-supabase-api-version", "x-supabase-client-platform",
      "x-supabase-client-platform-version", "x-supabase-client-version",
      "x-supabase-client-runtime", "x-supabase-client-runtime-version",
      "sentry-trace", "baggage",
    ].join(", "),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

// Export estático seguro para compatibilidad regresiva (usando el origen base en vez de '*')
export const CORS_DOCUMENTOS = construirCabecerasCors();
