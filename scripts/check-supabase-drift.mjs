import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const packagePath = require.resolve("supabase/package.json");
const cli = resolve(dirname(packagePath), require(packagePath).bin.supabase);

const modo = process.env.SUPABASE_DRIFT_MODE === "linked" ? "--linked" : "--local";
const resultado = spawnSync(process.execPath, [cli,
  "db", "diff", modo, "--schema", "public,storage", "--use-migra",
], { encoding: "utf8" });

if (resultado.status !== 0) {
  process.stderr.write(resultado.stderr || resultado.stdout || `${resultado.error?.message || `supabase db diff falló${resultado.signal ? ` (${resultado.signal})` : ""}.`}\n`);
  process.exit(resultado.status ?? 1);
}

const salida = (resultado.stdout || "").trim();
let diff = salida;
// Las versiones recientes del CLI devuelven un objeto JSON incluso sin drift.
try {
  const respuesta = JSON.parse(salida);
  if (typeof respuesta.diff === "string") diff = respuesta.diff.trim();
} catch {
  // Compatibilidad con versiones que imprimen directamente el SQL.
}
if (diff) {
  console.error(`Se detectó drift de esquema/policies (${modo}). No se permiten cambios manuales; crea una migración versionada.`);
  console.error(diff);
  process.exit(1);
}

console.log(`Supabase schema/policy drift: OK (${modo}).`);
