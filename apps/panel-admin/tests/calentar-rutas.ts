import type { FullConfig } from "@playwright/test";

// Rutas que recorre tests/smoke/roles.spec.ts. `next dev` compila cada una la
// primera vez que se pide (Mapbox y los módulos operativos tardan varios
// segundos). Compilarlas aquí, una por una, evita que esa espera consuma el
// timeout de las pruebas.
const RUTAS = [
  "/sin-permiso",
  "/viajes",
  "/mapa",
  "/incidencias",
  "/reportes",
  "/pagos",
  "/tarifas",
  "/usuarios",
  "/documentos",
  "/conductores",
];

export default async function calentarRutas(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) return;

  for (const ruta of RUTAS) {
    const respuesta = await fetch(new URL(ruta, baseURL), {
      // Dirección puede ver todas las rutas, así que ninguna se redirige.
      headers: { cookie: "ruum_smoke_rol=direccion" },
      signal: AbortSignal.timeout(180_000),
    });
    if (!respuesta.ok) {
      throw new Error(`No se pudo compilar ${ruta} antes del smoke: HTTP ${respuesta.status}`);
    }
  }
}
