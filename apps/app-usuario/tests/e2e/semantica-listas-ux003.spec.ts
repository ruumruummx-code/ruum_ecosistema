import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { seedMockAuthSession } from './fixtures/sesion';

const phase = process.env.UX003_PHASE === 'before' ? 'before' : 'after';
for (const width of [390, 1440]) for (const route of ['/mis-viajes', '/cuenta']) {
 test(`UX-003 ${width} ${route}`, async ({ page }) => {
  test.setTimeout(360_000);
  await page.setViewportSize({ width, height: 900 });
  await seedMockAuthSession(page, { token: route === '/cuenta' ? 'mock_access_token_account' : 'mock_access_token_dashboard' });
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 240_000 });
  await expect(page.locator('body')).toContainText(route === '/cuenta' ? 'Carlos' : 'Chrysler Cirrus', { timeout: 60_000 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light', { timeout: 60_000 });
  expect(new URL(page.url()).pathname).toBe(route);
  const axe = await new AxeBuilder({ page }).withRules(['definition-list', 'dlitem']).analyze();
  const lists = await page.locator('dl:visible').evaluateAll(elements => elements.map(dl => ({
   label: dl.getAttribute('aria-label'), html: dl.outerHTML,
   groups: [...dl.children].map(group => ({ tag: group.tagName, children: [...group.children].map(el => el.tagName), text: group.textContent })),
   metrics: [...dl.querySelectorAll('dt,dd')].map(el => {
    const visual = el.tagName === 'DD' ? el.querySelector('span:not([aria-hidden])') ?? el : el;
    return { tag: el.tagName, text: el.textContent?.trim(), x: visual.getBoundingClientRect().x, y: visual.getBoundingClientRect().y };
   }),
  })));
  const reading = await Promise.all((await page.locator('dl:visible').all()).map(dl => dl.ariaSnapshot()));
  const dir = path.resolve(__dirname, '../../../../docs/remediacion-ux003', phase);
  fs.mkdirSync(dir, { recursive: true });
  const id = width + '-' + route.slice(1);
  await page.screenshot({ path: path.join(dir, id + '.png'), fullPage: true });
  fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify({ phase, width, route, violations: axe.violations, incomplete: axe.incomplete, lists, reading }, null, 2));
  console.log(phase, width, route, axe.violations.map(v => ({ id: v.id, nodes: v.nodes.length })));
  if (phase === 'after') {
   expect(axe.violations).toEqual([]);
   if (width === 390) expect(lists.length).toBeGreaterThan(0);
   for (const list of lists) for (const group of list.groups.filter(g => g.tag === 'DIV')) {
    expect(group.children).toEqual(['DT', 'DD']);
   }
  }
 });
}
