#!/usr/bin/env node
/**
 * T03 — Doble local de Supabase (GoTrue + PostgREST mínimo) para E2E.
 *
 * El middleware de app-usuario valida la sesión DEL LADO SERVIDOR: llama a
 * `supabase.auth.getUser()` (GoTrue) y, si hay usuario en rutas protegidas, a
 * PostgREST vía `clasificarRolApp`. Por eso una cookie falsa NO alcanza para
 * certificar la redirección autenticada: sin un GoTrue que responda, la prueba
 * no puede distinguir "sesión válida" de "la red se cayó" (y el fallo real pasa
 * inadvertido). Este servidor devuelve exactamente lo que el servidor de Next
 * consulta en los flujos E2E, sin red externa ni credenciales.
 *
 * Límite honesto (documentado también en la evidencia de QA):
 *  - NO sustituye a un proyecto Supabase real: RLS, triggers y constraints no
 *    se ejercitan aquí.
 *  - Los specs siguen mockeando el lado navegador con `page.route()`; este
 *    servidor solo cubre lo que el navegador NO ve (middleware y RSC).
 *
 * Se levanta desde `playwright.config.ts` como primer `webServer`. Los tokens
 * deben coincidir con los de `fixtures/sesion.ts`.
 */
import { DASHBOARD_TOKEN, datosDashboard } from "./dashboard.mjs";
import { VEHICLES_TOKEN, datosVehiculos } from "./vehicles.mjs";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

export const MOCK_SUPABASE_PUERTO = Number(process.env.PLAYWRIGHT_MOCK_SUPABASE_PORT ?? 54399);
export const ACCESS_TOKEN = "mock_access_token";
export const ACCESS_TOKEN_PENDIENTE = "mock_access_token_pendiente";
export const REFRESH_TOKEN = "mock_refresh_token";

export const USUARIO_E2E = {
  id: "00000000-0000-4000-8000-00000000e001",
  aud: "authenticated",
  role: "authenticated",
  email: "usuario@ejemplo.com",
  email_confirmed_at: "2026-01-01T00:00:00.000Z",
  phone: "",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z"
};

/**
 * Fila de `public.usuarios` que PostgREST devolvería a `obtenerUsuarioActual`
 * y a `clasificarRolApp`. Decisiones deliberadas (los specs dependen de ellas):
 *
 *  - `estado_verificacion: "verificado"`: el wizard de `/viajes/nuevo` exige
 *    cuenta verificada (useSesionTraslado monta un muro si no lo esta), asi
 *    que esta es la variante por defecto de la suite.
 *  - `FILA_USUARIO_PENDIENTE` es la MISMA cuenta con estado "pendiente": la
 *    unica desde la que `/verificacion` ofrece el portal Didit. Se elige por
 *    token (`SESIONES`), no por estado global, para que ambas variantes
 *    puedan correr en paralelo sin pisarse.
 *  - `foto_url` con una URL: VerificacionForm solo arranca Didit directamente
 *    cuando el usuario YA tiene foto de perfil; sin ella el clic abre la hoja
 *    de subida y el modal a11y no es alcanzable.
 *  - `version_terminos_aceptada: 1`: usuario establecido que ya aceptó los
 *    términos vigentes (VERSION_TERMINOS_VIGENTE). Con `null` la
 *    PuertaConsentimiento del layout interpondría el muro de consentimiento y
 *    taparía los clics de cualquier test autenticado. Ese muro está cubierto
 *    por sus propias pruebas unitarias (ConsentimientoTerminos.test.tsx /
 *    PuertaConsentimiento.test.tsx).
 */
export const FILA_USUARIO_E2E = {
  id: "00000000-0000-4000-8000-0000000000f1",
  auth_user_id: USUARIO_E2E.id,
  email: USUARIO_E2E.email,
  nombre: "Prueba",
  apellido: "E2E",
  telefono: "5512345678",
  estado_verificacion: "verificado",
  doc_identidad_url: null,
  foto_url: "https://cdn.test/foto-perfil-e2e.jpg",
  estado_cuenta: "activa",
  version_terminos_aceptada: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z"
};

/** Misma cuenta con verificacion pendiente: portal Didit alcanzable. */
export const FILA_USUARIO_PENDIENTE = {
  ...FILA_USUARIO_E2E,
  estado_verificacion: "pendiente"
};

/** Token valido -> fila de perfil que vera el navegador y el servidor. */
const SESIONES = new Map([
  [ACCESS_TOKEN, FILA_USUARIO_E2E],
  [DASHBOARD_TOKEN, { ...FILA_USUARIO_E2E, nombre: "Carlos Mendoza", foto_url: null }],
  [VEHICLES_TOKEN, { ...FILA_USUARIO_E2E, nombre: "Carlos Mendoza", foto_url: null }],
  [ACCESS_TOKEN_PENDIENTE, FILA_USUARIO_PENDIENTE],
  ["mock_access_token_foto_perfil", { ...FILA_USUARIO_E2E, foto_url: null }]
]);
const fotosPerfil = new Map();

const CABECERAS_CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization,apikey,x-client-info,content-type,x-supabase-api-version",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-expose-headers": "x-supabase-api-version"
};

function responder(res, status, cuerpo) {
  const texto = typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(texto),
    ...CABECERAS_CORS
  });
  res.end(texto);
}

function leerCuerpo(req) {
  return new Promise((resolve) => {
    let datos = "";
    req.on("data", (fragmento) => (datos += fragmento));
    req.on("end", () => resolve(datos));
  });
}

function tokenDe(req) {
  const cabecera = req.headers.authorization ?? "";
  const [, token] = cabecera.split(" ");
  return token ?? null;
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${MOCK_SUPABASE_PUERTO}`);
  const ruta = url.pathname;

  console.log(
    `[mock] ${req.method} ${ruta}${url.search} origin=${req.headers.origin ?? "-"} acrh=${req.headers["access-control-request-headers"] ?? "-"}`
  );

  if (req.method === "OPTIONS") {
    // El cliente (supabase-js) envía cabeceras propias como `accept-profile`
    // y `x-retry-count` que cambian entre versiones: en vez de una lista
    // fija que se queda corta, devolvemos las que pide el preflight.
    const pedidas = req.headers["access-control-request-headers"];
    res.writeHead(204, {
      ...CABECERAS_CORS,
      ...(pedidas ? { "access-control-allow-headers": String(pedidas) } : {})
    });
    res.end();
    return;
  }

  // Raíz: health-check del `webServer` de Playwright (debe responder 2xx).
  if (ruta === "/" || ruta === "/health") {
    responder(res, 200, { mock: "supabase", puerto: MOCK_SUPABASE_PUERTO });
    return;
  }

  // ── GoTrue ──
  if (ruta === "/auth/v1/user") {
    const fila = SESIONES.get(tokenDe(req) ?? "");
    if (!fila) {
      responder(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT: token E2E desconocido" });
      return;
    }
    responder(res, 200, USUARIO_E2E);
    return;
  }

  if (ruta === "/auth/v1/token") {
    const tipo = url.searchParams.get("grant_type");
    const cuerpo = JSON.parse((await leerCuerpo(req)) || "{}");
    if (
      tipo === "password" &&
      cuerpo.email === "usuario.e2e@correo.test" &&
      cuerpo.password === "ClaveE2E123!"
    ) {
      responder(res, 200, {
        access_token: ACCESS_TOKEN,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: REFRESH_TOKEN,
        user: { ...USUARIO_E2E, email: cuerpo.email }
      });
      return;
    }
    if (tipo === "password") {
      responder(res, 400, {
        code: 400,
        error_code: "invalid_credentials",
        msg: "Invalid login credentials"
      });
      return;
    }
    if (tipo === "refresh_token" && cuerpo.refresh_token === REFRESH_TOKEN) {
      responder(res, 200, {
        access_token: ACCESS_TOKEN,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: REFRESH_TOKEN,
        user: USUARIO_E2E
      });
      return;
    }
    responder(res, 400, {
      code: 400,
      error_code: tipo === "refresh_token" ? "refresh_token_not_found" : "invalid_grant",
      msg: `Grant ${tipo ?? "(sin grant_type)"} no soportado por el doble E2E`
    });
    return;
  }

  if (ruta === "/auth/v1/logout") {
    res.writeHead(204, CABECERAS_CORS);
    res.end();
    return;
  }

  // ── PostgREST ──
  // Storage privado para el E2E de fotografía. Conserva los bytes que sube el navegador.
  const prefijoFoto = "/storage/v1/object/fotos-perfil/";
  const prefijoFirma = "/storage/v1/object/sign/fotos-perfil/";
  if (ruta.startsWith(prefijoFirma)) {
    const path = decodeURIComponent(ruta.slice(prefijoFirma.length));
    if (req.method === "POST") {
      if (!SESIONES.has(tokenDe(req)) || !fotosPerfil.has(path)) {
        responder(res, 404, { message: "Foto no disponible" });
        return;
      }
      await leerCuerpo(req);
      responder(res, 200, { signedURL: `/object/sign/fotos-perfil/${path}?token=e2e-foto` });
    } else if (req.method === "GET" && url.searchParams.get("token") === "e2e-foto" && fotosPerfil.has(path)) {
      const foto = fotosPerfil.get(path);
      res.writeHead(200, { ...CABECERAS_CORS, "content-type": foto.type, "cache-control": "no-store" });
      res.end(foto.bytes);
    } else responder(res, 404, { message: "Foto no disponible" });
    return;
  }
  if (req.method === "POST" && ruta.startsWith(prefijoFoto)) {
    const path = decodeURIComponent(ruta.slice(prefijoFoto.length));
    if (!SESIONES.has(tokenDe(req)) || !path.startsWith(`${USUARIO_E2E.id}/`)) {
      responder(res, 403, { message: "Sin permiso" });
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const cuerpo = Buffer.concat(chunks);
    const form = await new Response(cuerpo, { headers: { "content-type": req.headers["content-type"] } }).formData();
    const archivo = form.get("");
    if (!(archivo instanceof File)) { responder(res, 400, { message: "Sin archivo" }); return; }
    fotosPerfil.set(path, { bytes: Buffer.from(await archivo.arrayBuffer()), type: archivo.type });
    responder(res, 200, { Key: `fotos-perfil/${path}`, Id: "foto-e2e" });
    return;
  }
  if (ruta === "/functions/v1/crear-llamada-enmascarada" && tokenDe(req) === DASHBOARD_TOKEN) {
    await leerCuerpo(req);
    responder(res, 503, { error: "No pudimos conectar la llamada. Intenta de nuevo." });
    return;
  }
  if (req.method === "GET" && [DASHBOARD_TOKEN, VEHICLES_TOKEN].includes(tokenDe(req))) {
    let filas = tokenDe(req) === VEHICLES_TOKEN ? datosVehiculos(ruta) : datosDashboard(ruta);
    if (filas) {
      for (const [campo, valor] of url.searchParams) {
        if (valor.startsWith("eq.")) filas = filas.filter(fila => String(fila[campo]) === valor.slice(3));
      }
      const singular = (req.headers.accept ?? "").includes("vnd.pgrst.object");
      responder(res, 200, singular ? filas[0] ?? null : filas);
      return;
    }
  }
  if (ruta.startsWith("/rest/v1/")) {
    if (ruta.startsWith("/rest/v1/rpc/usuario_previsualizar_tarifa")) {
      // Tarifa determinista para el Paso 0 del wizard. Los specs que necesiten
      // otro resultado (p. ej. "cotización especial") la interceptan en el
      // navegador con page.route.
      await leerCuerpo(req);
      responder(res, 200, { disponible: true, tarifa: 500, categoria: "ligero_a", gama: "media" });
      return;
    }
    if (ruta.startsWith("/rest/v1/rpc/")) {
      await leerCuerpo(req);
      responder(res, 200, {});
      return;
    }
    const cuerpo = await leerCuerpo(req);
    if (req.method === "PATCH" && ruta === "/rest/v1/usuarios" && tokenDe(req) === "mock_access_token_foto_perfil") {
      const fila = SESIONES.get(tokenDe(req));
      Object.assign(fila, JSON.parse(cuerpo));
      responder(res, 200, fila);
      return;
    }
    // `public.usuarios` es el único con datos: `obtenerUsuarioActual` y
    // `clasificarRolApp` lo leen desde el servidor (middleware y RSC). Cualquier
    // otra tabla/vista (pasaporte_digital, traslados, …) responde lista vacía,
    // que es lo que un usuario sin solicitudes vería en el Happy Path.
    if (req.method === "GET" && ruta === "/rest/v1/usuarios") {
      const fila = SESIONES.get(tokenDe(req) ?? "");
      responder(res, 200, fila ? [fila] : []);
      return;
    }
    responder(res, 200, []);
    return;
  }

  // ── Edge Functions (Didit) ──
  if (ruta === "/functions/v1/iniciar-verificacion-didit") {
    await leerCuerpo(req);
    responder(res, 200, {
      url: "https://verify.didit.me/session/e2e-mock",
      session_id: "didit_session_e2e"
    });
    return;
  }

  // Auth no cubierta (recover, verify, OTP…): los specs la mockean en el
  // navegador con page.route(); si llega aquí es que algo la llamó por fuera.
  if (ruta.startsWith("/auth/v1/")) {
    responder(res, 404, { code: 404, error_code: "not_found", msg: `Ruta no implementada en el doble E2E: ${ruta}` });
    return;
  }

  responder(res, 404, { code: 404, msg: `Ruta no implementada en el doble E2E: ${ruta}` });
});

// Se ejecuta como proceso independiente (webServer de Playwright); importarlo
// solo para leer las constantes no arranca el servidor.
const esProcesoPrincipal = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (esProcesoPrincipal) {
  servidor.listen(MOCK_SUPABASE_PUERTO, "127.0.0.1", () => {
    console.log(`[mock-supabase] doble GoTrue+PostgREST escuchando en http://127.0.0.1:${MOCK_SUPABASE_PUERTO}`);
  });
}
