/**
 * R1 — Fuente única de verdad para CSP/HSTS de app-usuario.
 * Delega en `@ruum/shared/seguridad` (mismo builder que conductor y panel).
 * Se mantiene este módulo como fachada para no romper imports existentes
 * (`./lib/csp`, `../src/middleware`, tests PR-12).
 */

export {
  CSP_ORIGINS,
  CSP_PRESETS,
  PERMISSIONS_POLICY,
  HSTS_HEADER,
  IMAGES_REMOTE_PATTERNS,
  IMAGE_FORMATS,
} from "../../../../packages/shared/src/seguridad";
import { buildCsp, CSP_PRESETS, PERMISSIONS_POLICY, HSTS_HEADER } from "../../../../packages/shared/src/seguridad";

/**
 * Construye CSP dinámico con nonce (usado por middleware en runtime).
 * `isProd`  => nonce + strict-dynamic, sin unsafe-inline/eval.
 * `isStaging` => el caller decide emitir Report-Only además.
 */
export function buildCspUsuario(nonce: string, isProd: boolean, _isStaging: boolean): string {
  return buildCsp({ nonce, isProd, extras: CSP_PRESETS.usuario });
}

/**
 * CSP estático sin nonce por request.
 *
 * ARQ-4 (auditoría fase 4): ya NO se usa en `next.config.ts`. Emitir aquí una
 * CSP sin nonce mientras el middleware emite la canónica con nonce produce dos
 * cabeceras CSP para la misma URL, y el navegador aplica la intersección: en
 * producción la estática (`script-src 'self' 'strict-dynamic'` sin nonce) hace
 * que CSP3 ignore `'self'` y no quede origen válido, bloqueando el bundle.
 *
 * Se conserva exportada para tests y para consumidores que necesiten
 * inspeccionar la política, pero el middleware es la única que la emite.
 */
export function buildCspEstatico(isProd: boolean): string {
  return buildCsp({ nonce: null, isProd, extras: CSP_PRESETS.usuario });
}

export interface CabeceraSeguridad {
  key: string;
  value: string;
}

const GRUPO_REPORTE_CSP = "csp-endpoint";
const RUTA_REPORTE_CSP = "/api/csp-report";

/**
 * M16 — Fuente única de headers defensivos estáticos (no dependen de nonce).
 * Antes vivían duplicados con literales en `next.config.ts` y
 * `src/middleware.ts`: valores iguales hoy, pero cualquier cambio futuro
 * divergía en silencio (los assets estáticos solo pasan por next.config).
 * Ambos emissores usan este builder; el middleware sobrescribe con .set().
 */
export function headersSeguridadEstaticos(isProd: boolean): CabeceraSeguridad[] {
  const lista: CabeceraSeguridad[] = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: PERMISSIONS_POLICY }
  ];
  if (isProd) {
    lista.push({ key: "Strict-Transport-Security", value: HSTS_HEADER });
  }
  return lista;
}

/**
 * M13 — Grupo Reporting API para la directiva `report-to csp-endpoint`.
 * Antes la directiva apuntaba a un grupo inexistente (sin cabecera Report-To):
 * no-op silencioso y los reportes solo salían por `report-uri`. El endpoint
 * se construye absoluto con el origen del request.
 */
export function cabeceraReportToCsp(origen: string): CabeceraSeguridad {
  return {
    key: "Report-To",
    value: JSON.stringify({
      group: GRUPO_REPORTE_CSP,
      max_age: 10800,
      endpoints: [{ url: `${origen}${RUTA_REPORTE_CSP}` }]
    })
  };
}

/** Sufijo de reporte CSP (report-uri clásico + grupo Reporting API). */
export function sufijoReporteCsp(): string {
  return `; report-uri ${RUTA_REPORTE_CSP}; report-to ${GRUPO_REPORTE_CSP}`;
}
