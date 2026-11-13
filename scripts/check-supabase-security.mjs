import fs from "node:fs";
import path from "node:path";

const migrationsDir = path.resolve("supabase/migrations");
const generatedSnapshots = new Set(["20260807061826_remote_schema.sql"]);
const explicitlyPublicTables = new Set([
  // Catálogo legal versionado, sin datos de cuentas/operación.
  "versiones_documento_consentimiento",
  // Catálogo operativo público usado por el flujo de cotización.
  "operaciones",
]);

// Excepciones de solo lectura limitadas a la migración que documenta cada caso.
const grantsLecturaRevisados = new Map([
  ["20261016071320_restaura_select_conductores_anon_rls.sql", new Set(["conductores"])],
  ["20261017014451_rr2026020_catalogos_fiscales_sat.sql", new Set(["sat_regimenes_fiscales", "sat_usos_cfdi"])],
]);

const quitarComentarios = (texto) => texto
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/--[^\r\n]*/g, "");

const hallazgos = [];
for (const nombre of fs.readdirSync(migrationsDir).filter((entrada) => entrada.endsWith(".sql"))) {
  if (generatedSnapshots.has(nombre)) continue;
  const texto = quitarComentarios(fs.readFileSync(path.join(migrationsDir, nombre), "utf8"));
  for (const sentencia of texto.split(";")) {
    if (!/^\s*grant\b/i.test(sentencia) || !/\bto\s+(?:[^;]*,\s*)?"?anon"?\b/i.test(sentencia)) continue;
    const grant = sentencia.match(/^\s*grant\s+([\s\S]+?)\s+on\s+(?:table\s+)?([\s\S]+?)\s+to\s/i);
    if (!grant) continue;
    for (const objeto of grant[2].split(",")) {
      const tabla = objeto.trim().match(/^"?public"?\."?([a-z_][a-z0-9_]*)"?$/i)?.[1]?.toLowerCase();
      if (!tabla || explicitlyPublicTables.has(tabla)) continue;
      if (grant[1].trim().toLowerCase() === "select" && grantsLecturaRevisados.get(nombre)?.has(tabla)) continue;
      hallazgos.push(`${nombre}: GRANT a anon sobre public.${tabla}`);
    }
  }
}

if (hallazgos.length) {
  console.error("Se detectaron grants de tabla a anon fuera del allowlist:");
  for (const hallazgo of hallazgos) console.error(`- ${hallazgo}`);
  process.exit(1);
}

console.log("Supabase security grant scan: OK (snapshots generados excluidos; tablas públicas explícitas revisadas).");
