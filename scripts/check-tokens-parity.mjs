import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const tokens = JSON.parse(read('design-system/tokens/tokens.json'));
const design = read('design-system/tokens/tokens.css');
const ui = read('packages/ui/src/styles/tokens.css');

// Equivalencias del contrato v1; los alias V2.1 tienen semántica propia.
const designNames = { 'action-bg-state': 'action-bg', 'action-text-state': 'action-text', error: 'error-text' };
const uiNames = {
  light: { bg: 'surface-elevated', 'surface-elevated': 'surface', 'text-secondary': 'muted', teal: 'teal', action: 'action' },
  dark: { bg: 'canvas', 'action-bg-state': 'action-bg', 'action-text-state': 'action-text' },
};

function block(css, selector) {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`Selector ausente: ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim().toLowerCase()]));
}
const failures = [];
function compare(label, vars, name, expected) {
  if (vars[name] !== expected.toLowerCase()) failures.push(`${label} ${name}: ${vars[name] ?? 'ausente'} != ${expected}`);
}
for (const mode of ['light', 'dark']) {
  const sources = mode === 'light'
    ? [block(design, ':root {')]
    : [block(design, ':root:not([data-theme="light"]) {'), block(design, '[data-theme="dark"] {')];
  const uiVars = block(ui, mode === 'light' ? '[data-theme="light"] {' : '[data-theme="dark"] {');
  for (const [key, value] of Object.entries(tokens.color[mode])) {
    for (const [i, vars] of sources.entries()) compare(`design/${mode}/${i}`, vars, `--${designNames[key] ?? key}`, value);
    compare(`ui/${mode}`, uiVars, `--ruum-${uiNames[mode][key] ?? key}`, value);
  }
}
// Alias gráficos Tailwind que no cambian con el tema.
const theme = block(ui, '@theme {');
for (const [key, name] of Object.entries({ navy: 'navy', 'teal-deep': 'teal-deep', 'text-primary': 'ink', 'text-secondary': 'ink-soft', surface: 'mist', bg: 'mist-dim', teal: 'signal', action: 'route', success: 'control', warning: 'warn', error: 'danger' })) {
  compare('ui/@theme', theme, `--color-${name}`, tokens.color.light[key]);
}
if (failures.length) {
  console.error(`Paridad de tokens fallida:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else console.log('Paridad de colores correcta: JSON, CSS de diseño y CSS compartido (claro/oscuro).');
