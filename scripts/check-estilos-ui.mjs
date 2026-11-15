#!/usr/bin/env node
/**
 * Candado del sistema base v2 (design-system/docs/sistema-base-v2.md).
 *
 * 1. Zonas migradas (config/estilos-ui.json → "migradas"): CERO estilos sueltos.
 * 2. Resto de la app: trinquete. Ningún archivo puede tener más infracciones
 *    que en la línea base; al bajar, se actualiza la línea base con --actualizar.
 *
 * Infracciones:
 *  - hex          colores hexadecimales (#0a2342) y rgb()/rgba()/hsl() escritos a mano
 *  - paleta       paleta por defecto de Tailwind (slate-500, blue-600, emerald-50…)
 *  - texto        tamaños de letra arbitrarios (text-[13px], font-size: 13px)
 *  - radio        radios arbitrarios (rounded-[22px], border-radius: 7px)
 *  - dark         variantes dark: (el tema lo resuelve la capa ui-*)
 *
 * Uso: node scripts/check-estilos-ui.mjs [--actualizar] [--detalle]
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = path.join(RAIZ, "config/estilos-ui.json");
const config = JSON.parse(readFileSync(CONFIG, "utf8"));
const actualizar = process.argv.includes("--actualizar");
const detalle = process.argv.includes("--detalle");

const PALETA = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const REGLAS = {
  hex: [/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/g, /\b(?:rgba?|hsla?)\(\s*\d/g],
  paleta: [new RegExp(`\\b(?:bg|text|border(?:-[trblxyse])?|ring|outline|fill|stroke|from|via|to|divide|placeholder|shadow|decoration|accent|caret)-(?:${PALETA})-\\d{2,3}\\b`, "g")],
  texto: [/\btext-\[\d+(?:\.\d+)?(?:px|rem|em)\]/g, /font-size:\s*\d+(?:\.\d+)?px/g],
  radio: [/\brounded(?:-[a-z]{1,2})?-\[[^\]]+\]/g, /border-radius:\s*\d+(?:\.\d+)?px/g],
  dark: [/\bdark:[\w[\]#/.-]+/g],
};

const EXT = new Set([".tsx", ".ts", ".css", ".jsx"]);
function* archivos(dir) {
  for (const nombre of readdirSync(dir)) {
    if (nombre === "node_modules" || nombre.startsWith(".")) continue;
    const ruta = path.join(dir, nombre);
    const st = statSync(ruta);
    if (st.isDirectory()) yield* archivos(ruta);
    else if (EXT.has(path.extname(nombre)) && !/\.(test|spec|stories)\.[tj]sx?$/.test(nombre)) yield ruta;
  }
}

function contar(texto) {
  const sinComentarios = texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const r = {};
  for (const [regla, expresiones] of Object.entries(REGLAS)) {
    r[regla] = expresiones.reduce((n, re) => n + (sinComentarios.match(re)?.length ?? 0), 0);
  }
  return r;
}
const total = (r) => Object.values(r).reduce((a, b) => a + b, 0);
const rel = (f) => path.relative(RAIZ, f).split(path.sep).join("/");
const enZona = (f, zonas) => zonas.some((z) => rel(f) === z || rel(f).startsWith(`${z.replace(/\/$/, "")}/`));

let fallos = 0;
const lineaBase = {};
const resumen = { hex: 0, paleta: 0, texto: 0, radio: 0, dark: 0 };

for (const raiz of config.raices) {
  for (const f of archivos(path.join(RAIZ, raiz))) {
    if (enZona(f, config.excluir ?? [])) continue;
    const r = contar(readFileSync(f, "utf8"));
    const n = total(r);
    if (enZona(f, config.migradas)) {
      if (n > 0) {
        fallos++;
        console.error(`✗ ${rel(f)} está migrado y tiene estilos sueltos: ${JSON.stringify(r)}`);
      }
      continue;
    }
    for (const k of Object.keys(resumen)) resumen[k] += r[k];
    if (n > 0) lineaBase[rel(f)] = n;
  }
}

const previa = config.lineaBase ?? {};
if (!actualizar) {
  for (const [archivo, n] of Object.entries(lineaBase)) {
    const antes = previa[archivo] ?? 0;
    if (n > antes) {
      fallos++;
      console.error(`✗ ${archivo}: ${n} estilos sueltos (línea base ${antes}). Usa @ruum/ui/base y clases *-ui-*.`);
    } else if (detalle && n < antes) {
      console.log(`↓ ${archivo}: ${antes} → ${n}`);
    }
  }
}

const totalActual = total(resumen);
const totalPrevio = Object.values(previa).reduce((a, b) => a + b, 0);
console.log(
  `[estilos-ui] zonas migradas: ${config.migradas.length} · estilos sueltos en el resto: ${totalActual} (línea base ${totalPrevio}) ${JSON.stringify(resumen)}`,
);

if (actualizar) {
  config.lineaBase = Object.fromEntries(Object.entries(lineaBase).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(CONFIG, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`[estilos-ui] línea base actualizada (${Object.keys(lineaBase).length} archivos).`);
} else if (totalActual < totalPrevio) {
  console.log("[estilos-ui] Bajaron los estilos sueltos: ejecuta `pnpm check:estilos --actualizar` para fijar la nueva línea base.");
}

if (fallos > 0 && !actualizar) {
  console.error(`[estilos-ui] ${fallos} infracción(es).`);
  process.exit(1);
}
if (!existsSync(CONFIG)) process.exit(1);
