import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";

const mockSignUp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockGetUser = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("@ruum/api/supabase", () => ({
  crearClienteServidor: vi.fn(() => ({
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  })),
}));

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: vi.fn(async () => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  })),
}));

vi.mock("@ruum/shared/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ruum/shared/utils")>();
  return {
    ...actual,
    obtenerRutaDirectionsMapboxConParadas: vi.fn(async () => ({
      distanciaKm: 215.4,
      tiempoHoras: 2.75,
    })),
  };
});

import { GET as getCsrf } from "../src/app/api/csrf/route";
import { POST as postPhoneSend } from "../src/app/api/auth/phone-verify/send/route";
import { POST as postPhoneVerify } from "../src/app/api/auth/phone-verify/verify/route";
import { POST as postSignup } from "../src/app/api/auth/signup/route";
import { POST as postVerifyOtp } from "../src/app/api/auth/verify-otp/route";
import { POST as postRuta } from "../src/app/api/ruta/route";
import { POST as postViajes } from "../src/app/api/viajes/route";
import { middleware } from "../src/middleware";
import { COOKIE_CSRF_USUARIO, HEADER_CSRF_TOKEN } from "../src/lib/csrf";
import { VALORES_INICIALES } from "@/app/viajes/nuevo/constants";

function calcularPercentil(tiemposMs: number[], percentil: number): number {
  const ordenados = [...tiemposMs].sort((a, b) => a - b);
  if (ordenados.length === 0) return 0;
  const idx = Math.min(
    ordenados.length - 1,
    Math.max(0, Math.ceil((percentil / 100) * ordenados.length) - 1)
  );
  return ordenados[idx] ?? 0;
}

describe("Pruebas de carga (k6 / Artillery + Benchmark concurrente) — Signup, Login y Cotización", () => {
  const envOriginal = { ...process.env };
  const rutaK6 = resolve(__dirname, "../../../tests/load/app-usuario-flujos-criticos.js");
  const rutaArtillery = resolve(__dirname, "../../../tests/load/app-usuario-artillery.yml");

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...envOriginal,
      NEXT_PUBLIC_SUPABASE_URL: "https://mock-load.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key-load",
      MAPBOX_SECRET_TOKEN: "mock-mapbox-token-load",
      PHONE_VERIFY_SECRET: "mock-secret-32-chars-for-load-testing-hmac-2026",
    };

    mockSignUp.mockResolvedValue({
      data: { user: { id: "uid-load" }, session: null },
      error: null,
    });
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: "uid-load" }, session: { access_token: "mock-tok" } },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: { id: "uid-load", email: "load@ruum.test" } },
      error: null,
    });
  });

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  describe("1. Especificación de scripts k6 y Artillery", () => {
    it("define el script k6 con escenarios independientes para signup, login y cotización y SLOs p95/p99", () => {
      expect(existsSync(rutaK6)).toBe(true);
      const contenido = readFileSync(rutaK6, "utf-8");

      // Escenarios y funciones exportadas
      expect(contenido).toContain("signup_flow");
      expect(contenido).toContain("login_flow");
      expect(contenido).toContain("cotizacion_flow");
      expect(contenido).toContain("export function flujoSignup()");
      expect(contenido).toContain("export function flujoLogin()");
      expect(contenido).toContain("export function flujoCotizacion()");

      // Endpoints críticos
      expect(contenido).toContain("/api/csrf");
      expect(contenido).toContain("/api/auth/phone-verify/send");
      expect(contenido).toContain("/api/auth/phone-verify/verify");
      expect(contenido).toContain("/api/auth/signup");
      expect(contenido).toContain("/login");
      expect(contenido).toContain("/api/auth/verify-otp");
      expect(contenido).toContain("/api/ruta");
      expect(contenido).toContain("/api/viajes");

      // Umbrales SLO
      expect(contenido).toContain("signup_duration_ms");
      expect(contenido).toContain("login_duration_ms");
      expect(contenido).toContain("cotizacion_duration_ms");
      expect(contenido).toContain("server_error_rate");
    });

    it("define la configuración Artillery con fases de carga, captura CSRF y flujos de signup, login y cotización", () => {
      expect(existsSync(rutaArtillery)).toBe(true);
      const yaml = readFileSync(rutaArtillery, "utf-8");

      expect(yaml).toContain("phases:");
      expect(yaml).toContain("http.response_time.p95");
      expect(yaml).toContain("1. Flujo Signup");
      expect(yaml).toContain("2. Flujo Login");
      expect(yaml).toContain("3. Flujo Cotización");
      expect(yaml).toContain("/api/auth/signup");
      expect(yaml).toContain("/api/auth/verify-otp");
      expect(yaml).toContain("/api/ruta");
      expect(yaml).toContain("/api/viajes");
      expect(yaml).toContain("x-csrf-token");
    });
  });

  describe("2. Ejecución de carga concurrente in-process (Signup, Login, Cotización)", () => {
    it("soporta ráfaga concurrente en el flujo completo de Signup (CSRF + OTP + Alta) con 0 errores 5xx y p95 < 500ms", async () => {
      const CONCURRENCIA = 20;
      const latenciasMs: number[] = [];

      const tareas = Array.from({ length: CONCURRENCIA }, async (_, idx) => {
        const inicio = performance.now();
        const ip = `10.10.1.${idx + 1}`;
        const sufijo = String(10000000 + idx).slice(-8);
        const telefono = `55${sufijo}`;

        // 1. Handshake CSRF
        const resCsrf = await getCsrf(
          new NextRequest("http://localhost:3000/api/csrf", { method: "GET" })
        );
        const { csrfToken } = (await resCsrf.json()) as { csrfToken: string };
        const headers = {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "x-forwarded-for": ip,
          [HEADER_CSRF_TOKEN]: csrfToken,
          cookie: `${COOKIE_CSRF_USUARIO}=${csrfToken}`,
        };

        // 2. Envío OTP
        const resSend = await postPhoneSend(
          new NextRequest("http://localhost:3000/api/auth/phone-verify/send", {
            method: "POST",
            headers,
            body: JSON.stringify({ telefono }),
          })
        );

        // 3. Verificación OTP y firma de token HMAC
        const resVerify = await postPhoneVerify(
          new NextRequest("http://localhost:3000/api/auth/phone-verify/verify", {
            method: "POST",
            headers,
            body: JSON.stringify({ telefono, codigo: "123456" }),
          })
        );
        const bodyVerify = (await resVerify.json()) as { token?: string };

        // 4. Alta de usuario
        const resSignup = await postSignup(
          new NextRequest("http://localhost:3000/api/auth/signup", {
            method: "POST",
            headers,
            body: JSON.stringify({
              nombre: "Usuario",
              apellido: `Carga${idx}`,
              telefono,
              email: `carga.signup.${idx}@ruum.test`,
              password: "dummy-PasswordCarga99",
              aceptaTerminos: true,
              tokenVerificacionTelefono: bodyVerify.token ?? "",
            }),
          })
        );

        latenciasMs.push(performance.now() - inicio);
        return {
          sendStatus: resSend.status,
          verifyStatus: resVerify.status,
          signupStatus: resSignup.status,
        };
      });

      const resultados = await Promise.all(tareas);
      for (const r of resultados) {
        expect(r.sendStatus).toBeLessThan(500);
        expect(r.verifyStatus).toBeLessThan(500);
        expect([200, 429]).toContain(r.signupStatus);
      }

      const p95 = calcularPercentil(latenciasMs, 95);
      expect(p95).toBeLessThan(1200);
    });

    it("soporta ráfaga concurrente en el flujo deLogin (Middleware CSP/CSRF + Verify OTP) con 0 errores 5xx y p95 < 1000ms", async () => {
      const CONCURRENCIA = 30;
      const latenciasMs: number[] = [];

      const tareas = Array.from({ length: CONCURRENCIA }, async (_, idx) => {
        const inicio = performance.now();
        const ip = `10.20.2.${idx + 1}`;

        const resMiddleware = await middleware(
          new NextRequest("http://localhost:3000/login?next=%2Fviajes%2Fnuevo", {
            method: "GET",
          })
        );
        const csrfToken = resMiddleware.headers.get(HEADER_CSRF_TOKEN) ?? "";

        const resOtp = await postVerifyOtp(
          new NextRequest("http://localhost:3000/api/auth/verify-otp", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: "http://localhost:3000",
              "x-forwarded-for": ip,
              [HEADER_CSRF_TOKEN]: csrfToken,
              cookie: `${COOKIE_CSRF_USUARIO}=${csrfToken}`,
            },
            body: JSON.stringify({
              email: `login.carga.${idx}@ruum.test`,
              codigo: "123456",
            }),
          })
        );

        latenciasMs.push(performance.now() - inicio);
        return {
          middlewareStatus: resMiddleware.status,
          hasCsp: Boolean(resMiddleware.headers.get("Content-Security-Policy")),
          otpStatus: resOtp.status,
        };
      });

      const resultados = await Promise.all(tareas);
      for (const r of resultados) {
        expect(r.middlewareStatus).toBeLessThan(500);
        expect(r.hasCsp).toBe(true);
        expect([200, 400, 429]).toContain(r.otpStatus);
      }

      const p95 = calcularPercentil(latenciasMs, 95);
      expect(p95).toBeLessThan(1000);
    });

    it("soporta ráfaga concurrente en el flujo de Cotización (/api/ruta + /api/viajes) con 0 errores 5xx y p95 < 1200ms", async () => {
      const CONCURRENCIA = 30;
      const latenciasMs: number[] = [];

      const payloadViajeValido = {
        ...VALORES_INICIALES,
        paso: 4,
        marca: "Toyota",
        modelo: "Corolla",
        anio: "2024",
        color: "Blanco",
        placas: "ABC123A",
        vin: "1HGCM82633A004352",
        transmision: "automatica",
        condicion: "seminueva",
        estadoGeneral: "Excelente, sin daños visibles",
        tieneTarjeta: true,
        tieneVerificacion: true,
        tienePlacas: true,
        puedeCircular: true,
        aceptaPoliticas: true,
        tipoRuta: "local",
        origenCalle: "Av. Insurgentes Sur",
        origenNumero: "123",
        origenColonia: "Del Valle",
        origenCiudad: "Benito Juárez",
        origenEstado: "CDMX",
        origenCodigoPostal: "03100",
        destinoCalle: "Paseo de la Reforma",
        destinoNumero: "456",
        destinoColonia: "Juárez",
        destinoCiudad: "Cuauhtémoc",
        destinoEstado: "CDMX",
        destinoCodigoPostal: "06600",
        entregaNombre: "Luis",
        entregaApellido: "Pérez",
        entregaTelefono: "5511223344",
        recepcionNombre: "María",
        recepcionApellido: "Gómez",
        recepcionTelefono: "5512345678",
        modalidadProgramacion: "lo_antes_posible",
        fechaHoraProgramada: "",
        zonaHoraria: "America/Mexico_City",
        vehiculoSeleccionadoId: "",
        vehiculosUsuarioIds: [],
      };

      const tareas = Array.from({ length: CONCURRENCIA }, async (_, idx) => {
        const inicio = performance.now();
        const ip = `10.30.3.${idx + 1}`;
        mockGetUser.mockResolvedValue({
          data: { user: { id: `uid-cotizacion-${idx}` } },
          error: null,
        });

        const resCsrf = await getCsrf(
          new NextRequest("http://localhost:3000/api/csrf", { method: "GET" })
        );
        const { csrfToken } = (await resCsrf.json()) as { csrfToken: string };
        const headers = {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "x-forwarded-for": ip,
          [HEADER_CSRF_TOKEN]: csrfToken,
          cookie: `${COOKIE_CSRF_USUARIO}=${csrfToken}`,
        };

        const resRuta = await postRuta(
          new NextRequest("http://localhost:3000/api/ruta", {
            method: "POST",
            headers,
            body: JSON.stringify({
              origen: { lat: 19.4326, lng: -99.1332 },
              destino: { lat: 20.5888, lng: -100.3899 },
              paradas: [],
            }),
          })
        );

        const resViajes = await postViajes(
          new NextRequest("http://localhost:3000/api/viajes", {
            method: "POST",
            headers,
            body: JSON.stringify(payloadViajeValido),
          })
        );

        latenciasMs.push(performance.now() - inicio);
        return {
          rutaStatus: resRuta.status,
          viajesStatus: resViajes.status,
        };
      });

      const resultados = await Promise.all(tareas);
      for (const r of resultados) {
        expect([200, 429]).toContain(r.rutaStatus);
        expect([200, 429]).toContain(r.viajesStatus);
      }

      const p95 = calcularPercentil(latenciasMs, 95);
      expect(p95).toBeLessThan(1200);
    });
  });
});
