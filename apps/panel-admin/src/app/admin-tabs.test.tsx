import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminTabs } from './admin-components';
describe('SD-REM-005 · AdminTabs usa el contrato compartido',()=>{
 it('genera paneles, relaciones e IDs únicos entre dos instancias',()=>{
  const props={items:[{value:'uno',label:'Uno'},{value:'dos',label:'Dos',disabled:true}],value:'uno',onValueChange:()=>{},label:'Secciones',renderPanel:(id:string)=>h('p',{children:'Panel '+id})};
  const html=renderToStaticMarkup(h('main',{children:[h(AdminTabs,{...props,key:1}),h(AdminTabs,{...props,key:2})]}));
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);expect(new Set(ids).size).toBe(ids.length);
  expect(html.match(/role="tabpanel"/g)).toHaveLength(4);expect(html.match(/aria-disabled="true"/g)).toHaveLength(2);
  expect(html.match(/aria-selected="true"/g)).toHaveLength(2);expect(html).toContain('Panel uno');expect(html).not.toContain('Panel dos');
 });
});
