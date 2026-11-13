import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

/**
 * Pruebas de carga k6 — @ruum/app-usuario
 * Flujos cubiertos:
 * 1. Signup (/api/csrf -> /api/auth/phone-verify/send -> /api/auth/phone-verify/verify -> /api/auth/signup)
 * 2. Login (GET /login middleware + /api/auth/verify-otp + /api/auth/resend)
 * 3. Cotización (POST /api/ruta cálculo de distancia/tiempo + POST /api/viajes validación de cotización)
 *
 * Ejecución:
 *   k6 run tests/load/app-usuario-flujos-criticos.js
 *   BASE_URL=https://staging-usuario.ruum.mx k6 run tests/load/app-usuario-flujos-criticos.js
 */

export const signupDuration = new Trend("signup_duration_ms", true);
export const loginDuration = new Trend("login_duration_ms", true);
export const cotizacionDuration = new Trend("cotizacion_duration_ms", true);
export const serverErrorRate = new Rate("server_error_rate");

// En k6, códigos esperados bajo carga incluyen 200, 400 (validación), 401 (sin sesión) y 429 (rate-limit activo)
http.setResponseCallback(http.expectedStatuses(200, 201, 204, 400, 401, 429));

export const options = {
  scenarios: {
    signup_flow: {
      executor: "ramping-arrival-rate",
      exec: "flujoSignup",
      startRate: 2,
      timeUnit: "1s",
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        { target: 10, duration: "30s" },
        { target: 20, duration: "1m" },
        { target: 5, duration: "30s" },
      ],
    },
    login_flow: {
      executor: "ramping-arrival-rate",
      exec: "flujoLogin",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 15,
      maxVUs: 80,
      stages: [
        { target: 20, duration: "30s" },
        { target: 40, duration: "1m" },
        { target: 10, duration: "30s" },
      ],
    },
    cotizacion_flow: {
      executor: "ramping-arrival-rate",
      exec: "flujoCotizacion",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 20,
      maxVUs: 100,
      stages: [
        { target: 25, duration: "30s" },
        { target: 50, duration: "1m" },
        { target: 10, duration: "30s" },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    server_error_rate: ["rate<0.01"],
    http_req_duration: ["p(95)<1000", "p(99)<1800"],
    signup_duration_ms: ["p(95)<1200", "p(99)<2000"],
    login_duration_ms: ["p(95)<700", "p(99)<1200"],
    cotizacion_duration_ms: ["p(95)<1200", "p(99)<2000"],
    checks: ["rate>0.98"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3000";

const RUTAS_COTIZACION_MX = [
  {
    nombre: "CDMX -> Querétaro",
    origen: { lat: 19.4326, lng: -99.1332 },
    destino: { lat: 20.5888, lng: -100.3899 },
    paradas: [],
  },
  {
    nombre: "CDMX -> Guadalajara",
    origen: { lat: 19.4326, lng: -99.1332 },
    destino: { lat: 20.6597, lng: -103.3496 },
    paradas: [{ lat: 20.5888, lng: -100.3899 }],
  },
  {
    nombre: "Monterrey -> Saltillo",
    origen: { lat: 25.6866, lng: -100.3161 },
    destino: { lat: 25.4232, lng: -101.0053 },
    paradas: [],
  },
];

function obtenerContextoCsrf() {
  const resCsrf = http.get(`${BASE_URL}/api/csrf`, {
    tags: { endpoint: "api_csrf" },
    timeout: "3s",
  });

  serverErrorRate.add(resCsrf.status >= 500);
  const csrfToken = resCsrf.headers["X-Csrf-Token"] || resCsrf.headers["x-csrf-token"] || "";

  check(resCsrf, {
    "csrf endpoint responde 200": (r) => r.status === 200,
    "csrf token presente en header": () => csrfToken.length >= 32,
  });

  return {
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
      "x-csrf-token": csrfToken,
    },
  };
}

export function flujoSignup() {
  const inicio = Date.now();
  const sufijo = `${__VU}${__ITER}${Date.now() % 10000}`.slice(-8).padStart(8, "0");
  const telefono = `55${sufijo}`;
  const email = `carga.usuario.${__VU}.${__ITER}@ruum-load.test`;

  group("1. Flujo Signup (OTP + Alta de Usuario)", () => {
    const ctx = obtenerContextoCsrf();

    const resSendOtp = http.post(
      `${BASE_URL}/api/auth/phone-verify/send`,
      JSON.stringify({ telefono }),
      { headers: ctx.headers, tags: { endpoint: "signup_otp_send" }, timeout: "4s" }
    );
    serverErrorRate.add(resSendOtp.status >= 500);
    check(resSendOtp, {
      "OTP send responde sin error 5xx (200/400/429)": (r) =>
        r.status === 200 || r.status === 400 || r.status === 429,
    });

    let tokenVerificacionTelefono = "mock-phone-verify-token";
    if (resSendOtp.status === 200) {
      const resVerifyOtp = http.post(
        `${BASE_URL}/api/auth/phone-verify/verify`,
        JSON.stringify({ telefono, codigo: "123456" }),
        { headers: ctx.headers, tags: { endpoint: "signup_otp_verify" }, timeout: "4s" }
      );
      serverErrorRate.add(resVerifyOtp.status >= 500);
      check(resVerifyOtp, {
        "OTP verify responde sin error 5xx (200/400/429)": (r) =>
          r.status === 200 || r.status === 400 || r.status === 429,
      });

      try {
        const bodyVerify = JSON.parse(resVerifyOtp.body || "{}");
        if (bodyVerify.token) {
          tokenVerificacionTelefono = bodyVerify.token;
        }
      } catch {
        // continuar con token mock
      }
    }

    const resSignup = http.post(
      `${BASE_URL}/api/auth/signup`,
      JSON.stringify({
        nombre: "Usuario",
        apellido: "Carga",
        telefono,
        email,
        password: "dummy-PasswordCarga99",
        aceptaTerminos: true,
        tokenVerificacionTelefono,
      }),
      { headers: ctx.headers, tags: { endpoint: "signup_submit" }, timeout: "5s" }
    );

    serverErrorRate.add(resSignup.status >= 500);
    check(resSignup, {
      "signup responde sin error 5xx (200/400/429)": (r) =>
        r.status === 200 || r.status === 400 || r.status === 429,
      "signup latencia acotada (<1500ms)": (r) => r.timings.duration < 1500,
    });
  });

  signupDuration.add(Date.now() - inicio);
  sleep(0.3);
}

export function flujoLogin() {
  const inicio = Date.now();

  group("2. Flujo Login (SSR + Middleware CSP/CSRF + Verificación Auth)", () => {
    const resLoginPage = http.get(`${BASE_URL}/login?next=%2Fviajes%2Fnuevo`, {
      tags: { endpoint: "login_page" },
      timeout: "3s",
    });

    serverErrorRate.add(resLoginPage.status >= 500);
    const csrfToken =
      resLoginPage.headers["X-Csrf-Token"] || resLoginPage.headers["x-csrf-token"] || "";

    check(resLoginPage, {
      "login page responde 200": (r) => r.status === 200,
      "login page incluye CSP con nonce": (r) =>
        Boolean(r.headers["Content-Security-Policy"] || r.headers["content-security-policy"]),
      "login page emite token CSRF": () => csrfToken.length >= 32,
    });

    const headersMutacion = {
      "Content-Type": "application/json",
      Origin: BASE_URL,
      "x-csrf-token": csrfToken,
    };

    const resVerifyOtp = http.post(
      `${BASE_URL}/api/auth/verify-otp`,
      JSON.stringify({
        email: `login.carga.${__VU}@ruum-load.test`,
        codigo: "123456",
      }),
      { headers: headersMutacion, tags: { endpoint: "login_verify_otp" }, timeout: "4s" }
    );

    serverErrorRate.add(resVerifyOtp.status >= 500);
    check(resVerifyOtp, {
      "verify-otp responde de forma determinista (200/400/429)": (r) =>
        r.status === 200 || r.status === 400 || r.status === 429,
      "verify-otp latencia acotada (<1200ms)": (r) => r.timings.duration < 1200,
    });
  });

  loginDuration.add(Date.now() - inicio);
  sleep(0.2);
}

export function flujoCotizacion() {
  const inicio = Date.now();
  const ruta = RUTAS_COTIZACION_MX[(__VU + __ITER) % RUTAS_COTIZACION_MX.length];

  group("3. Flujo Cotización (/api/ruta + /api/viajes)", () => {
    const ctx = obtenerContextoCsrf();

    const resRuta = http.post(
      `${BASE_URL}/api/ruta`,
      JSON.stringify({
        origen: ruta.origen,
        destino: ruta.destino,
        paradas: ruta.paradas,
      }),
      { headers: ctx.headers, tags: { endpoint: "cotizacion_ruta" }, timeout: "5s" }
    );

    serverErrorRate.add(resRuta.status >= 500);
    check(resRuta, {
      "cotización /api/ruta sin error 5xx (200/400/429)": (r) =>
        r.status === 200 || r.status === 400 || r.status === 429,
      "cotización /api/ruta latencia (<1500ms)": (r) => r.timings.duration < 1500,
    });

    const resViajes = http.post(
      `${BASE_URL}/api/viajes`,
      JSON.stringify({
        paso: 4,
        marca: "Toyota",
        modelo: "Corolla",
        anio: 2023,
        color: "Blanco",
        placas: "ABC123A",
        numeroSerie: "1HGCM82633A004352",
        modalidad: "rodando",
        estadoOperativo: "funciona",
        origenDireccion: "Av. Reforma 222, CDMX",
        origenCodigoPostal: "06600",
        destinoDireccion: "Blvd. Bernardo Quintana 100, Querétaro",
        destinoCodigoPostal: "76000",
        fechaRecoleccion: "2026-12-15",
        ventanaRecoleccion: "manana",
        contactoOrigenNombre: "Juan Pérez",
        contactoOrigenTelefono: "5512345678",
        contactoDestinoNombre: "María López",
        contactoDestinoTelefono: "4421234567",
      }),
      { headers: ctx.headers, tags: { endpoint: "cotizacion_viajes" }, timeout: "4s" }
    );

    serverErrorRate.add(resViajes.status >= 500);
    check(resViajes, {
      "validación /api/viajes responde sin error 5xx (200/401/429)": (r) =>
        r.status === 200 || r.status === 401 || r.status === 429,
    });
  });

  cotizacionDuration.add(Date.now() - inicio);
  sleep(0.25);
}
