const fs = require('node:fs');
const path = require('node:path');
const dir = __dirname;
const routes = ['/login', '/', '/mis-viajes', '/cuenta', '/ubicaciones', '/cuenta/preferencias', '/registro', '/soporte'];
const before = JSON.parse(fs.readFileSync(path.join(dir, 'antes.json'), 'utf8'));
const matrix = [];
for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
 const folder = theme + '-' + width;
 const report = JSON.parse(fs.readFileSync(path.join(dir, folder, 'contrast.json'), 'utf8'));
 if (report.length !== routes.length || routes.some(route => !report.some(p => p.route === route))) throw new Error('Matriz incompleta: ' + folder);
 for (const result of report) {
  const gradient = result.gradient ?? [];
  if (result.route === '/' && !gradient.length) throw new Error('Falta medición complementaria del gradiente: ' + folder);
  matrix.push({ theme, width, route: result.route, before: theme === 'light' ? before.find(p => p.route === result.route && p.width === width)?.nodes.length ?? null : null,
   after: result.violations.flatMap(v => v.nodes).length, incomplete: result.incomplete.flatMap(v => v.nodes).map(n => ({ target: n.target, summary: n.failureSummary })),
   gradientMin: gradient.length ? Math.min(...gradient.map(n => n.ratio)) : null,
   screenshot: folder + '/' + result.route.replaceAll('/', '_') + '.png', report: folder + '/contrast.json' });
 }
}
const supplemental = [];
for (const theme of ['light','dark']) for (const width of [390,1440]) {
 const folder = theme + '-' + width;
 const r = JSON.parse(fs.readFileSync(path.join(dir, folder, 'preferencias-inferior.json'), 'utf8'));
 supplemental.push({ theme, width, after: r.violations.flatMap(v => v.nodes).length, scrolls: r.scrolls, screenshot: folder + '/_cuenta_preferencias_inferior.png', report: folder + '/preferencias-inferior.json' });
}
const summary = { supplemental, generatedAt: new Date().toISOString(), rule: 'color-contrast', cases: matrix.length, beforeLightNodes: matrix.filter(p => p.theme === 'light').reduce((n, p) => n + (p.before ?? 0), 0), afterNodes: matrix.reduce((n, p) => n + p.after, 0) + supplemental.reduce((n,p) => n + p.after,0), gradientsPass: matrix.every(p => p.gradientMin === null || p.gradientMin >= 4.5), matrix };
fs.writeFileSync(path.join(dir, 'comparativo.json'), JSON.stringify(summary, null, 2));
const escape = value => String(value).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const cells = routes.map(route => `<tr><th>${escape(route)}</th>${['light','dark'].flatMap(theme => [390,1440].map(width => {
 const p = matrix.find(p => p.route === route && p.theme === theme && p.width === width);
 return `<td><a href="${p.report}">${p.before === null ? '—' : p.before} → ${p.after}</a></td>`;
})).join('')}</tr>`).join('\n');
const lowerGallery = supplemental.map(p => `<figure><figcaption>Preferencias · sección inferior · ${p.theme === 'light' ? 'Claro' : 'Oscuro'} · ${p.width} px</figcaption><a href="${p.screenshot}"><img loading="lazy" src="${p.screenshot}" alt="Sección inferior de preferencias"></a><p><a href="${p.report}">Reporte axe</a></p></figure>`).join('');
const gallery = routes.map(route => `<details><summary>${escape(route)} · capturas pareadas</summary><div class="gallery">${matrix.filter(p => p.route === route).map(p => `<figure><figcaption>${p.theme === 'light' ? 'Claro' : 'Oscuro'} · ${p.width} px</figcaption><a href="${p.screenshot}"><img loading="lazy" src="${p.screenshot}" alt="${escape(route)} en ${p.theme}, ${p.width} píxeles"></a>${p.gradientMin === null ? '' : `<p>Texto esencial del gradiente: mínimo ${p.gradientMin.toFixed(2)}:1.</p>`}</figure>`).join('')}</div></details>`).join('\n');
fs.writeFileSync(path.join(dir, 'EVIDENCIA.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RUUM-UX-002 · Evidencia</title><style>body{font:16px/1.5 system-ui;color:#0a2342;background:#f5f8fc;max-width:1400px;margin:32px auto;padding:0 24px}a{color:#0052cc}h1{font-size:28px}table{border-collapse:collapse;width:100%;background:#fff}th,td{border:1px solid #b7c5d8;padding:12px;text-align:left}details{background:white;border:1px solid #b7c5d8;padding:16px;margin:20px 0;border-radius:12px}summary{cursor:pointer;font-weight:700}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}figure{margin:12px 0}figcaption{font-weight:700;margin-bottom:8px}img{width:100%;height:auto;border:1px solid #b7c5d8}code{background:#e8eef4;padding:2px 4px}</style><h1>RUUM-UX-002 · Contraste de contenido esencial</h1><p>${summary.cases} casos: 8 pantallas × 2 anchos × 2 temas, más 4 revisiones de las secciones inferiores de preferencias. Fallos automáticos de contraste después: <strong>${summary.afterNodes}</strong>. La referencia original contiene ${summary.beforeLightNodes} nodos con fallo en claro.</p><p>La comprobación usa exclusivamente la regla axe <code>color-contrast</code>. Los gradientes de la tarjeta de traslado se complementan con luminancia sRGB y una cota conservadora calculada desde los colores renderizados. No se redondea el umbral de 4.5:1.</p><p><a href="comparativo.json">Comparativo y pendientes manuales</a> · <a href="antes.json">Evidencia original</a> · <a href="README.md">Nota de implementación y validación</a></p><table><thead><tr><th>Pantalla</th><th>Claro 390 · antes → después</th><th>Claro 1440 · antes → después</th><th>Oscuro 390 · antes → después</th><th>Oscuro 1440 · antes → después</th></tr></thead><tbody>${cells}</tbody></table><p>—: la auditoría original no aportó una matriz equivalente en oscuro. Los informes conservan <code>incomplete</code> de axe; no se cuentan como aprobados automáticos. La medición complementaria cubre el texto esencial del traslado sobre gradientes; el resto queda identificado para revisión manual. Esta evidencia no sustituye la certificación integral ni la revisión de Diseño de Sistemas.</p>${gallery}<details><summary>Preferencias · secciones inferiores</summary><div class="gallery">${lowerGallery}</div></details></html>`);
console.log(JSON.stringify({ cases: summary.cases, supplemental: summary.supplemental.length, before: summary.beforeLightNodes, after: summary.afterNodes, gradientsPass: summary.gradientsPass }));
if (summary.afterNodes || !summary.gradientsPass) process.exitCode = 1;
