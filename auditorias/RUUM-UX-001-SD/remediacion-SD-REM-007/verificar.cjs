const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { resolve, start } = require('../servidor.cjs');
(async () => {
 const root = path.resolve(__dirname, '../../..');
 await require(resolve('esbuild')).build({ entryPoints: [__dirname + '/formulario.tsx'], bundle: true, jsx: 'automatic', platform: 'browser', nodePaths: [root + '/node_modules/.pnpm/node_modules'], outfile: __dirname + '/formulario.js', logLevel: 'silent' });
 const tokens = fs.readFileSync(root + '/packages/ui/src/styles/tokens.css', 'utf8').replace('@theme {', '@theme static {');
 const css = await require(resolve('postcss'))([require(resolve('@tailwindcss/postcss'))({ base: root + '/packages/ui' })]).process('@import "tailwindcss";\n' + tokens + '\n@source "../../packages/ui/src";\n@source "../../auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/formulario.tsx";', { from: root + '/apps/app-usuario/audit-rem007.css' });
 fs.writeFileSync(__dirname + '/formulario.css', css.css);
 fs.writeFileSync(__dirname + '/formulario.html', '<!doctype html><html lang="es" data-theme="light"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SD-REM-007</title><link rel="stylesheet" href="formulario.css"><body><div id="root"></div><script src="formulario.js"></script></body></html>');
 const { server, url } = await start();
 const browser = await require(resolve('playwright')).chromium.launch();
 try {
 const page = await browser.newPage({ viewport: { width: 480, height: 1000 } });
 const errors = []; page.on('pageerror', e => errors.push(String(e)));
 const popups = []; page.on('popup', p => { popups.push(p.url()); p.close(); });
 await page.goto(url + '/remediacion-SD-REM-007/formulario.html');
 await page.locator('#before').waitFor();
 const originalUrl = page.url();
 const links = page.getByRole('link', { disabled: true });
 assert.equal(await links.count(), 5);
 const names = ['Cancelar traslado', 'Confirmar con adaptador', 'Pagar con alias', 'Confirmar pago', 'Cancelar operación'];
 const keyboard = [];
 for (const name of names) {
  const link = page.getByRole('link', { name, exact: true });
  const attrs = await link.evaluate(e => ({ tag: e.tagName, disabled: e.getAttribute('aria-disabled'), href: e.getAttribute('href'), tabindex: e.getAttribute('tabindex') }));
  assert.deepEqual(attrs, { tag: 'SPAN', disabled: 'true', href: null, tabindex: null });
  await page.locator('#before').focus();
  await link.evaluate(e => e.focus());
  assert.equal(await page.locator('#before').evaluate(e => e === document.activeElement), true);
  await link.dispatchEvent('keydown', { key: 'Enter' }); await link.dispatchEvent('keyup', { key: 'Enter' });
  await link.dispatchEvent('keydown', { key: ' ' }); await link.dispatchEvent('keyup', { key: ' ' });
  await link.dispatchEvent('click');
  keyboard.push({ name, ...attrs, programmaticFocus: 'rechazado', dispatchedEnterSpaceClick: 'sin activación' });
 }
 await page.locator('#before').focus();
 await page.keyboard.press('Tab'); assert.equal(await page.locator('#after').evaluate(e => e === document.activeElement), true);
 await page.keyboard.press('Shift+Tab'); assert.equal(await page.locator('#before').evaluate(e => e === document.activeElement), true);
 // Eventos físicos: Tab llega al centinela final; Enter/Space nunca pasan a los destinos bloqueados.
 await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
 assert.equal(page.url(), originalUrl);
 assert.deepEqual(await page.evaluate(() => [window.actionClicks, window.adapterClicks]), [0, 0]);
 assert.equal(popups.length, 0);
 await page.addScriptTag({ path: resolve('axe-core/axe.min.js') });
 const axe = await page.evaluate(async () => window.axe.run(document.querySelector('main'), { runOnly: { type: 'rule', values: ['aria-allowed-attr', 'button-name', 'link-name'] } }));
 assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations));
 fs.writeFileSync(__dirname + '/arbol-deshabilitado.yml', await page.locator('main').ariaSnapshot());
 for (const theme of ['light', 'dark']) {
  await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
  await page.screenshot({ path: __dirname + `/deshabilitado-${theme}.png`, fullPage: true });
 }
 await page.locator('#before').click();
 assert.equal(await page.getByRole('link', { disabled: true }).count(), 0);
 await page.locator('#before').focus(); await page.keyboard.press('Tab');
 assert.equal(await page.getByRole('link', { name: 'Cancelar traslado', exact: true }).evaluate(e => e === document.activeElement), true);
 await page.keyboard.press('Enter'); await page.waitForURL(u => u.hash === '#cancelar');
 await page.getByRole('link', { name: 'Confirmar con adaptador', exact: true }).focus();
 await page.keyboard.press('Enter'); await page.waitForURL(u => u.hash === '#confirmar');
 await page.getByRole('link', { name: 'Pagar con alias', exact: true }).focus();
 await page.keyboard.press('Enter'); await page.waitForURL(u => u.hash === '#pagar');
 await page.getByRole('link', { name: 'Confirmar pago', exact: true }).focus();
 await page.keyboard.press('Enter'); await page.waitForURL(u => u.hash === '#pago');
 await page.getByRole('button', { name: 'Acción de fila', exact: true }).focus();
 await page.keyboard.press('Enter'); await page.keyboard.press('Space');
 assert.deepEqual(await page.evaluate(() => [window.actionClicks, window.adapterClicks]), [2, 2]);
 await page.locator('#before').click();
 assert.equal(await links.count(), 5);
 assert.deepEqual(errors, []);
 fs.writeFileSync(__dirname + '/resultados.json', JSON.stringify({ ticket: 'SD-REM-007', pattern: 'A: span role=link aria-disabled=true sin href, tabindex ni eventos', keyboard, tab: 'Salta los cinco enlaces y el botón nativo deshabilitados; Shift+Tab regresa al centinela inicial', physicalEnterSpace: 'Sin navegación ni acciones desde el centinela final', disabledCounters: [0, 0], disabledPopups: 0, enabledRegression: 'Enter navega en fila, dos adaptadores y CTA; Enter/Space activan botón; al volver a deshabilitar se retiran enlaces', axe, errors, screenReader: 'PENDIENTE NVDA/VoiceOver' }, null, 2));
 console.log('PASS SD-REM-007: Tab, Enter, Space, foco, click, adaptadores, CTA primario/secundario, axe y rehabilitación.');
 } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

