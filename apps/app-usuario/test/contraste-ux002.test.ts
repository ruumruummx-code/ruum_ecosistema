import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/app/contrast-tokens.css', import.meta.url), 'utf8');
function tokens(theme: 'light' | 'dark') {
 const result: Record<string, string> = {};
 const blocks = [...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)];
 for (const [, selector, declarations] of blocks) {
  if (!selector.includes(':root') && !(theme === 'dark' && selector.includes('[data-theme="dark"]'))) continue;
  for (const [, name, value] of declarations.matchAll(/(--[\w-]+):\s*([^;]+);/g)) result[name] = value;
 }
 const resolve = (name: string): string => result[name].startsWith('var(') ? resolve(result[name].slice(4, -1)) : result[name];
 return resolve;
}
function luminance(hex: string) {
 const channels = hex.replace('#', '').match(/../g)!.map(n => parseInt(n, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
 return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrast(a: string, b: string) {
 const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
 return (light + .05) / (dark + .05);
}
describe('RUUM-UX-002: umbral estricto sin redondear', () => {
 for (const theme of ['light', 'dark'] as const) {
  const get = tokens(theme);
  const surfaces = theme === 'light' ? ['#ffffff', '#f4f7fb', '#e8eef4'] : ['#07192f', '#0a1325', '#0a2342'];
  for (const token of ['--user-text-primary', '--user-text-essential', '--user-link-essential', '--user-teal-essential']) for (const bg of surfaces) {
   it(`${theme}: ${token} / ${bg}`, () => expect(contrast(get(token), bg)).toBeGreaterThanOrEqual(4.5));
  }
  it(theme + ': check de paso completado', () => expect(contrast(get('--user-on-accent'), get('--user-on-dark-accent'))).toBeGreaterThanOrEqual(3));
  it(theme + ': borde de paso pendiente', () => expect(contrast(get('--user-on-dark-essential'), '#263545')).toBeGreaterThanOrEqual(3));
  for (const [token, bg] of [['--user-success-essential','#d9ffed'],['--user-success-essential','#e0f8ee'],['--user-warning-essential','#fff2d8'],['--user-danger-essential','#fff8f9'],['--user-on-light-link','#e4efff'],['--user-on-light-muted','#ffffff'],['--user-on-dark-essential','#0d1b2a'],['--user-on-dark-accent','#0d1b2a'],['--user-on-dark-essential','#245c88'],['--user-on-dark-accent','#245c88']]) {
   it(`${theme}: par estable ${token} / ${bg}`, () => expect(contrast(get(token), bg)).toBeGreaterThanOrEqual(4.5));
  }
 }
});
