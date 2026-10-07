import type { NextConfig } from "next";
import {
  HSTS_HEADER,
  PERMISSIONS_POLICY,
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
    const headersList: { key: string; value: string }[] = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: PERMISSIONS_POLICY }
    ];

    if (isProd) {
      headersList.push({
        key: "Strict-Transport-Security",
        value: HSTS_HEADER
      });
    }

    return [
      {
        source: "/(.*)",
        headers: headersList
      }
    ];
  }
};

export default nextConfig;
