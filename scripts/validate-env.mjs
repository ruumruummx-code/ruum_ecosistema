#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = process.argv[2] ?? "workspace";
const envDir = app === "workspace" ? process.cwd() : path.join(__dirname, "../apps", app);
const prod = process.argv.includes("--production") || process.env.NODE_ENV === "production";
const modo = prod ? "production" : "development";
dotenv.config({
  path: [`.env.${modo}.local`, ".env.local", `.env.${modo}`, ".env"].map((file) => path.join(envDir, file))
});


// Cargar version desde config/app-version.json si no está en .env
if (!process.env.NEXT_PUBLIC_APP_VERSION) {
  try {
    const configPath = path.join(__dirname, "../config/app-version.json");
    if (fs.existsSync(configPath)) {
      const versionConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      process.env.NEXT_PUBLIC_APP_VERSION = versionConfig.version;
    }
  } catch (e) {
    // Continuar si no se puede leer
  }
}

const requiredByApp = {
  "panel-admin": ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  "app-conductor": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_APP_VERSION",
    "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"
  ],
  "app-usuario": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN",
    "MAPBOX_SECRET_TOKEN",
    "PHONE_VERIFY_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_VERIFY_SERVICE_SID"
  ]
};
const required = requiredByApp[app] ?? [...new Set(Object.values(requiredByApp).flat())];
const missing = required.filter((name) => !process.env[name]?.trim());
const demo = process.env.NEXT_PUBLIC_PANEL_ADMIN_DEMO === "true";
const invalid = [];
const hostedBuild = prod || Boolean(process.env.VERCEL);
const localProduction = process.env.RUUM_LOCAL_PRODUCTION === "true";
if (hostedBuild && demo) invalid.push("NEXT_PUBLIC_PANEL_ADMIN_DEMO no puede ser true en producción");
if (hostedBuild && missing.length) invalid.push(`faltan variables: ${missing.join(", ")}`);
if (hostedBuild && ["app-conductor", "app-usuario", "workspace"].includes(app)) {
  // El rate-limit distribuido acepta Upstash o Vercel KV. Exigir un par
  // completo evita que el despliegue pase y luego degrade a memoria local.
  const tieneUpstash = Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
  const tieneKv = Boolean(process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim());
  if (!tieneUpstash && !tieneKv) {
    invalid.push("se requiere Redis para rate-limit distribuido: UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN (o KV_REST_API_URL y KV_REST_API_TOKEN)");
  }
}
if (hostedBuild && ["app-usuario", "workspace"].includes(app)) {
  const valor = (nombre) => process.env[nombre]?.trim() ?? "";
  if (valor("SUPABASE_SERVICE_ROLE_KEY") && valor("SUPABASE_SERVICE_ROLE_KEY") === valor("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    invalid.push("SUPABASE_SERVICE_ROLE_KEY debe ser distinta de la clave pública");
  }
  const modoPublico = /^pk_(test|live)_.+/.exec(valor("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"))?.[1];
  const modoPrivado = /^(?:sk|rk)_(test|live)_.+/.exec(valor("STRIPE_SECRET_KEY"))?.[1];
  if (!modoPublico || modoPublico !== modoPrivado) {
    invalid.push("Las claves Stripe pública y privada deben ser del mismo modo (test o live)");
  }
  if (process.env.VERCEL_ENV === "production" && modoPrivado !== "live") {
    invalid.push("Stripe debe usar claves live en producción de Vercel");
  }
  if (process.env.VERCEL_ENV === "preview" && modoPrivado !== "test") {
    invalid.push("Stripe debe usar claves test en Vercel Preview");
  }
  const cron = valor("CRON_SECRET");
  const secretosExternos = process.env.VERCEL ? "" : valor("MASIVOS_RECONCILIADOR_SECRET");
  if (cron.length < 16 && secretosExternos.length < 16) {
    invalid.push("Se requiere CRON_SECRET de al menos 16 caracteres o el secreto del scheduler externo");
  }
  const secretoIndividual = valor("VIAJES_RECONCILIADOR_SECRET");
  if (!cron && secretoIndividual && secretoIndividual.length < 16) {
    invalid.push("VIAJES_RECONCILIADOR_SECRET debe tener al menos 16 caracteres");
  }
  const redisUrl = valor("UPSTASH_REDIS_REST_TOKEN") && valor("UPSTASH_REDIS_REST_URL")
    ? valor("UPSTASH_REDIS_REST_URL")
    : valor("KV_REST_API_URL");
  if (redisUrl) {
    const url = URL.parse(redisUrl);
    if (url?.protocol !== "https:" &&
        !(localProduction && url?.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
      invalid.push("El endpoint Redis debe usar HTTPS");
    }
  }
}
for (const name of required.filter((n) => n.includes("SUPABASE_URL"))) {
  const value = process.env[name];
  if (value && !/^https:\/\//.test(value) && !(localProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(value)))
    invalid.push(`${name} debe usar https://`);
}
const isCi = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
if (hostedBuild) {
  for (const name of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
    const v = process.env[name];
    const isLocalhostHttp = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(v || "");
    // Solo el Compose local puede usar HTTP de localhost; producción/preview real exige HTTPS.
    if (v && !/^https:\/\//.test(v) && !(localProduction && isLocalhostHttp)) invalid.push(`${name} debe usar https:// en producción`);
  }
  const mapbox = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (mapbox && !/^pk\./.test(mapbox)) invalid.push("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN debe empezar con pk.");
  const mapboxSecret = process.env.MAPBOX_SECRET_TOKEN;
  if (mapboxSecret && !/^sk\./.test(mapboxSecret)) invalid.push("MAPBOX_SECRET_TOKEN debe empezar con sk.");
  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  if (version && !/^\d+\.\d+\.\d+/.test(version) && !isCi) invalid.push("NEXT_PUBLIC_APP_VERSION debe ser SemVer (ej. 1.0.0)");
  // NEXT_PUBLIC_APP_VERSION en producción real no puede ser placeholder
  if (!isCi && (version === "0.0.1" || version === "ci")) invalid.push("NEXT_PUBLIC_APP_VERSION no puede ser 0.0.1/ci en producción");
  if (app === "app-usuario" || app === "workspace") {
    const phoneSecret = process.env.PHONE_VERIFY_SECRET;
    if (phoneSecret && phoneSecret.trim().length < 32) {
      invalid.push("PHONE_VERIFY_SECRET debe tener al menos 32 caracteres");
    }
  }
}
if (invalid.length) {
  console.error(`[env:${app}] Configuración inválida: ${invalid.join("; ")}`);
  process.exit(1);
}

/* ARQ-5 (auditoría fase 4): `required` solo cubría 3 variables para app-usuario,
   así que el build pasaba sin Sentry ni flags de CSP y la observabilidad y la
   seguridad se degradaban en silencio. Estas no bloquean el build (muchos
   entornos legítimos no las usan) pero se avisa para que la ausencia sea
   deliberada y no un olvido. */
const recommendedByApp = {
  "app-usuario": [
    ["NEXT_PUBLIC_RUUM_AMBIENTE", "sin ella staging emite CSP bloqueante en vez de Report-Only"],
    ["NEXT_PUBLIC_APP_VERSION", "Sentry reporta sin versión de release"],
    ["SENTRY_DSN", "sin ella no se capturan ni alertan errores críticos de servidor en producción"],
    ["NEXT_PUBLIC_SENTRY_DSN", "sin ella no se capturan ni alertan errores críticos de cliente en producción"],
    ["NEXT_PUBLIC_APP_URL", "se usa para redirects absolutos en /pasaporte"]
  ]
};
const recommended = (recommendedByApp[app] ?? []).filter(([name]) => !process.env[name]?.trim());
if (recommended.length) {
  const detalle = recommended.map(([name, motivo]) => `${name} (${motivo})`).join("; ");
  if (hostedBuild) console.warn(`[env:${app}] Recomendadas no configuradas: ${detalle}`);
  else console.log(`[env:${app}] Recomendadas ausentes (informativo): ${detalle}`);
}

console.log(`[env:${app}] configuración válida (${prod ? "production" : "non-production"}).`);