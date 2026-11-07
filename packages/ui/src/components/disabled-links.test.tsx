import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MobileRow } from './MobileRow';
import { NextOperationalAction } from './NextOperationalAction';

describe('SD-REM-007 · destinos deshabilitados', () => {
  it('MobileRow evita el ancla y ambos adaptadores al deshabilitar', () => {
    const Adapter = () => { throw new Error('No se debe montar un adaptador deshabilitado'); };
    for (const adapter of [{}, { enlaceComponente: Adapter }, { linkComponent: Adapter }]) {
      const html = renderToStaticMarkup(h(MobileRow, { titulo: 'Cancelar', href: '/cancelar', disabled: true, ...adapter }));
      expect(html).toContain('<span role="link" aria-disabled="true"');
      expect(html).toContain('Cancelar');
      expect(html).not.toMatch(/<a\b|href=|tabindex=|onclick=/i);
    }
  });
  it('NextOperationalAction bloquea CTA principal y secundario, incluso externo', () => {
    const html = renderToStaticMarkup(h(NextOperationalAction, {
      title: 'Acción', instruction: 'Instrucción',
      primaryCta: { label: 'Confirmar', href: '/confirmar', disabled: true },
      secondaryCta: { label: 'Cancelar', href: '/cancelar', disabled: true, external: true },
    }));
    expect(html.match(/role="link" aria-disabled="true"/g)).toHaveLength(2);
    expect(html).not.toMatch(/<a\b|href=|tabindex=|target=/i);
  });
  it('conserva navegación habilitada y botón nativo para acciones', () => {
    const row = renderToStaticMarkup(h(MobileRow, { titulo: 'Ir', href: '/destino' }));
    expect(row).toContain('<a'); expect(row).toContain('href="/destino"');
    const button = renderToStaticMarkup(h(MobileRow, { titulo: 'Acción', disabled: true, onClick: () => {} }));
    expect(button).toContain('<button'); expect(button).toContain('disabled=""'); expect(button).toContain('aria-disabled="true"');
    const cta = renderToStaticMarkup(h(NextOperationalAction, { title: 'Acción', instruction: 'Instrucción', primaryCta: { label: 'Ir', href: '/destino', external: true } }));
    expect(cta).toContain('href="/destino"'); expect(cta).toContain('target="_blank"'); expect(cta).toContain('rel="noreferrer"');
  });
});
