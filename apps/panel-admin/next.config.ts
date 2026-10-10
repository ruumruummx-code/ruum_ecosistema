import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import {
  buildCspEstaticoPanel,
  HSTS_HEADER,
  PERMISSIONS_POLICY,
  IMAGES_REMOTE_PATTERNS,
  IMAGE_FORMATS,
} from "./src/lib/csp";

const nextConfig: NextConfig = {
  transpilePackages: ["@ruum/shared", "@ruum/ui", "@ruum/api"],
  outputFileTracingIncludes: {
    "/api/plantillas/viajes-masivos": ["./public/data/codigos-postales/**/*.json"],
    "/api/codigos-postales/[prefijo]": ["./public/data/codigos-postales/**/*.json"]
  },
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [...IMAGES_REMOTE_PATTERNS],
    formats: [...IMAGE_FORMATS],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    // Fuente única @ruum/shared/seguridad vía ./src/lib/csp.
    // next.config es fallback estático; src/middleware.ts es autoritativo (nonce).
    // SEC-002: prod sin 'unsafe-inline'/'unsafe-eval' en script-src.
    const csp = buildCspEstaticoPanel(isProd);
    const headersList: { key: string; value: string }[] = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: PERMISSIONS_POLICY }
    ];
    if (isProd) {
      headersList.push({ key: "Strict-Transport-Security", value: HSTS_HEADER });
    }
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
// archivos de config existían pero nunca se cargaban en el cliente.
// Sin DSN el SDK es no-op; silent:true evita ruido en el build.
export default withSentryConfig(nextConfig, { silent: true });
