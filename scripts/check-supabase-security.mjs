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

// Definiciones del historial inmutable corregidas por migraciones posteriores.
const definicionesHistoricasSinSearchPath = new Set([
  "20260708000001_roles_permisos.sql:public.es_admin",
  "20260708000019_fix_recursion_usuarios.sql:public.empresa_id_del_titular_actual",
  "20260908000002_equipo_empresa.sql:public.mis_empresas_miembro",
  "20260908000002_equipo_empresa.sql:public.empresa_tiene_permiso",
  "20260908000002_equipo_empresa.sql:public.empresa_invitar_miembro",
  "20260908000002_equipo_empresa.sql:public.empresa_cambiar_rol_miembro",
  "20260908000002_equipo_empresa.sql:public.empresa_remover_miembro",
]);

function sentenciasDdl(sql) {
  // Los literales y los cuerpos de las funciones pueden contener ";" o SET
  // search_path en su texto. Solo interesan las opciones del DDL exterior.
  const comentariosYLiterales = /--[^\r\n]*|\/\*[\s\S]*?\*\/|(\$(?:[a-z_]\w*)?\$)[\s\S]*?\1|\bE'(?:\\[\s\S]|''|[^'\\])*'|'(?:''|[^'])*'|"(?:[^"]|"")*"/gi;
  return sql.replace(comentariosYLiterales, (token) => {
    return token.startsWith('"') ? token.replaceAll(";", "\u0001") : " ";
  }).split(";");
}

const hallazgos = [];
for (const nombre of fs.readdirSync(migrationsDir).filter((entrada) => entrada.endsWith(".sql")).sort()) {
  if (generatedSnapshots.has(nombre)) continue;
  const sentencias = sentenciasDdl(fs.readFileSync(path.join(migrationsDir, nombre), "utf8"));
  for (const sentencia of sentencias) {
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

  for (const sentencia of sentencias) {
    const cabecera = sentencia.split(/\bbegin\s+atomic\b/i, 1)[0];
    const funcion = cabecera.match(
      /^\s*(?:create(?:\s+or\s+replace)?|alter)\s+(?:function|procedure)\s+((?:"[^"]+"|[\w$]+)(?:\s*\.\s*(?:"[^"]+"|[\w$]+))?)/i,
    )?.[1];
    if (!funcion || !/\bsecurity\s+definer\b/i.test(cabecera)) continue;
    if (/\bset\s+(?:"search_path"|search_path)\s*(?:=|to\b)/i.test(cabecera)) continue;
    if (definicionesHistoricasSinSearchPath.delete(`${nombre}:${funcion}`)) continue;
    hallazgos.push(`${nombre}: ${funcion} SECURITY DEFINER sin SET search_path`);
  }
}

if (hallazgos.length) {
  console.error("Se detectaron incumplimientos de seguridad de Supabase:");
  for (const hallazgo of hallazgos) console.error(`- ${hallazgo}`);
  process.exit(1);
}

console.log("Supabase security: OK (grants de tabla a anon y search_path de SECURITY DEFINER).");
