/** Sólo para reproducir la auditoría local con Next 15.5.28 en este runner.
 * Su hook SWC resuelve el alias de csp.ts relativo al módulo equivocado.
 * Conserva el mismo módulo fuente y todas las cabeceras de seguridad.
 * No se carga desde la aplicación ni desde sus scripts de producción.
 */
const Module = require('node:module');
const path = require('node:path');
const repo = path.resolve(__dirname, '../..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...args) {
 if (request.startsWith('../../packages/shared/src/') && parent?.filename.endsWith(path.join('src', 'lib', 'csp.ts'))) {
  request = path.join(repo, request.slice(6));
 }
 return resolve.call(this, request, parent, ...args);
};
