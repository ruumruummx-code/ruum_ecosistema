// Controles de arquitectura para la app Android nativa (sin Android SDK).
// Estrategia conductor: docs/runbooks/estrategia-conductor.md.
//  1. Mismo canal de distribución que Capacitor (applicationId release idéntico,
//     debug con sufijo para coexistir instalada).
//  2. Sin secretos en el cliente: solo publishable key vía BuildConfig; jamás
//     service_role ni claves de proveedor.
//  3. local.properties ignorado y sin trackear.
//  4. Manifest: sin cleartext, solo permisos declarados deliberadamente.
//  5. versionName alineado con config/app-version.json (permite sufijo -native).
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const NATIVA = join(RAIZ, "apps", "app-conductor-native");
const MAIN = join(NATIVA, "app", "src", "main");
let fallos = 0;
const mal = (msg) => { console.error(`[nativa] ${msg}`); fallos++; };

function kotlinSources(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== "build") kotlinSources(p, acc); }
    else if (/\.(kt|kts|xml)$/.test(e)) acc.push(p);
  }
  return acc;
}

// 1-2. Canal de distribución.
const gradleApp = readFileSync(join(NATIVA, "app", "build.gradle.kts"), "utf8");
const appId = gradleApp.match(/applicationId\s*=\s*"([^"]+)"/)?.[1];
const capacitor = readFileSync(join(RAIZ, "apps", "app-conductor", "capacitor.config.ts"), "utf8");
const capacitorId = capacitor.match(/appId:\s*"([^"]+)"/)?.[1];
if (!appId || appId !== "com.moviliax.ruumruum.conductor") mal(`applicationId release inesperado: ${appId}`);
if (appId !== capacitorId) mal(`applicationId nativo (${appId}) != Capacitor (${capacitorId}): se bifurca el canal`);
if (!/applicationIdSuffix\s*=\s*"\.native\.debug"/.test(gradleApp)) mal("falta applicationIdSuffix .native.debug (coexistencia con la app actual)");

// 3. Sin secretos en el cliente.
const fuentes = kotlinSources(MAIN);
const PATRONES = [/service_role/i, /\bsk_live_[0-9A-Za-z]{10,}/, /\bwhsec_[0-9A-Za-z]{10,}/, /BEGIN [A-Z ]*PRIVATE KEY/, /eyJhbGciOi[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/];
for (const f of fuentes) {
  const rel = f.slice(RAIZ.length + 1);
  const lineas = readFileSync(f, "utf8").split("\n");
  lineas.forEach((linea, i) => {
    if (linea.trim().startsWith("//") || linea.trim().startsWith("*")) return;
    for (const re of PATRONES) {
      if (re.test(linea)) mal(`secreto/privilegio en cliente ${rel}:${i + 1} (${re})`);
    }
  });
}
const provider = readFileSync(join(MAIN, "java", "com", "moviliax", "ruumruum", "conductor", "core", "SupabaseProvider.kt"), "utf8");
if (!provider.includes("SUPABASE_PUBLISHABLE_KEY")) mal("SupabaseProvider no usa SUPABASE_PUBLISHABLE_KEY");

// 4. local.properties fuera del repo.
try {
  execFileSync("git", ["check-ignore", "-q", "apps/app-conductor-native/local.properties"], { cwd: RAIZ });
} catch { mal("local.properties no está ignorado"); }
const tracked = execFileSync("git", ["ls-files", "apps/app-conductor-native"], { cwd: RAIZ, encoding: "utf8" });
if (tracked.split("\n").some((l) => l.trim().endsWith("local.properties"))) mal("local.properties trackeado");

// 5. Manifest.
const manifest = readFileSync(join(MAIN, "AndroidManifest.xml"), "utf8");
if (!manifest.includes('android.permission.INTERNET')) mal("falta permiso INTERNET");
if (!manifest.includes('usesCleartextTraffic="false"')) mal("cleartext debe estar prohibido");

// 6. Paridad de versión.
const canon = JSON.parse(readFileSync(join(RAIZ, "config", "app-version.json"), "utf8")).version;
const vName = gradleApp.match(/versionName\s*=\s*"([^"]+)"/)?.[1];
if (!vName || !vName.startsWith(`${canon}-`) && vName !== canon) mal(`versionName ${vName} no parte de ${canon} (ver estrategia-conductor.md)`);

if (fallos > 0) { console.error(`[nativa] ${fallos} violación(es).`); process.exit(1); }
console.log(`[nativa] OK: ${fuentes.length} fuentes, canal ${appId}, versión ${vName} sobre base ${canon}.`);
