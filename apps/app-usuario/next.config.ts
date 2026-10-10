import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import {
  headersSeguridadEstaticos,
  IMAGES_REMOTE_PATTERNS,
  IMAGE_FORMATS,
} from "./src/lib/csp";

const nextConfig: NextConfig = {
  transpilePackages: ["@ruum/shared", "@ruum/ui", "@ruum/api"],
  typescript: { ignoreBuildErrors: false },
  // No filtrar la tecnología del servidor.
  poweredByHeader: false,
  // Con rutas inconsistentes (/mis-Traslados vs /mis-viajes) Next normalizaba en
  // silencio con un 308; con caseSensitiveRoutes el error aparece ruidoso en dev.
  experimental: {
    caseSensitiveRoutes: true,
    optimizePackageImports: ["@ruum/ui", "@ruum/shared"]
  },
  images: {
    remotePatterns: [...IMAGES_REMOTE_PATTERNS],
    formats: [...IMAGE_FORMATS],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    /* ARQ-4 (auditoría fase 4): aquí se emitía una CSP estática SIN nonce
       mientras src/middleware.ts emitía la canónica CON nonce. El navegador
       aplica la intersección de ambas cabeceras, y en producción la estática
       (`script-src 'self' 'strict-dynamic'`, sin nonce) hace que CSP3 ignore
       'self' y no quede ningún origen válido: el bundle de Next queda bloqueado.
       Ver src/app/auth/callback/route.ts, que ya pasó por este bug.

       El middleware es la única fuente de verdad de la CSP (genera el nonce por
       request). Aquí solo se.headers defensivos que no dependen de nonce. */
    /* M16: fuente única (lib/csp) — el middleware emite los mismos valores y
       los sobrescribe con .set(). Aquí solo headers que no dependen de nonce;
       ver ARQ-4: jamás una CSP estática. */
    const headersList = headersSeguridadEstaticos(isProd);

    return [
      {
        source: "/(.*)",
        headers: headersList
      }
    ];
  }
};

// A3: withSentryConfig inyecta sentry.client.config.ts en el bundle del
// navegador y sentry.server.config.ts en el servidor. Sin este wrapper los
// archivos de config existían pero nunca se cargaban en el cliente: todos los
// Sentry.captureException / breadcrumbs eran no-ops silenciosos.
// Sin DSN el SDK es no-op; silent:true evita ruido en el build.
export default withSentryConfig(nextConfig, { silent: true });
