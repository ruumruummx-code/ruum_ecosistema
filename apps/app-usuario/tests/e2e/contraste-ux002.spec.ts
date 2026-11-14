import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { seedMockAuthSession } from './fixtures/sesion';
import { medirTextoTraslado } from './fixtures/contraste-traslado';
import { esperarHidratacion } from './fixtures/navegacion';

for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
 test(`UX-002 ${theme} ${width}`, async ({ page }, testInfo) => {
  test.setTimeout(600_000);
  page.setDefaultNavigationTimeout(180_000);
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: theme as 'light' | 'dark' });
  await page.addInitScript(t => {
   localStorage.setItem('ruum-tema', t);
   localStorage.setItem('ruum-theme', t);
   localStorage.setItem('ruum-tema-modo', t);
   const accountTheme = JSON.stringify(t === 'dark' ? 'Oscuro' : 'Claro');
   localStorage.setItem('ruum:pref:tema', accountTheme);
   localStorage.setItem('ruum:pref:tema:00000000-0000-4000-8000-0000000000f1', accountTheme);
  }, theme);
  const report = [];
  const evidence = testInfo.outputPath('contraste');
  fs.mkdirSync(evidence, { recursive: true });
  for (const route of ['/login', '/', '/mis-viajes', '/cuenta', '/ubicaciones', '/cuenta/preferencias', '/registro', '/soporte']) {
   await page.context().clearCookies();
   if (!['/login', '/registro'].includes(route)) await seedMockAuthSession(page, { token: route.startsWith('/cuenta') ? 'mock_access_token_account' : route === '/ubicaciones' ? 'mock_access_token_locations' : 'mock_access_token_dashboard' });
   await page.goto(route, { waitUntil: 'domcontentloaded' });
   await esperarHidratacion(page);
   expect(new URL(page.url()).pathname).toBe(route);
   await expect(page.locator('html')).toHaveAttribute('data-theme', theme, { timeout: 60_000 });
   const expectedContent: Record<string, RegExp> = {
    '/login': /Al continuar/, '/': /Chrysler Cirrus/, '/mis-viajes': /Chrysler Cirrus/,
    '/cuenta': /Carlos/, '/ubicaciones': /ubicaciones/i, '/cuenta/preferencias': /notificaciones/i,
    '/registro': /Crear cuenta/, '/soporte': /soporte/i,
   };
   await expect(page.locator('body')).toContainText(expectedContent[route], { timeout: 60_000 });
   const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
   await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
   const gradient = route === '/' ? await medirTextoTraslado(page, width) : [];
   report.push({ route, violations: result.violations, incomplete: result.incomplete, gradient });
   await page.screenshot({ path: path.join(evidence, route.replaceAll('/', '_') + '.png'), fullPage: true });
   fs.writeFileSync(path.join(evidence, 'contrast.json'), JSON.stringify(report, null, 2));
   console.log(theme, width, route, result.violations.flatMap(v => v.nodes.map(n => n.target)));
  }
  await testInfo.attach('contrast.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  expect(report.flatMap(r => r.gradient.filter(n => n.ratio < 4.5))).toEqual([]);
  expect(report.flatMap(r => r.violations.map(v => ({ route: r.route, nodes: v.nodes })))).toEqual([]);
 });
}

// Revisar también las secciones inferiores del contenedor con scroll interno.
for (const theme of ['light', 'dark'] as const) for (const width of [390, 1440]) {
 test(`UX-002 preferencias completas ${theme} ${width}`, async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  page.setDefaultNavigationTimeout(120_000);
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript(t => {
   localStorage.setItem('ruum-tema', t);
   localStorage.setItem('ruum-tema-modo', t);
   localStorage.setItem('ruum:pref:tema:00000000-0000-4000-8000-0000000000f1', JSON.stringify(t === 'dark' ? 'Oscuro' : 'Claro'));
  }, theme);
  await seedMockAuthSession(page, { token: 'mock_access_token_account' });
  await page.goto('/cuenta/preferencias', { waitUntil: 'domcontentloaded' });
  await esperarHidratacion(page);
  await expect(page.locator('body')).toContainText(/notificaciones/i, { timeout: 60_000 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  const scrolls = await page.evaluate(async () => {
   const containers = [...document.querySelectorAll<HTMLElement>('main,section,div')].filter(el => el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(el).overflowY));
   containers.forEach(el => { el.scrollTop = el.scrollHeight; });
   await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
   return containers.map(el => ({ className: el.className, scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
  });
  const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  const evidence = testInfo.outputPath('contraste');
  fs.mkdirSync(evidence, { recursive: true });
  fs.writeFileSync(path.join(evidence, 'preferencias-inferior.json'), JSON.stringify({ theme, width, scrolls, violations: result.violations, incomplete: result.incomplete }, null, 2));
  await page.screenshot({ path: path.join(evidence, '_cuenta_preferencias_inferior.png'), fullPage: true });
  expect(result.violations).toEqual([]);
 });
}
