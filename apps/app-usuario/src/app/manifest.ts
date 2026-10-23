import type { MetadataRoute } from "next";

/**
 * Web App Manifest (PWA) optimizado para instalación móvil y tiendas (TWA / Play Store / App Store).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Ruum Ruum — Traslado Seguro de Vehículos",
    short_name: "Ruum Ruum",
    description:
      "Seguridad, evidencia y trazabilidad en cada traslado vehicular by MoviliaX.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#070b14",
    theme_color: "#08182E",
    lang: "es-MX",
    dir: "ltr",
    categories: ["transportation", "navigation", "business", "utilities"],
    prefer_related_applications: false,
    related_applications: [
      {
        platform: "play",
        url: "https://play.google.com/store/apps/details?id=com.moviliax.ruumruum.usuario",
        id: "com.moviliax.ruumruum.usuario",
      },
      {
        platform: "itunes",
        url: "https://apps.apple.com/mx/app/ruum-ruum/id6730000000",
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Solicitar traslado",
        short_name: "Nuevo traslado",
        description: "Cotizar y programar un nuevo traslado vehicular",
        url: "/viajes/nuevo",
      },
      {
        name: "Mis traslados",
        short_name: "Traslados",
        description: "Consultar el estado y seguimiento de tus traslados",
        url: "/mis-viajes",
      },
      {
        name: "Pasaporte Digital",
        short_name: "Pasaporte",
        description: "Evidencia, custodia y bitácora del vehículo",
        url: "/pasaporte",
      },
    ],
  };
}
