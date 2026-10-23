import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const mockEsNativo = vi.fn(() => false);
const mockPlataformaActual = vi.fn((): "ios" | "android" | "web" => "web");

vi.mock("@ruum/api/capacitor", () => ({
  esNativo: () => mockEsNativo(),
  plataformaActual: () => mockPlataformaActual(),
}));

import manifest from "../app/manifest";
import capacitorConfig from "../../capacitor.config";
import {
  APP_ID_TIENDA_USUARIO,
  ESQUEMA_DEEPLINK_USUARIO,
  esModoStandalonePwa,
  obtenerContextoTienda,
  registrarServiceWorkerPwa,
  resolverRutaDeepLink,
} from "./capacitor";

describe("PWA y Capacitor optimizado para tiendas (manifest.ts, capacitor.config.ts, capacitor.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEsNativo.mockReturnValue(false);
    mockPlataformaActual.mockReturnValue("web");
  });

  describe("1. Web App Manifest (PWA) para instalación móvil y tiendas", () => {
    it("genera manifest completo con display standalone, iconos maskable, shortcuts y related_applications", () => {
      const m = manifest();
      expect(m.short_name).toBe("Ruum Ruum");
      expect(m.display).toBe("standalone");
      expect(m.orientation).toBe("portrait");
      expect(m.lang).toBe("es-MX");
      expect(m.background_color).toBe("#070b14");
      expect(m.theme_color).toBe("#08182E");

      expect(m.icons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ sizes: "192x192", purpose: "any" }),
          expect.objectContaining({ sizes: "512x512", purpose: "any" }),
          expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
        ])
      );

      expect(m.shortcuts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ url: "/viajes/nuevo" }),
          expect.objectContaining({ url: "/mis-viajes" }),
          expect.objectContaining({ url: "/pasaporte" }),
        ])
      );

      expect(m.related_applications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            platform: "play",
            id: APP_ID_TIENDA_USUARIO,
          }),
        ])
      );
    });
  });

  describe("2. Hardening de Capacitor Config, AndroidManifest, cap-shell y Service Worker", () => {
    it("configura Capacitor para Google Play y App Store sin cleartext ni mixed content y con fallback offline", () => {
      expect(capacitorConfig.appId).toBe("com.moviliax.ruumruum.usuario");
      expect(capacitorConfig.webDir).toBe("cap-shell");
      expect(capacitorConfig.server?.cleartext).toBe(false);
      expect(capacitorConfig.server?.errorPath).toBe("index.html");
      expect(capacitorConfig.android?.allowMixedContent).toBe(false);
      expect(capacitorConfig.ios?.limitsNavigationsToAppBoundDomains).toBe(true);
      expect(capacitorConfig.plugins?.SplashScreen?.launchAutoHide).toBe(true);
    });

    it("endurece AndroidManifest.xml (allowBackup=false, usesCleartextTraffic=false, App Links autoVerify)", () => {
      const rutaManifest = resolve(
        __dirname,
        "../../android/app/src/main/AndroidManifest.xml"
      );
      expect(existsSync(rutaManifest)).toBe(true);
      const xml = readFileSync(rutaManifest, "utf-8");

      expect(xml).toContain('android:allowBackup="false"');
      expect(xml).toContain('android:usesCleartextTraffic="false"');
      expect(xml).toContain('android:autoVerify="true"');
      expect(xml).toContain('android:host="usuario.ruumruum-moviliax.online"');
      expect(xml).toContain(`android:scheme="${ESQUEMA_DEEPLINK_USUARIO}"`);
    });

    it("verifica Service Worker PWA y pantalla offline cap-shell con reconexión automática", () => {
      const rutaSw = resolve(__dirname, "../../public/sw.js");
      const rutaCapShell = resolve(__dirname, "../../cap-shell/index.html");

      expect(existsSync(rutaSw)).toBe(true);
      expect(existsSync(rutaCapShell)).toBe(true);

      const swCode = readFileSync(rutaSw, "utf-8");
      expect(swCode).toContain('url.pathname.startsWith("/api/")');
      expect(swCode).toContain('url.pathname.startsWith("/auth/")');
      expect(swCode).toContain("stripe.com");
      expect(swCode).toContain("supabase.co");

      const shellHtml = readFileSync(rutaCapShell, "utf-8");
      expect(shellHtml).toContain("btn-reintentar");
      expect(shellHtml).toContain('window.addEventListener("online"');
    });
  });

  describe("3. Utilidades runtime de Deep Links, modo standalone y registro SW", () => {
    it("resuelve Deep Links nativos (ruumusuario://) y App Links oficiales bloqueando Open Redirects", () => {
      expect(resolverRutaDeepLink("ruumusuario://viajes/abc-123?tab=pago")).toBe(
        "/viajes/abc-123?tab=pago"
      );
      expect(
        resolverRutaDeepLink(
          "https://usuario.ruumruum-moviliax.online/auth/callback?code=xyz&next=%2F"
        )
      ).toBe("/auth/callback?code=xyz&next=%2F");
      expect(resolverRutaDeepLink("/mis-viajes")).toBe("/mis-viajes");

      // Bloqueo de orígenes maliciosos, esquemas peligrosos o rutas no autorizadas
      expect(resolverRutaDeepLink("https://evil.example.com/viajes/123")).toBeNull();
      expect(resolverRutaDeepLink("//evil.example.com/login")).toBeNull();
      expect(resolverRutaDeepLink("javascript:alert(1)")).toBeNull();
      expect(resolverRutaDeepLink("ruumusuario://admin-secreto")).toBeNull();
      expect(resolverRutaDeepLink(null)).toBeNull();
    });

    it("detecta contexto de tienda (Web, PWA standalone y Capacitor nativo)", () => {
      expect(esModoStandalonePwa()).toBe(false);
      expect(obtenerContextoTienda()).toEqual({
        esNativo: false,
        plataforma: "web",
        esPwaStandalone: false,
        instaladaEnDispositivo: false,
        appId: APP_ID_TIENDA_USUARIO,
        esquemaDeepLink: ESQUEMA_DEEPLINK_USUARIO,
      });

      mockEsNativo.mockReturnValue(true);
      mockPlataformaActual.mockReturnValue("android");
      const ctxNativo = obtenerContextoTienda();
      expect(ctxNativo.esNativo).toBe(true);
      expect(ctxNativo.plataforma).toBe("android");
      expect(ctxNativo.instaladaEnDispositivo).toBe(true);
    });

    it("registra el Service Worker en navegador web y lo omite dentro del shell nativo de Capacitor", async () => {
      const registerMock = vi.fn().mockResolvedValue({});

      try {
        vi.stubGlobal("window", {});
        vi.stubGlobal("navigator", {
          serviceWorker: { register: registerMock },
        });

        // En web: registra /sw.js
        mockEsNativo.mockReturnValue(false);
        expect(await registrarServiceWorkerPwa()).toBe(true);
        expect(registerMock).toHaveBeenCalledWith("/sw.js", { scope: "/" });

        // En Capacitor nativo: omite registro de SW
        registerMock.mockClear();
        mockEsNativo.mockReturnValue(true);
        expect(await registrarServiceWorkerPwa()).toBe(false);
        expect(registerMock).not.toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });
});
