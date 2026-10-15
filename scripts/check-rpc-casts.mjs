#!/usr/bin/env node
// FIX C1 (ticket arquitectura Fase 4): prohibido añadir `as never` / `as any`
// fuera de los puntos contenidos y documentados.
//
// - `packages/api/src/services/traslados.ts` y `tarifas.ts` migraron a
//   `rpcTipado` (registro en `packages/api/src/supabase/funciones.ts):
//   tolerancia CERO en esos archivos.
// - `funciones.ts` conserva exactamente los 2 casts del helper (único punto
//   donde se relaja el genérico de supabase-js, documentado in situ).
// - Resto del monorepo: el total no puede crecer respecto a la línea base
//   (ratchet). Cada migración futura debe BAJAR esta constante, nunca subirla.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["packages/api/src", "packages/shared/src", "packages/ui/src"];

// Línea base 2026-10-15 (tras migrar traslados.ts + tarifas.ts a rpcTipado).
const BASELINE_TOTAL = 47;

const TOLERANCIA_CERO = [
  "packages/api/src/services/traslados.ts",
  "packages/api/src/services/tarifas.ts",
];

// Casts documentados dentro del helper (ni uno más).
const PRESUPUESTO_FUNCIONES = {
  archivo: "packages/api/src/supabase/funciones.ts",
  maximo: 2,
};

function sinComentarios(contenido) {
  return contenido
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split("\n")
    .filter((linea) => !linea.trim().startsWith("//"))
    .join("\n");
}

function* archivosTs(dir) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      yield* archivosTs(ruta);
      continue;
    }
    if (!ruta.endsWith(".ts") || ruta.endsWith(".test.ts") || ruta.includes("__tests__")) continue;
    yield ruta;
  }
}

function contar(raiz, rel) {
  const contenido = sinComentarios(readFileSync(join(raiz, rel), "utf8"));
  return (contenido.match(/\bas\s+(never|any)\b/g) ?? []).length;
}

let fallos = 0;
let total = 0;
const porArchivo = new Map();

for (const dir of DIRS) {
  for (const ruta of archivosTs(join(RAIZ, dir))) {
    const rel = ruta.substring(RAIZ.length + 1).replace(/\\/g, "/");
    const n = contar(RAIZ, rel);
    if (n > 0) {
      total += n;
      porArchivo.set(rel, n);
    }
  }
}

for (const rel of TOLERANCIA_CERO) {
  const n = porArchivo.get(rel) ?? 0;
  if (n > 0) {
    console.error(`[rpc-casts] PROHIBIDO: ${rel} tiene ${n} cast(s) 'as never/as any' (tolerancia cero, usar rpcTipado).`);
    fallos++;
  }
}

const nFunciones = porArchivo.get(PRESUPUESTO_FUNCIONES.archivo) ?? 0;
if (nFunciones > PRESUPUESTO_FUNCIONES.maximo) {
  console.error(
    `[rpc-casts] ${PRESUPUESTO_FUNCIONES.archivo} tiene ${nFunciones} casts (máximo documentado: ${PRESUPUESTO_FUNCIONES.maximo}).`
  );
  fallos++;
}

if (total > BASELINE_TOTAL) {
  console.error(`[rpc-casts] Total ${total} supera la línea base ${BASELINE_TOTAL}: no se puede añadir 'as never/as any' nuevo; migrar a rpcTipado y bajar la base.`);
  for (const [rel, n] of [...porArchivo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.error(`  ${n}  ${rel}`);
  }
  fallos++;
}

if (fallos > 0) process.exit(1);
console.log(`[rpc-casts] OK: total ${total} (base ${BASELINE_TOTAL}), archivos migrados sin casts.`);
