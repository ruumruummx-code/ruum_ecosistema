import type { Page } from '@playwright/test';

/** Complementa axe: contraste del texto sobre el fondo de la tarjeta del traslado activo (fondo sólido o, si lo hubiera, la cota más clara de su gradiente). */
export async function medirTextoTraslado(page: Page, width: number) {
 return page.evaluate(width => {
  const marco = width < 1024 ? 'inicio-movil' : 'inicio-escritorio';
  const card = document.querySelector(`[data-testid="${marco}"] section[aria-label^="Traslado Activo"]`);
  if (!card) throw new Error('No se encontró el traslado activo de la fixture');
  const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
  const estilo = getComputedStyle(card);
  const gradiente = (estilo.backgroundImage.match(/rgba?\([^)]+\)/g) ?? []).map(rgb).filter(c => (c[3] ?? 1) > 0);
  const stops = gradiente.length ? gradiente : [rgb(estilo.backgroundColor)];
  if (!stops[0]?.length) throw new Error('La tarjeta no tiene fondo medible');
  const lightest = [0, 1, 2].map(i => Math.max(...stops.map(c => c[i])));
  const luminance = (c: number[]) => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const ratio = (a: number[], b: number[]) => {
   const [hi, lo] = [luminance(a), luminance(b)].sort((a, b) => b - a);
   return (hi + .05) / (lo + .05);
  };
  const selector = 'h2, p, dt, dd, ol li a > span';
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
