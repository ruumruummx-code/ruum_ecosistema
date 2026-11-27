#!/usr/bin/env node
/**
 * Alinea las tres apps con el Supabase local (`supabase start`).
 *
 * Problema que resuelve: cada app apuntaba a un Supabase distinto en local
 * (raíz :54321 sin service_role, app-conductor :54331 —puerto de CI—, panel-admin
 * sin .env), así que los flujos se cortaban entre apps aunque cada una "arrancara".
 *
 * Qué hace:
 *  - Lee URL y claves de `supabase status -o env`.
 *  - Escribe/actualiza sólo las variables de Supabase (y la URL local de cada app)
 *    en `.env` (raíz, que app-usuario carga con --env-file y tiene prioridad) y en
 *    `apps/<app>/.env.local`. El resto de variables existentes se conserva.
 *  - Lista las variables obligatorias que siguen vacías (Mapbox, Stripe test, Twilio…).
 *
 * Uso: pnpm db:start && pnpm env:local
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let estado;
try {
  estado = dotenv.parse(execSync("npx supabase status -o env", { cwd: raiz, stdio: ["ignore", "pipe", "pipe"] }));
} catch (error) {
  console.error("[env:local] No se pudo leer `supabase status`. ¿Corriste `pnpm db:start` (Docker encendido)?");
  console.error(String(error?.stderr ?? error?.message ?? error).trim());
  process.exit(1);
}

const url = estado.API_URL;
const anon = estado.ANON_KEY;
const servicio = estado.SERVICE_ROLE_KEY;
if (!url || !anon || !servicio) {
  console.error("[env:local] `supabase status` no devolvió API_URL, ANON_KEY y SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = {
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
  SUPABASE_URL: url,
  SUPABASE_ANON_KEY: anon
};
const conServicio = { ...supabase, SUPABASE_SERVICE_ROLE_KEY: servicio };

const destinos = [
  { archivo: ".env", valores: conServicio },
  { archivo: "apps/app-usuario/.env.local", valores: { ...conServicio, NEXT_PUBLIC_APP_URL: "http://localhost:3000" } },
  { archivo: "apps/app-conductor/.env.local", valores: { ...supabase, NEXT_PUBLIC_APP_URL: "http://localhost:3001" } },
  { archivo: "apps/panel-admin/.env.local", valores: { ...conServicio, NEXT_PUBLIC_APP_URL: "http://localhost:3002" } }
];

function escribir(archivo, valores) {
  const ruta = path.join(raiz, archivo);
  const lineas = fs.existsSync(ruta) ? fs.readFileSync(ruta, "utf8").split(/\r?\n/) : [];
  const pendientes = new Map(Object.entries(valores));
  const salida = lineas.map((linea) => {
    const m = /^\s*([A-Z0-9_]+)\s*=/.exec(linea);
    if (!m || !pendientes.has(m[1])) return linea;
    const valor = pendientes.get(m[1]);
    pendientes.delete(m[1]);
    return `${m[1]}=${valor}`;
  });
  if (pendientes.size) {
    if (salida.length && salida[salida.length - 1] !== "") salida.push("");
    salida.push("# Sincronizado con el Supabase local (pnpm env:local)");
    for (const [k, v] of pendientes) salida.push(`${k}=${v}`);
  }
  fs.writeFileSync(ruta, salida.join("\n").replace(/\n*$/, "\n"));
  return ruta;
}

for (const { archivo, valores } of destinos) {
  escribir(archivo, valores);
  console.log(`[env:local] ${archivo} → ${url}`);
}

// Variables que la app necesita y este script no puede inventar.
const requeridas = {
  "app-usuario": ["NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "MAPBOX_SECRET_TOKEN", "PHONE_VERIFY_SECRET", "TARIFA_SNAPSHOT_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"],
  "app-conductor": ["NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"],
  "panel-admin": ["NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"]
};
for (const [app, nombres] of Object.entries(requeridas)) {
  const env = {};
  for (const archivo of [".env", `apps/${app}/.env`, `apps/${app}/.env.development`, `apps/${app}/.env.local`]) {
    const ruta = path.join(raiz, archivo);
    if (fs.existsSync(ruta)) Object.assign(env, dotenv.parse(fs.readFileSync(ruta)));
  }
  const faltan = nombres.filter((n) => !env[n]?.trim());
  if (faltan.length) console.warn(`[env:local] ${app}: faltan ${faltan.join(", ")} (agrégalas en apps/${app}/.env.local; usa claves de prueba).`);
}
