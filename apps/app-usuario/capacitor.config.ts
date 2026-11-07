import type { CapacitorConfig } from "@capacitor/cli";

// Decisión de diseño: WebView remota al dominio de producción (ADR 002)
const URL_PRODUCCION = "https://usuario.ruumruum-moviliax.online";
const ES_PRODUCCION = process.env.NODE_ENV === "production";

const config: CapacitorConfig = {
  appId: "com.moviliax.ruumruum.usuario",
  appName: "Ruum Ruum",
  webDir: "cap-shell",
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
    cleartext: false,
    errorPath: "index.html",
    url: process.env.RUUM_CAPACITOR_SERVER_URL || URL_PRODUCCION,
    allowNavigation: [
      "*.ruumruum-moviliax.online",
      "usuario.ruumruum-moviliax.online",
      "*.supabase.co",
      "*.supabase.in",
      "verify.didit.me",
      "*.didit.me",
      "apx.didit.me",
      "js.stripe.com",
      "*.stripe.com",
      "*.stripe.network",
      "hooks.stripe.com",
      "*.mapbox.com",
      "api.mapbox.com",
      "events.mapbox.com"
    ]
  },
  android: {
    backgroundColor: "#070b14",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: !ES_PRODUCCION
  },
  ios: {
    backgroundColor: "#070b14",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    limitsNavigationsToAppBoundDomains: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#070b14",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
