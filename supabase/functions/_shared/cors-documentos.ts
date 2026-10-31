// Incluye las cabeceras del SDK y de observabilidad que pueden acompañar
// cargas multipart. La autorización de usuario se valida después del preflight.
export const CORS_DOCUMENTOS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": [
    "authorization", "apikey", "content-type", "x-client-info", "x-region",
    "x-supabase-api-version", "x-supabase-client-platform",
    "x-supabase-client-platform-version", "x-supabase-client-version",
    "x-supabase-client-runtime", "x-supabase-client-runtime-version",
    "sentry-trace", "baggage",
  ].join(", "),
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "600",
};
