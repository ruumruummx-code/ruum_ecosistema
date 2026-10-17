// Convención única de migraciones Supabase + prohibición de datos de prueba.
// Ver supabase/migrations/README.md (baseline v1 congelado, reglas y allowlists).
//
// Reglas:
//  1. Nombre: YYYYMMDDHHMMSS_slug_snake_case.sql (lo genera `supabase migration new`).
//  2. Versiones estrictamente crecientes en orden lexicográfico.
//  3. El slug no puede contener fixture|e2e|seed|prueba|test|dummy|mock,
//     salvo archivos legacy congelados (history inmutable, ver README).
//  4. Sin DML de datos a nivel superior: los INSERT INTO solo se permiten en
//     tablas de referencia operativas (allowlist); DELETE/TRUNCATE/COPY, nunca
//     (salvo cleanups correctivos legacy congelados). Los INSERT dentro de
//     cuerpos de funciones/triggers (lógica de negocio) no cuentan: se excluyen
//     junto con comentarios y literales antes de analizar.
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(RAIZ, "supabase", "migrations");

// Helpers E2E congelados: crean preparar_conductor_e2e(), usado por
// apps/app-conductor/tests/global-setup.ts. No se tocan (baseline v1) y no se
// aceptan más archivos de este tipo: los nuevos helpers van a tests/e2e/fixtures/.
const LEGACY_SLUG = new Set([
  "20260904040000_fixture_conductor_e2e.sql",
  "20260907013042_make_conductor_e2e_fixture_idempotent.sql",
]);

// Cleanups correctivos congelados (DELETE a nivel superior sobre datos
// existentes, aplicados una sola vez). Prohibidos hacia adelante.
const LEGACY_DATA_MUTATION = new Set([
  "20260711000116_versionado_documentos_identidad.sql",
  "20260717000500_llegada_destino_excepcion_rpc_no_global.sql",
  "20260717000600_llegada_destino_solo_traslado_en_curso.sql",
]);

// Seeds operativos de referencia: configuración inmutable sin la cual una BD
// fresca no funciona (buckets, tablas de transiciones, catálogos, políticas,
// backfills correctivos INSERT..SELECT sobre datos existentes). Cualquier tabla
// nueva requiere actualizar esta lista de forma deliberada.
const TABLAS_REFERENCIA = new Set([
  "storage.buckets",
  "public.estado_transiciones_validas",
  "public.expediente_conductor_transiciones",
  "public.documento_conductor_transiciones",
  "public.estado_operativo_transiciones_validas",
  "public.versiones_documento_consentimiento",
  "public.consentimientos_usuario",
  "public.historial_estados_solicitud_conductor",
  "public.historial_estados_traslado",
  "public.tarifas_vehiculo",
  "public.tarifas_gama",
  "public.tarifas_condicion",
  "public.tarifas_horario",
  "public.tarifas_dia",
  "public.tarifas_config",
  "public.certificacion_pago_conductor",
  "public.catalogo_vehiculos_tarifa",
  // Catálogos fiscales de referencia requeridos por la validación persistente
  // de RFC/régimen/uso CFDI (RR-2026-020); no contienen datos de contribuyentes.
  "public.sat_regimenes_fiscales",
  "public.sat_usos_cfdi",
  "public.configuracion_contactos_soporte",
  "public.politicas_version_app",
  "public.configuracion_admin",
  "public.sla_reglas_operativas",
  "public.sla_policies",
  "public.metas_registro_conductor",
  "public.empresa_roles",
  "public.empresa_rol_permisos",
  "public.empresa_miembros",
  "public.asignaciones",
  "public.custodia_evento_fotos",
  "public.tracking_sesiones",
  "public.incidencia_historial",
  "public.cotizaciones",
  "public.obs_retencion_politicas",
  "public.admins",
  "private.politica_asignacion",
]);

const SLUG_SUBSTRING = /fixture|e2e|seed|dummy|mock/;
const SLUG_TOKEN = new Set(["test", "tests"]);
// Nota: "prueba" NO se banea: es vocabulario de producto
// (modo_prueba_supervisada). Los marcadores de arriba no tienen ese problema.

function sinDdlNoAnalizable(contenido) {
  let s = contenido
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
  // Cuerpos dollar-quoted (funciones/triggers): emparejar $tag$ de a pares.
  const tokens = [...s.matchAll(/\$[A-Za-z_]*\$/g)];
  if (tokens.length % 2 !== 0) return { error: "dollar-quoting desbalanceado" };
  let fuera = "";
  let cursor = 0;
  for (let i = 0; i < tokens.length; i += 2) {
    fuera += s.slice(cursor, tokens[i].index);
    cursor = tokens[i + 1].index + tokens[i + 1][0].length;
  }
  fuera += s.slice(cursor);
  // Literales '...' (con '' escapado) y sentencias GRANT (p. ej. GRANT TRUNCATE).
  fuera = fuera.replace(/'(?:[^']|'')*'/g, " ");
  fuera = fuera.replace(/\bgrant\s+[^;]+;/gi, " ");
  return { sql: fuera };
}

const archivos = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();
let fallos = 0;
let anterior = "";
for (const archivo of archivos) {
  const marca = `migrations/${archivo}`;
  const m = archivo.match(/^(\d{14})_([a-z0-9_]+)\.sql$/);
  if (!m) {
    console.error(`[migraciones] NOMBRE inválido (usar supabase migration new): ${marca}`);
    fallos++;
    continue;
  }
  if (m[1] <= anterior) {
    console.error(`[migraciones] VERSIÓN no creciente: ${marca} tras ${anterior}`);
    fallos++;
  }
  anterior = m[1];
  if (
    (SLUG_SUBSTRING.test(m[2]) || m[2].split("_").some((t) => SLUG_TOKEN.has(t))) &&
    !LEGACY_SLUG.has(archivo)
  ) {
    console.error(`[migraciones] SLUG de prueba/fixture prohibido: ${marca} (los fixtures van a test/ o supabase/seed.sql)`);
    fallos++;
  }
  const crudo = readFileSync(join(DIR, archivo), "utf8");
  const { sql, error } = sinDdlNoAnalizable(crudo);
  if (error) {
    console.error(`[migraciones] ${error}: ${marca}`);
    fallos++;
    continue;
  }
  for (const ins of sql.matchAll(/insert\s+into\s+([a-z0-9_]+(?:\.[a-z0-9_]+)?)/gi)) {
    const tabla = ins[1].replace(/"/g, "").toLowerCase();
    if (!TABLAS_REFERENCIA.has(tabla)) {
      console.error(`[migraciones] INSERT top-level en tabla no referencia (${tabla}): ${marca} — mover a test/ o seed.sql, o allowlistar`);
      fallos++;
    }
  }
  const mutacion =
    sql.match(/delete\s+from\s+[a-z0-9_.]+/i) ||
    sql.match(/truncate\s+(?:table\s+)?[a-z0-9_., ]+/i) ||
    sql.match(/\bcopy\s+[a-z0-9_.]+\s+from\b/i);
  if (mutacion && !LEGACY_DATA_MUTATION.has(archivo)) {
    console.error(`[migraciones] DELETE/TRUNCATE/COPY top-level prohibido (${mutacion[0].trim().slice(0, 60)}): ${marca}`);
    fallos++;
  }
}

if (fallos > 0) {
  console.error(`[migraciones] ${fallos} violación(es). Ver supabase/migrations/README.md.`);
  process.exit(1);
}
console.log(`[migraciones] OK: ${archivos.length} archivos, convención y política de datos conformes (baseline v1).`);
