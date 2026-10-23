import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_CSRF_USUARIO,
  HEADER_CSRF_TOKEN,
  asegurarCookieCsrf,
  compararTiempoConstante,
  esFormatoTokenCsrfValido,
  esMetodoMutacion,
  esRutaExentaCsrf,
  generarTokenCsrf,
  obtenerHeadersCsrf,
  obtenerTokenCsrfCliente,
  validarCsrfRequest,
  verificarCsrfORechazar,
  verificarParTokenCsrf,
} from "./csrf";
import { GET as getCsrfRoute } from "../app/api/csrf/route";
import { middleware } from "../middleware";
import { POST as postSignup } from "../app/api/auth/signup/route";
import { POST as postViajes } from "../app/api/viajes/route";
import { POST as postRuta } from "../app/api/ruta/route";

describe("Protección CSRF para mutaciones de estado (csrf.ts + middleware + API routes)", () => {
  const envOriginal = { ...process.env };

  beforeEach(() => {
    process.env = { ...envOriginal };
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_CSRF_USUARIO}=; Max-Age=0; path=/`;
    }
  });

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  describe("1. Primitivas criptográficas y validación de formato", () => {
    it("genera tokens CSRF hexadecimales únicos de 64 caracteres (256 bits)", () => {
      const t1 = generarTokenCsrf();
      const t2 = generarTokenCsrf();
      expect(t1).toHaveLength(64);
      expect(t2).toHaveLength(64);
      expect(t1).not.toBe(t2);
      expect(esFormatoTokenCsrfValido(t1)).toBe(true);
      expect(esFormatoTokenCsrfValido(t2)).toBe(true);
    });

    it("rechaza formatos de token inválidos o cortos", () => {
      expect(esFormatoTokenCsrfValido(null)).toBe(false);
      expect(esFormatoTokenCsrfValido(undefined)).toBe(false);
      expect(esFormatoTokenCsrfValido("")).toBe(false);
      expect(esFormatoTokenCsrfValido("corto123")).toBe(false);
      expect(esFormatoTokenCsrfValido("z".repeat(64))).toBe(false);
    });

    it("compara tokens en tiempo constante correctamente", () => {
      const token = generarTokenCsrf();
      expect(compararTiempoConstante(token, token)).toBe(true);
      expect(compararTiempoConstante(token, token.slice(0, -1) + "0")).toBe(
        token.endsWith("0")
      );
      expect(compararTiempoConstante(token, "otro")).toBe(false);
      expect(compararTiempoConstante("", "")).toBe(false);
    });

    it("verificarParTokenCsrf valida coincidencia exacta entre cookie y header", () => {
      const token = generarTokenCsrf();
      expect(verificarParTokenCsrf(token, token)).toEqual({ valido: true });
      expect(verificarParTokenCsrf(null, token).motivo).toBe("cookie_missing");
      expect(verificarParTokenCsrf(token, null).motivo).toBe("token_missing");
      expect(verificarParTokenCsrf("invalido", "invalido").motivo).toBe("token_invalid");
      expect(verificarParTokenCsrf(token, generarTokenCsrf()).motivo).toBe("token_mismatch");
    });

    it("identifica métodos de mutación y rutas exentas", () => {
      expect(esMetodoMutacion("POST")).toBe(true);
      expect(esMetodoMutacion("PUT")).toBe(true);
      expect(esMetodoMutacion("PATCH")).toBe(true);
      expect(esMetodoMutacion("DELETE")).toBe(true);
      expect(esMetodoMutacion("GET")).toBe(false);
      expect(esMetodoMutacion("HEAD")).toBe(false);
      expect(esRutaExentaCsrf("/api/csp-report")).toBe(true);
      expect(esRutaExentaCsrf("/api/viajes")).toBe(false);
    });
  });

  describe("2. Validación de requests de mutación (Double-Submit + Origin + Fetch Metadata)", () => {
    it("permite métodos de solo lectura (GET/HEAD) y ruta exenta /api/csp-report", () => {
      const reqGet = new NextRequest("http://localhost:3000/api/viajes", { method: "GET" });
      expect(validarCsrfRequest(reqGet, { exigirToken: true }).valido).toBe(true);

      const reqCsp = new NextRequest("http://localhost:3000/api/csp-report", { method: "POST" });
      expect(validarCsrfRequest(reqCsp, { exigirToken: true }).valido).toBe(true);
    });

    it("bloquea solicitudes con Sec-Fetch-Site: cross-site", () => {
      const req = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: { "sec-fetch-site": "cross-site" },
      });
      const res = validarCsrfRequest(req);
      expect(res.valido).toBe(false);
      expect(res.motivo).toBe("cross_site_fetch");
    });

    it("bloquea solicitudes con Origin o Referer cruzado", () => {
      const reqOrigin = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: { origin: "https://attacker.example.com" },
      });
      expect(validarCsrfRequest(reqOrigin)).toEqual(
        expect.objectContaining({ valido: false, motivo: "origin_mismatch" })
      );

      const reqReferer = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: { referer: "https://attacker.example.com/form" },
      });
      expect(validarCsrfRequest(reqReferer)).toEqual(
        expect.objectContaining({ valido: false, motivo: "referer_mismatch" })
      );

      const reqBadReferer = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: { referer: ":::url-invalida:::" },
      });
      expect(validarCsrfRequest(reqBadReferer)).toEqual(
        expect.objectContaining({ valido: false, motivo: "referer_mismatch" })
      );
    });

    it("acepta mutación cuando cookie ruum_csrf_token y header x-csrf-token coinciden", () => {
      const token = generarTokenCsrf();
      const req = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          [HEADER_CSRF_TOKEN]: token,
          cookie: `${COOKIE_CSRF_USUARIO}=${token}`,
        },
      });
      expect(validarCsrfRequest(req, { exigirToken: true })).toEqual({ valido: true });
      expect(verificarCsrfORechazar(req, { exigirToken: true })).toBeNull();
    });

    it("rechaza con 403 cuando existe cookie CSRF pero falta header x-csrf-token o no coincide", async () => {
      const token = generarTokenCsrf();
      const reqSinHeader = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: {
          cookie: `${COOKIE_CSRF_USUARIO}=${token}`,
        },
      });
      const respuesta = verificarCsrfORechazar(reqSinHeader);
      expect(respuesta).not.toBeNull();
      expect(respuesta?.status).toBe(403);
      const body = await respuesta?.json();
      expect(body.code).toBe("CSRF_INVALID");

      const reqMismatch = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: {
          [HEADER_CSRF_TOKEN]: generarTokenCsrf(),
          cookie: `${COOKIE_CSRF_USUARIO}=${token}`,
        },
      });
      expect(verificarCsrfORechazar(reqMismatch)?.status).toBe(403);
    });
  });

  describe("3. Emisión de cookie, endpoint /api/csrf y helpers de cliente", () => {
    it("asegurarCookieCsrf y GET /api/csrf emiten cookie y header x-csrf-token", async () => {
      const req = new NextRequest("http://localhost:3000/api/csrf", { method: "GET" });
      const res = await getCsrfRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(esFormatoTokenCsrfValido(json.csrfToken)).toBe(true);
      expect(res.headers.get(HEADER_CSRF_TOKEN)).toBe(json.csrfToken);
      expect(res.cookies.get(COOKIE_CSRF_USUARIO)?.value).toBe(json.csrfToken);

      // Si el request ya trae cookie válida, la reutiliza
      const reqConCookie = new NextRequest("http://localhost:3000/api/csrf", {
        method: "GET",
        headers: { cookie: `${COOKIE_CSRF_USUARIO}=${json.csrfToken}` },
      });
      const resReuso = NextResponse.next();
      const tokenReusado = asegurarCookieCsrf(reqConCookie, resReuso);
      expect(tokenReusado).toBe(json.csrfToken);
    });

    it("obtenerTokenCsrfCliente y obtenerHeadersCsrf leen document.cookie e inyectan x-csrf-token", () => {
      const docOriginal = (globalThis as { document?: { cookie: string } }).document;
      try {
        delete (globalThis as { document?: unknown }).document;
        expect(obtenerTokenCsrfCliente()).toBeNull();
        expect(obtenerHeadersCsrf({ "Content-Type": "application/json" })).toEqual({
          "Content-Type": "application/json",
        });

        const token = generarTokenCsrf();
        (globalThis as { document?: { cookie: string } }).document = {
          cookie: `otra_cookie=1; ${COOKIE_CSRF_USUARIO}=${token}`,
        };
        expect(obtenerTokenCsrfCliente()).toBe(token);
        expect(obtenerHeadersCsrf({ "Content-Type": "application/json" })).toEqual({
          "Content-Type": "application/json",
          [HEADER_CSRF_TOKEN]: token,
        });
      } finally {
        if (docOriginal !== undefined) {
          (globalThis as { document?: { cookie: string } }).document = docOriginal;
        } else {
          delete (globalThis as { document?: unknown }).document;
        }
      }
    });
  });

  describe("4. Integración con Middleware y API Routes de mutación", () => {
    it("middleware emite cookie CSRF en GET y bloquea POST con token inválido (403)", async () => {
      const reqGet = new NextRequest("http://localhost:3000/", { method: "GET" });
      const resGet = await middleware(reqGet);
      const tokenEmitido = resGet.headers.get(HEADER_CSRF_TOKEN);
      expect(esFormatoTokenCsrfValido(tokenEmitido)).toBe(true);

      // POST con cookie CSRF pero sin header x-csrf-token es bloqueado por middleware con 403
      const reqPostForjado = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: {
          cookie: `${COOKIE_CSRF_USUARIO}=${tokenEmitido}`,
        },
      });
      const resPostForjado = await middleware(reqPostForjado);
      expect(resPostForjado.status).toBe(403);
      expect(resPostForjado.headers.get("Content-Security-Policy")).toBeTruthy();
    });

    it("API routes (/api/viajes, /api/auth/signup, /api/ruta) rechazan con 403 mutaciones con CSRF inválido", async () => {
      const tokenCookie = generarTokenCsrf();
      const tokenAtacante = generarTokenCsrf();

      const reqViajes = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: {
          cookie: `${COOKIE_CSRF_USUARIO}=${tokenCookie}`,
          [HEADER_CSRF_TOKEN]: tokenAtacante,
        },
      });
      expect((await postViajes(reqViajes)).status).toBe(403);

      const reqSignup = new NextRequest("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: {
          origin: "https://evil.example.org",
        },
      });
      expect((await postSignup(reqSignup)).status).toBe(403);

      const reqRuta = new NextRequest("http://localhost:3000/api/ruta", {
        method: "POST",
        headers: {
          "sec-fetch-site": "cross-site",
        },
      });
      expect((await postRuta(reqRuta)).status).toBe(403);
    });
  });
});
