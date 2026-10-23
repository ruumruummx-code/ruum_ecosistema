/**
 * Integración PWA y Capacitor optimizada para tiendas (Google Play Store y Apple App Store).
 * Preserva el re-export `esNativo` desde `@ruum/api/capacitor` y añade utilidades
 * de detección de entorno instalado (PWA standalone / shell nativo), validación
 * segura de Deep Links / App Links y registro de Service Worker.
 */
import { esNativo, plataformaActual } from "@ruum/api/capacitor";
import { logStructuredWarn } from "./logger";

export { esNativo, plataformaActual };

export const APP_ID_TIENDA_USUARIO = "com.moviliax.ruumruum.usuario";
export const ESQUEMA_DEEPLINK_USUARIO = "ruumusuario";
export const DOMINIO_PRODUCCION_USUARIO = "usuario.ruumruum-moviliax.online";

const RUTAS_DEEPLINK_PERMITIDAS = [
  "/",
  "/auth/callback",
  "/viajes",
  "/mis-viajes",
  "/pasaporte",
  "/verificacion",
  "/cuenta",
  "/soporte",
  "/nueva-password",
  "/login",
  "/registro",
];

export interface ContextoTiendaUsuario {
  esNativo: boolean;
  plataforma: "ios" | "android" | "web";
  esPwaStandalone: boolean;
  instaladaEnDispositivo: boolean;
  appId: string;
  esquemaDeepLink: string;
}

/**
 * Detecta si la aplicación se ejecuta como PWA instalada en pantalla de inicio
 * (`display-mode: standalone` o `navigator.standalone` en iOS Safari).
 */
export function esModoStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const standaloneIos = Boolean(
      (window.navigator as Navigator & { standalone?: boolean })?.standalone
    );
    const standaloneMedia =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches;
    return standaloneIos || standaloneMedia;
  } catch {
    return false;
  }
}

/**
 * Obtiene el contexto de ejecución unificado (Web, PWA instalada o Capacitor iOS/Android).
 */
export function obtenerContextoTienda(): ContextoTiendaUsuario {
  const nativo = esNativo();
  const plataforma = plataformaActual();
  const pwaStandalone = esModoStandalonePwa();

  return {
    esNativo: nativo,
    plataforma,
    esPwaStandalone: pwaStandalone,
    instaladaEnDispositivo: nativo || pwaStandalone,
    appId: APP_ID_TIENDA_USUARIO,
    esquemaDeepLink: ESQUEMA_DEEPLINK_USUARIO,
  };
}

function esRutaInternaPermitida(pathname: string): boolean {
  return RUTAS_DEEPLINK_PERMITIDAS.some(
    (base) =>
      base === "/"
        ? pathname === "/"
        : pathname === base || pathname.startsWith(`${base}/`)
  );
}

/**
 * Resuelve y sanitiza una URL entrante de Deep Link (`ruumusuario://viajes/123`)
 * o Universal/App Link (`https://usuario.ruumruum-moviliax.online/viajes/123?tab=pago`)
 * hacia una ruta interna segura de Next.js. Rechaza dominios externos o intentos de Open Redirect.
 */
export function resolverRutaDeepLink(urlEntrante: string | null | undefined): string | null {
  if (!urlEntrante || typeof urlEntrante !== "string") return null;
  const limpia = urlEntrante.trim();
  if (!limpia || limpia.startsWith("//") || limpia.includes("\\")) return null;

  try {
    // Caso 1: ruta relativa directa ("/viajes/nuevo")
    if (limpia.startsWith("/")) {
      const parsed = new URL(limpia, `https://${DOMINIO_PRODUCCION_USUARIO}`);
      if (!esRutaInternaPermitida(parsed.pathname)) return null;
      return `${parsed.pathname}${parsed.search}`;
    }

    const parsed = new URL(limpia);
    const protocolo = parsed.protocol.toLowerCase();

    // Caso 2: esquema nativo personalizado (ruumusuario://viajes/123 o ruumusuario:///viajes/123)
    if (protocolo === `${ESQUEMA_DEEPLINK_USUARIO}:`) {
      const segmentoHost = parsed.hostname ? `/${parsed.hostname}` : "";
      const rutaCombinada = `${segmentoHost}${parsed.pathname}`.replace(/\/+/g, "/") || "/";
      if (!esRutaInternaPermitida(rutaCombinada)) return null;
      return `${rutaCombinada}${parsed.search}`;
    }

    // Caso 3: Universal Link / App Link HTTPS del dominio oficial
    if (protocolo === "https:" || protocolo === "http:") {
      const host = parsed.hostname.toLowerCase();
      const esHostPermitido =
        host === DOMINIO_PRODUCCION_USUARIO ||
        host.endsWith(".ruumruum-moviliax.online") ||
        host === "localhost" ||
        host === "127.0.0.1";
      if (!esHostPermitido) return null;
      if (!esRutaInternaPermitida(parsed.pathname)) return null;
      return `${parsed.pathname}${parsed.search}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Registra el Service Worker (`/sw.js`) únicamente en navegadores web/PWA.
 * En el shell nativo de Capacitor se omite porque `cap-shell/index.html`
 * gestiona directamente el estado offline de la WebView.
 */
export async function registrarServiceWorkerPwa(): Promise<boolean> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  if (esNativo()) {
    return false;
  }
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return true;
  } catch (err) {
    logStructuredWarn("pwa", "service_worker_registro_fallido", err);
    return false;
  }
}
