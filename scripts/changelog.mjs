// Genera CHANGELOG.md desde Conventional Commits.
// Uso: node scripts/changelog.mjs [--write] [--since <tag|sha>] [--version <x.y.z>]
// Sin --write imprime a stdout. Política de versionado: docs/runbooks/release.md.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

export const ORDEN_SECCIONES = [
  "feat", "fix", "perf", "refactor", "docs",
  "test", "ci", "build", "chore", "revert", "style",
];

export const TITULOS = {
  feat: "Características",
  fix: "Correcciones",
  perf: "Rendimiento",
  refactor: "Refactors",
  docs: "Documentación",
  test: "Pruebas",
  ci: "CI",
  build: "Build",
  chore: "Mantenimiento",
  revert: "Reversiones",
  style: "Estilo",
};

export function parseCommit(hash, subject) {
  const m = subject.match(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([a-z0-9-]+)\))?(!)?: (.+)$/);
  if (!m) return null;
  return { hash, tipo: m[1], scope: m[3] ?? null, breaking: Boolean(m[4]), asunto: m[5].trim() };
}

export function bumpSugerido(commits) {
  if (commits.some((c) => c.breaking)) return "major";
  if (commits.some((c) => c.tipo === "feat")) return "minor";
  return "patch";
}

export function agrupar(commits) {
  const grupos = new Map(ORDEN_SECCIONES.map((t) => [t, []]));
  for (const c of commits) grupos.get(c.tipo).push(c);
  return [...grupos.entries()].filter(([, cs]) => cs.length > 0);
}

export function renderSeccion(version, fecha, commits) {
  const lineas = [`## ${version} — ${fecha}`, ""];
  const rompientes = commits.filter((c) => c.breaking);
  if (rompientes.length > 0) {
    lineas.push("### ⚠️ Cambios incompatibles", "");
    for (const c of rompientes) {
      lineas.push(`- ${c.scope ? `**${c.scope}**: ` : ""}${c.asunto} (${c.hash.slice(0, 7)})`);
    }
    lineas.push("");
  }
  for (const [tipo, cs] of agrupar(commits)) {
    lineas.push(`### ${TITULOS[tipo]}`, "");
    for (const c of cs) {
      if (c.breaking) continue;
      lineas.push(`- ${c.scope ? `**${c.scope}**: ` : ""}${c.asunto} (${c.hash.slice(0, 7)})`);
    }
    lineas.push("");
  }
  return lineas.join("\n").trimEnd() + "\n";
}

function ultimoTag() {
  try {
    return execFileSync("git", ["describe", "--tags", "--abbrev=0", "--match=v*"], { cwd: RAIZ, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function commitsDesde(rango) {
  const out = execFileSync("git", ["log", `${rango}`, "--format=%H %s", "--no-merges"], { cwd: RAIZ, encoding: "utf8" });
  return out.split("\n").map((l) => l.trim()).filter(Boolean)
    .map((l) => {
      const i = l.indexOf(" ");
      return parseCommit(l.slice(0, i), l.slice(i + 1));
    })
    .filter(Boolean);
}

const args = process.argv.slice(2);
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename || "")) {
  const flag = (nombre) => {
    const i = args.indexOf(nombre);
    return i === -1 ? null : args[i + 1] ?? null;
  };
  const since = flag("--since") ?? ultimoTag() ?? "HEAD";
  const rango = since === "HEAD" ? "HEAD" : `${since}..HEAD`;
  const commits = commitsDesde(rango);
  if (commits.length === 0) {
    console.log(`[changelog] sin commits convencionales en ${rango}.`);
    process.exit(0);
  }
  const version = flag("--version") ?? "Sin publicar";
  const fecha = new Date().toISOString().slice(0, 10);
  const seccion = renderSeccion(version, fecha, commits);
  if (args.includes("--write")) {
    const ruta = join(RAIZ, "CHANGELOG.md");
    const previo = existsSync(ruta) ? readFileSync(ruta, "utf8") : "# Changelog\n";
    const cuerpo = previo.replace(/^# Changelog\n?/, "").trim();
    writeFileSync(ruta, `# Changelog\n\n${seccion}\n${cuerpo ? cuerpo + "\n" : ""}`);
    console.log(`[changelog] ${commits.length} commits → CHANGELOG.md (bump sugerido: ${bumpSugerido(commits)})`);
  } else {
    process.stdout.write(seccion);
    process.stdout.write(`\n[bump sugerido: ${bumpSugerido(commits)}]\n`);
  }
}
