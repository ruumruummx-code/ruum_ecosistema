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
import { buildCsp, CSP_PRESETS } from "../../../../packages/shared/src/seguridad";

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
