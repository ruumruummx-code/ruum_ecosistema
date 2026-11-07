import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Tabs } from './Tabs';

describe('SD-REM-005 · Tabs SSR', () => {
 it('omite la lista vacía sin crear un tablist ARIA incompleto',()=>{ expect(renderToStaticMarkup(h(Tabs,{tabs:[]}))).toBe(''); });
 it('genera IDs únicos y relaciones en dos instancias con los mismos items', () => {
  const tabs=[{id:'uno',etiqueta:'Uno',contenido:'Contenido uno'},{id:'dos',etiqueta:'Dos',disabled:true,motivoDeshabilitado:'Próximamente'}];
  const html=renderToStaticMarkup(h('main',{children:[h(Tabs,{key:1,tabs}),h(Tabs,{key:2,tabs})]}));
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  expect(ids).toHaveLength(8);expect(new Set(ids).size).toBe(8);
  for(const m of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g))expect(ids).toContain(m[1]);
  expect(html.match(/aria-selected="true"/g)).toHaveLength(2);
  expect(html.match(/role="tab" aria-selected="false" aria-disabled="true"/g)).toHaveLength(2);
  expect(html).not.toContain('<a');
 });
 it('expone todos los paneles pero solo monta contenido activo por defecto', () => {
  const html=renderToStaticMarkup(h(Tabs,{tabs:[{id:'a',etiqueta:'A',contenido:'ACTIVO'},{id:'b',etiqueta:'B',contenido:'INACTIVO'}]}));
  expect(html.match(/role="tabpanel"/g)).toHaveLength(2);expect(html).toContain('hidden=""');
  expect(html).toContain('ACTIVO');expect(html).not.toContain('INACTIVO');
 });
 it('mantenerMontados conserva contenido sin exponer el panel inactivo', () => {
  const html=renderToStaticMarkup(h(Tabs,{mantenerMontados:true,tabs:[{id:'a',etiqueta:'A'},{id:'b',etiqueta:'B',contenido:'CONSERVADO'}]}));
  expect(html).toContain('CONSERVADO');expect(html).toContain('display:none');
 });
 it('no selecciona items deshabilitados y valida IDs duplicados', () => {
  const tabs=[{id:'a',etiqueta:'A',disabled:true}];
  expect(renderToStaticMarkup(h(Tabs,{tabs}))).not.toContain('aria-selected="true"');
  expect(()=>renderToStaticMarkup(h(Tabs,{tabs:[...tabs,...tabs]}))).toThrow('id único');
 });
});
