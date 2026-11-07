import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { seedMockAuthSession } from './fixtures/sesion';
const profile = '00000000-0000-4000-8000-0000000000f1';
const rules = ['button-name', 'select-name', 'aria-toggle-field-name', 'html-has-lang', 'html-lang-valid', 'valid-lang'];
const out = path.resolve(__dirname, '../../../../docs/remediacion-ux006');

for (const width of [390, 1440]) {
 test(`UX-006 preferencias ${width}`, async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(id => {
   if (localStorage.getItem('ux006-seeded')) return;
   localStorage.setItem('ux006-seeded', '1');
   localStorage.setItem('ruum:pref:usuario:' + id, JSON.stringify({ idioma: 'en', unidades: 'Imperial' }));
   localStorage.setItem('ruum:pref:idioma:' + id, '"en"');
   localStorage.setItem('ruum:pref:unidades:' + id, '"Imperial"');
   localStorage.setItem('ruum:pref:tema:' + id, '"Claro"');
   localStorage.setItem('ruum:preferencias-pendientes:' + id, JSON.stringify({ general: { idioma: 'en' }, notificacion: {} }));
  }, profile);
  await seedMockAuthSession(page, { token: 'mock_access_token_account' });
  const attempts: Array<{ failed: boolean; body: Record<string, unknown> }> = [];
  let fail = true;
  await page.route('**/rest/v1/usuarios**', async route => {
   if (route.request().method() !== 'PATCH') return route.continue();
   attempts.push({ failed: fail, body: route.request().postDataJSON() });
   if (fail) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'UX006 503 controlado', code: 'PGRST000' }) });
   return route.continue();
  });
  await page.goto('/cuenta/preferencias', { waitUntil: 'domcontentloaded', timeout: 240_000 });
  await expect(page.locator('body')).toContainText('La interfaz está disponible únicamente en español.', { timeout: 60_000 });
  const english = width === 390 ? page.getByRole('radio', { name: 'English (US)' }) : page.getByRole('button', { name: 'English', exact: true });
  await expect(english).toBeDisabled();
  await expect(english).toHaveAccessibleDescription(/únicamente en español/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
  await expect.poll(() => page.evaluate(id => JSON.parse(localStorage.getItem('ruum:pref:usuario:' + id)!).idioma, profile), { timeout: 60_000 }).toBe('es');
  fs.mkdirSync(out, { recursive: true });
  await page.screenshot({ path: path.join(out, width + '-preferencias.png'), fullPage: true });
  const initial = await new AxeBuilder({ page }).withRules(rules).analyze();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(english).toBeDisabled();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
  const units = width === 390 ? page.getByRole('combobox', { name: 'Unidades de medida', exact: true }) : page.getByRole('combobox', { name: 'Sistema de unidades para distancias, peso y consumo', exact: true });
  await expect(units).toHaveValue('Imperial');
  const failedResponse = page.waitForResponse(r => r.request().method() === 'PATCH' && r.url().includes('/rest/v1/usuarios') && r.status() === 503);
  await units.selectOption('Métrico');
  if (width === 1440) await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await failedResponse;
  await expect(page.locator('body')).toContainText(/pendientes de sincronizar|Servicio no disponible.*503/);
  await expect(page.getByText('Cambios guardados con éxito', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: path.join(out, width + '-503.png'), fullPage: true });
  fail = false;
  await page.getByRole('button', { name: width === 390 ? 'Reintentar guardado' : 'Reintentar', exact: true }).click();
  await expect.poll(() => page.evaluate(id => localStorage.getItem('ruum:preferencias-pendientes:' + id), profile), { timeout: 20_000 }).toBeNull();
  if (width === 1440) await expect(page.getByText('Cambios guardados con éxito', { exact: true })).toBeVisible();
  const updates = attempts.filter(a => a.body.preferencias).map(a => a.body.preferencias as Record<string, unknown>);
  expect(updates.length).toBeGreaterThan(0);
  expect(updates.every(p => p.idioma === 'es')).toBe(true);
  const final = await new AxeBuilder({ page }).withRules(rules).analyze();
  let notificationNames: string[] = [];
  let notifications: { violations: unknown[] } = { violations: [] };
  if (width === 390) {
   await page.getByRole('button', { name: 'Notificaciones y alertas', exact: true }).click();
   const dialog = page.getByRole('dialog');
   await expect(dialog).toBeVisible();
   notificationNames = await dialog.getByRole('switch').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label') ?? ''));
   notifications = await new AxeBuilder({ page }).withRules(rules).analyze();
   await page.screenshot({ path: path.join(out, width + '-notificaciones.png'), fullPage: true });
  } else {
   notificationNames = await page.getByRole('switch').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label') ?? ''));
  }
  expect(notificationNames.every(Boolean)).toBe(true);
  expect(new Set(notificationNames).size).toBe(notificationNames.length);
  fs.writeFileSync(path.join(out, width + '-preferencias.json'), JSON.stringify({ width, initial: { violations: initial.violations, incomplete: initial.incomplete }, final: { violations: final.violations, incomplete: final.incomplete }, notifications, notificationNames, attempts, language: await page.locator('html').getAttribute('lang'), reload: true }, null, 2));
  expect(initial.violations).toEqual([]);
  expect(final.violations).toEqual([]);
  expect(notifications.violations).toEqual([]);
 });
 test(`UX-006 acceso ${width}`, async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width, height: 900 });
  const response = await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 240_000 });
  expect((await response!.text()).match(/<html[^>]*lang="([^"]+)"/)?.[1]).toBe('es-MX');
  await expect(page.locator('body')).toContainText('Inicia sesión', { timeout: 60_000 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
  await expect(page.getByRole('button', { name: /^(EN|English)$/ })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /English/ })).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).withRules(['html-has-lang', 'html-lang-valid', 'valid-lang']).analyze();
  fs.mkdirSync(out, { recursive: true });
  await page.screenshot({ path: path.join(out, width + '-login.png'), fullPage: true });
  fs.writeFileSync(path.join(out, width + '-login.json'), JSON.stringify({ width, lang: await page.locator('html').getAttribute('lang'), violations: axe.violations, incomplete: axe.incomplete }, null, 2));
  expect(axe.violations).toEqual([]);
 });
}
