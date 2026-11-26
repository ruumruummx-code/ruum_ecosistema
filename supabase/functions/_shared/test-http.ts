import { assertEquals } from "jsr:@std/assert@1";

export const SUPABASE = "https://supabase.ruum.test";
export const STRIPE = "https://api.stripe.com";
export const DIDIT = "https://verification.didit.me";
export const USUARIO = "11000000-0000-4000-8000-000000000001";
export const SERVICIO = "servicio-de-prueba";

export function entornoDePrueba(cambios: Record<string, string> = {}) {
  const valores: Record<string, string> = {
    SUPABASE_URL: SUPABASE,
    SUPABASE_ANON_KEY: "anon-de-prueba",
    SUPABASE_SERVICE_ROLE_KEY: SERVICIO,
    STRIPE_SECRET_KEY: "sk_test_ci",
    STRIPE_WEBHOOK_SECRET: "mock-webhook-signing-key",
    DIDIT_API_KEY: "didit-de-prueba",
    DIDIT_WORKFLOW_ID: "11000000-0000-4000-8000-000000000002",
    DIDIT_CALLBACK_URL: `${SUPABASE}/functions/v1/webhook-didit`,
    DIDIT_WEBHOOK_SECRET: "firma-didit-de-prueba",
    DIDIT_RECONCILER_SECRET: "reconciliador-didit-de-prueba",
    ...cambios,
  };
  return { get: (nombre: string) => valores[nombre] };
}

export function solicitudJson(datos: unknown, headers: HeadersInit = {}) {
  const cabeceras = new Headers(headers);
  cabeceras.set("Content-Type", "application/json");
  return new Request("https://edge.ruum.test", {
    method: "POST",
    headers: cabeceras,
    body: JSON.stringify(datos),
  });
}

type Solicitud = { ruta: string; url: URL; body: string; headers: Headers };
type Datos = null | boolean | number | string | Datos[] | {
  [campo: string]: Datos;
};
type Respuesta = Datos | Response;
export type RutasSimuladas = Record<
  string,
  Datos | ((solicitud: Solicitud) => Respuesta | Promise<Respuesta>)
>;

export async function conFetchSimulado(
  rutas: RutasSimuladas,
  prueba: (solicitudes: Solicitud[]) => Promise<void>,
) {
  const fetchOriginal = globalThis.fetch;
  const solicitudes: Solicitud[] = [];
  const inesperadas: string[] = [];
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    const ruta = `${req.method} ${url.origin}${url.pathname}`;
    const solicitud = {
      ruta,
      url,
      body: await req.text(),
      headers: req.headers,
    };
    solicitudes.push(solicitud);
    if (!Object.hasOwn(rutas, ruta)) {
      inesperadas.push(ruta);
      return new Response("Ruta no configurada en la prueba", { status: 400 });
    }
    const respuesta = rutas[ruta];
    const datos = typeof respuesta === "function"
      ? await respuesta(solicitud)
      : respuesta;
    return datos instanceof Response ? datos : Response.json(datos);
  };
  try {
    await prueba(solicitudes);
  } finally {
    globalThis.fetch = fetchOriginal;
    assertEquals(inesperadas, [], "No se esperaban solicitudes a estas rutas");
  }
}
