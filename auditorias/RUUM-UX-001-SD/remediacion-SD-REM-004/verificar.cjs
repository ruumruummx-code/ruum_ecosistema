const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { resolve, start } = require('../servidor.cjs');
(async () => {
 const esbuild = require(resolve('esbuild'));
 const options = { bundle: true, jsx: 'automatic', nodePaths: [path.resolve('node_modules/.pnpm/node_modules')], logLevel: 'silent' };
 await esbuild.build({ ...options, entryPoints: [__dirname + '/formulario.tsx'], platform: 'node', format: 'cjs', packages: 'external', plugins: [{ name: 'react-external', setup(b) { b.onResolve({ filter: /^react(\/.*)?$/ }, args => ({ path: resolve(args.path), external: true })); } }], outfile: __dirname + '/ssr.cjs' });
 const React = require(resolve('react'));
 const html = require(resolve('react-dom/server')).renderToString(React.createElement(require('./ssr.cjs').Formulario));
 await esbuild.build({ ...options, entryPoints: [__dirname + '/cliente.tsx'], platform: 'browser', outfile: __dirname + '/cliente.js' });
 fs.writeFileSync(__dirname + '/formulario.html', `<!doctype html><html lang="es"><meta charset="utf-8"><title>SD-REM-004</title><link rel="stylesheet" href="../showcase.css"><body><div id="root">${html}</div><script src="cliente.js"></script></body></html>`);
 const { server, url } = await start();
 const browser = await require(resolve('playwright')).chromium.launch();
 try {
 const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
 const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', e => { if(e.type() === 'error') errors.push(e.text()); });
 await page.goto(url + '/remediacion-SD-REM-004/formulario.html');
 const controls = page.locator('input, select, textarea');
 const ids = await controls.evaluateAll(es => es.map(e => e.id));
 assert.equal(new Set(ids).size, 9);
 const ssrIds = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/g)].map(m => m[1]);
 assert.deepEqual(ids, ssrIds);
 await page.addScriptTag({ path: resolve('axe-core/axe.min.js') });
 const states = [];
 for(let state = 0; state < 4; state++) {
  assert.deepEqual(await controls.evaluateAll(es => es.map(e => e.id)), ids);
  const associations = await controls.evaluateAll(es => es.map(e => ({ id: e.id, labels: [...e.labels].map(l => l.textContent), descriptions: e.getAttribute('aria-describedby').split(/\s+/).map(id => document.getElementById(id)?.textContent) })));
  for(const field of associations) { assert.equal(field.labels.length, 1); assert.equal(field.descriptions.length, 1 + Number(Boolean(state & 1)) + Number(Boolean(state & 2))); assert.ok(field.descriptions.every(Boolean)); }
  const axe = await page.evaluate(async () => window.axe.run(document.querySelector('form'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
  assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations));
  states.push({ state, associations, axe });
  fs.writeFileSync(__dirname + `/arbol-${state}.yml`, await page.locator('form').ariaSnapshot());
  if(state === 3) for(const theme of ['light', 'dark']) { await page.evaluate(t => document.documentElement.dataset.theme = t, theme); await page.screenshot({ path: __dirname + `/formulario-${theme}.png`, fullPage: true }); }
  await page.getByRole('button', { name: 'Cambiar estado' }).click();
 }
 await page.getByRole('button', { name: 'Campo condicional', exact: true }).click();
 const conditionalId = await page.getByRole('textbox', { name: 'Condicional', exact: true }).getAttribute('id');
 assert.ok(!ids.includes(conditionalId));
 await page.getByRole('button', { name: 'Cambiar estado' }).click();
 assert.equal(await page.getByRole('textbox', { name: 'Condicional', exact: true }).getAttribute('id'), conditionalId);
 await page.getByRole('button', { name: 'Campo condicional', exact: true }).click();
 assert.deepEqual(await controls.evaluateAll(es => es.map(e => e.id)), ids);
 assert.deepEqual(errors, []);
 fs.writeFileSync(__dirname + '/resultados.json', JSON.stringify({ ssrIds, ids, hydrationErrors: errors, stableAcrossRenders: true, conditionalSiblingStable: true, states, screenReaderGate: 'PENDIENTE: sesión NVDA/VoiceOver no realizada' }, null, 2));
 console.log('PASS: SSR/hidratación, 9 IDs únicos, 4 estados, axe 0, estabilidad y campos condicionales.');
 } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });


