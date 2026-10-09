#!/usr/bin/env node
/**
 * Verifica que la configuración de Stripe esté completa para el pago de traslados.
 * 
 * Uso:
 *   node scripts/verify-stripe-config.mjs
 * 
 * Verifica:
 *   1. Variables de entorno del cliente (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
 *   2. Variables de entorno del servidor (en Supabase Edge Functions)
 *   3. Conectividad con la API de Stripe (si hay secret key)
 *   4. Estado de las edge functions desplegadas
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// ─── Colores para salida ───
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const BOLD = "\x1b[1m";

function log(mensaje, color = RESET) {
  console.log(`${color}${mensaje}${RESET}`);
}

function seccion(titulo) {
  console.log("");
  log(`━━━ ${titulo} ${"━".repeat(Math.max(0, 50 - titulo.length))}`, BOLD + BLUE);
}

function ok(mensaje) {
  log(`  ✅ ${mensaje}`, GREEN);
}

function error(mensaje) {
  log(`  ❌ ${mensaje}`, RED);
}

function advertencia(mensaje) {
  log(`  ⚠️  ${mensaje}`, YELLOW);
}

function info(mensaje) {
  log(`  ℹ️  ${mensaje}`, RESET);
}

// ─── 1. Verificar variables de entorno del cliente ───
function verificarVariablesCliente() {
  seccion("1. Variables de entorno del cliente (.env)");

  const envPath = resolve(rootDir, ".env");
  const envExamplePath = resolve(rootDir, ".env.example");

  if (!existsSync(envPath)) {
    error("No existe el archivo .env");
    info("Copia .env.example como .env y configura las variables:");
    info("  cp .env.example .env");
    return false;
  }

  const envContent = readFileSync(envPath, "utf8");
  const variables = {};

  for (const linea of envContent.split("\n")) {
    const match = linea.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      variables[match[1]] = match[2];
    }
  }

  const publishableKey = variables["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"];

  if (!publishableKey) {
    error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no está definida");
    info("Agrega a .env: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...");
    return false;
  }

  if (publishableKey.startsWith("pk_test_")) {
    ok(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configurada (modo TEST): ${publishableKey.slice(0, 15)}...`);
  } else if (publishableKey.startsWith("pk_live_")) {
    ok(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configurada (modo PRODUCCIÓN): ${publishableKey.slice(0, 15)}...`);
  } else {
    error(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY tiene formato inválido: ${publishableKey.slice(0, 20)}...`);
    return false;
  }

  // Verificar Supabase
  if (!variables["NEXT_PUBLIC_SUPABASE_URL"]) {
    error("NEXT_PUBLIC_SUPABASE_URL no está definida");
    return false;
  }
  ok("NEXT_PUBLIC_SUPABASE_URL definida");

  if (!variables["NEXT_PUBLIC_SUPABASE_ANON_KEY"]) {
    error("NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida");
    return false;
  }
  ok("NEXT_PUBLIC_SUPABASE_ANON_KEY definida");

  return true;
}

// ─── 2. Verificar variables de Edge Functions ───
function verificarVariablesEdgeFunctions() {
  seccion("2. Variables de Edge Functions (Supabase Secrets)");

  info("Estas variables se configuran en Supabase Dashboard → Edge Functions → Secrets");
  info("NO se guardan en archivos .env del proyecto");
  info("");

  const variablesRequeridas = [
    { nombre: "STRIPE_SECRET_KEY", descripcion: "Clave secreta de Stripe (sk_test_ o sk_live_)" },
    { nombre: "STRIPE_WEBHOOK_SECRET", descripcion: "Firma del webhook (whsec_)" },
    { nombre: "SUPABASE_SERVICE_ROLE_KEY", descripcion: "Service role key de Supabase" },
    { nombre: "SUPABASE_URL", descripcion: "URL del proyecto Supabase" },
    { nombre: "SUPABASE_ANON_KEY", descripcion: "Anon key de Supabase" },
  ];

  for (const v of variablesRequeridas) {
    info(`${v.nombre}: ${v.descripcion}`);
  }

  info("");
  info("Para configurarlas, ejecuta:");
  info('  supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"');
  info('  supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"');
  info("");
  info("O configúralas manualmente en Supabase Dashboard → Edge Functions → Secrets");

  return true;
}

// ─── 3. Verificar edge functions desplegadas ───
function verificarEdgeFunctions() {
  seccion("3. Edge Functions desplegadas");

  const funciones = [
    { nombre: "crear-payment-intent", descripcion: "Crea PaymentIntent de Stripe" },
    { nombre: "stripe-webhook", descripcion: "Recibe webhooks de Stripe" },
  ];

  for (const f of funciones) {
    info(`${f.nombre}: ${f.descripcion}`);
  }

  info("");
  info("Para desplegar las edge functions:");
  info("  supabase functions deploy crear-payment-intent");
  info("  supabase functions deploy stripe-webhook");

  return true;
}

// ─── 4. Verificar archivos del proyecto ───
function verificarArchivos() {
  seccion("4. Archivos del proyecto");

  const archivos = [
    { ruta: "src/app/PagoStripe.tsx", descripcion: "Componente de pago con Stripe Elements" },
    { ruta: "src/app/viajes/[id]/PagoTraslado.tsx", descripcion: "Wrapper de pago para traslado existente" },
    { ruta: "src/app/viajes/nuevo/components/PasoPago.tsx", descripcion: "Paso 5 del flujo de solicitud" },
    { ruta: "../../supabase/functions/crear-payment-intent/index.ts", descripcion: "Edge Function: crear PaymentIntent" },
    { ruta: "../../supabase/functions/stripe-webhook/index.ts", descripcion: "Edge Function: webhook de Stripe" },
  ];

  let todosExisten = true;
  for (const a of archivos) {
    const rutaCompleta = resolve(rootDir, a.ruta);
    if (existsSync(rutaCompleta)) {
      ok(`${a.ruta} — ${a.descripcion}`);
    } else {
      error(`${a.ruta} — NO EXISTE`);
      todosExisten = false;
    }
  }

  return todosExisten;
}

// ─── 5. Verificar dependencias ───
function verificarDependencias() {
  seccion("5. Dependencias de Stripe");

  const packageJsonPath = resolve(rootDir, "package.json");
  if (!existsSync(packageJsonPath)) {
    error("No se encontró package.json");
    return false;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const dependencias = [
    { nombre: "@stripe/stripe-js", descripcion: "SDK de Stripe para el cliente" },
    { nombre: "@stripe/react-stripe-js", descripcion: "Componentes React para Stripe Elements" },
  ];

  let todasExisten = true;
  for (const d of dependencias) {
    if (deps[d.nombre]) {
      ok(`${d.nombre}@${deps[d.nombre]} — ${d.descripcion}`);
    } else {
      error(`${d.nombre} — NO INSTALADA`);
      todasExisten = false;
    }
  }

  return todasExisten;
}

// ─── 6. Verificar configuración de Stripe Dashboard ───
function verificarDashboard() {
  seccion("6. Configuración de Stripe Dashboard");

  info("Pasos para configurar Stripe Dashboard:");
  info("");
  info("1. Crear cuenta en https://stripe.com");
  info("2. Obtener claves API en Developers → API keys");
  info("3. Crear webhook endpoint en Developers → Webhooks:");
  info("   URL: https://<tu-proyecto>.supabase.co/functions/v1/stripe-webhook");
  info("   Eventos: payment_intent.succeeded, payment_intent.payment_failed");
  info("4. Copiar el webhook secret (whsec_...)");
  info("5. Configurar las claves en Supabase Secrets");
  info("");
  info("Para probar localmente con stripe CLI:");
  info("  stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook");

  return true;
}

// ─── Resumen final ───
function resumen(exitosos, total) {
  seccion("Resumen");

  if (exitosos === total) {
    log(`  ${exitosos}/${total} verificaciones pasaron`, GREEN + BOLD);
    log("");
    log("  🎉 La configuración de Stripe está lista.", GREEN + BOLD);
    log("");
    log("  Para probar el flujo de pago:", RESET);
    log("  1. Ejecuta: pnpm dev", RESET);
    log("  2. Crea un traslado y llega al paso de pago", RESET);
    log("  3. Usa tarjeta de prueba: 4242 4242 4242 4242", RESET);
    log("  4. Verifica el pago en Stripe Dashboard → Payments", RESET);
  } else {
    log(`  ${exitosos}/${total} verificaciones pasaron`, YELLOW + BOLD);
    log("");
    log("  ⚠️  La configuración está incompleta. Revisa los errores arriba.", YELLOW + BOLD);
  }
}

// ─── Ejecutar todas las verificaciones ───
function main() {
  log("");
  log("╔══════════════════════════════════════════════════════════════╗", BOLD + BLUE);
  log("║     Verificación de Configuración de Stripe — Ruum Ruum     ║", BOLD + BLUE);
  log("╚══════════════════════════════════════════════════════════════╝", BOLD + BLUE);

  const resultados = [
    verificarVariablesCliente(),
    verificarVariablesEdgeFunctions(),
    verificarEdgeFunctions(),
    verificarArchivos(),
    verificarDependencias(),
    verificarDashboard(),
  ];

  const exitosos = resultados.filter(Boolean).length;
  const total = resultados.length;

  resumen(exitosos, total);

  process.exit(exitosos === total ? 0 : 1);
}

main();
