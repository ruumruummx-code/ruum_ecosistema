import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import {
  buildCspEstatico,
  CSP_PRESETS,
  HSTS_HEADER,
  IMAGES_REMOTE_PATTERNS,
  IMAGE_FORMATS,
  PERMISSIONS_POLICY,
} from "@ruum/shared/seguridad";

const canUploadSourcemaps = Boolean(
  process.env.SENTRY_UPLOAD_SOURCE_MAPS === "true" &&
    process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
);

const nextConfig: NextConfig = {
  // Los mapas se suben a Sentry durante el build y se eliminan del artefacto.
  // No publicar source maps legibles desde el servidor.
  productionBrowserSourceMaps: canUploadSourcemaps,
  transpilePackages: ["@ruum/shared", "@ruum/ui", "@ruum/api"],
  images: {
    remotePatterns: [...IMAGES_REMOTE_PATTERNS],
    formats: [...IMAGE_FORMATS],
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256]
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@ruum/ui", "@ruum/shared"],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const isStaging = process.env.NEXT_PUBLIC_RUUM_AMBIENTE === "staging";
    // ARQ-4: la CSP con nonce la emite exclusivamente src/middleware.ts.
    // Emitir aquí una CSP estática (sin nonce) rompe el bundle en producción.
    // La política estática solo se conserva para Report-Only en staging.
    const cspProd = buildCspEstatico(true, CSP_PRESETS.conductor);
    // cspDev mantiene unsafe-inline/unsafe-eval para HMR (solo non-prod)
    const cspDev = buildCspEstatico(false, CSP_PRESETS.conductor);
    const csp = isProd ? cspProd : cspDev;
    const headersForAll: Array<{ key: string; value: string }> = [
      { key: "Strict-Transport-Security", value: HSTS_HEADER },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
    ];
    // Report-Only en staging para validar sin romper
    if (isStaging) {
      headersForAll.push({
        key: "Content-Security-Policy-Report-Only",
        value: csp + "; report-uri /api/csp-report; report-to csp-endpoint"
      });
    }
    return [
      {
        source: "/imagenes/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: headersForAll
      }
    ];
  }
};

// PERF-002 — Bundle analyzer opcional (no rompe build si no está instalado).
// Usar `pnpm dlx @next/bundle-analyzer` o `ANALYZE=true pnpm build` tras `pnpm add -D @next/bundle-analyzer`.
// Ver package.json script `analyze`.
// A3: withSentryConfig inyecta instrumentation-client.ts en el bundle del
// navegador y sentry.server.config.ts en el servidor. Sin este wrapper los
// archivos de config existían pero nunca se cargaban en el cliente.
// Sin DSN el SDK es no-op; silent:true evita ruido en el build.
const sentryRelease = process.env.SENTRY_RELEASE ||
  `ruum-conductor@${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}`;
export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release: { name: sentryRelease, create: true, finalize: true },
  sourcemaps: {
    // Dev/CI sin credenciales puede compilar sin publicar artefactos incompletos.
    disable: !canUploadSourcemaps,
    deleteSourcemapsAfterUpload: true,
  },
});
