import type { Page } from '@playwright/test';

/** Complementa axe: cota conservadora del fondo más claro del gradiente. */
export async function medirTextoTraslado(page: Page, width: number) {
 return page.evaluate(width => {
  const card = document.querySelector(width < 1024 ? '.home-transfer' : '[data-testid="desktop-dashboard"] article[aria-label="Traslado activo"]');
  if (!card) throw new Error('No se encontró el traslado activo de la fixture');
  const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
  const stops = (getComputedStyle(card).backgroundImage.match(/rgba?\([^)]+\)/g) ?? []).map(rgb).filter(c => (c[3] ?? 1) > 0);
  if (!stops.length) throw new Error('Falta el gradiente esperado de la tarjeta');
  const lightest = [0, 1, 2].map(i => Math.max(...stops.map(c => c[i])));
  const luminance = (c: number[]) => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const ratio = (a: number[], b: number[]) => {
   const [hi, lo] = [luminance(a), luminance(b)].sort((a, b) => b - a);
   return (hi + .05) / (lo + .05);
  };
  const selector = width < 1024
   ? '.home-active-chip, h2, .home-route > span, .home-plates, .home-progress-heading > span, .home-step-name, .home-step-status, .home-driver p, .home-driver h3'
   : 'h2, [class*="eyebrow"], [class*="plate"], [class*="route"] strong, [class*="route"] small, dt, dd, [class*="timeline"] strong, [class*="timeline"] small';
  return [...card.querySelectorAll(selector)].filter(el => el.getBoundingClientRect().height > 0).map(el => {
   // Componer fondos sólidos/traslúcidos interiores sobre la cota del gradiente.
   const ancestors = [];
   for (let node: Element | null = el; node && node !== card; node = node.parentElement) ancestors.unshift(node);
   let background = lightest;
   for (const node of ancestors) {
    const c = rgb(getComputedStyle(node).backgroundColor);
    const alpha = c[3] ?? 1;
    background = background.map((v, i) => c[i] * alpha + v * (1 - alpha));
   }
   const color = rgb(getComputedStyle(el).color);
   return { text: el.textContent?.trim(), color, backgroundBound: background, ratio: ratio(color, background) };
  });
 }, width);
}
