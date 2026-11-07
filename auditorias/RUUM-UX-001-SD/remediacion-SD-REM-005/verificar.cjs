const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {resolve,start}=require('../servidor.cjs');
const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
(async()=>{
 const root=path.resolve(__dirname,'../../..'),esbuild=require(resolve('esbuild'));
 const options={bundle:true,jsx:'automatic',nodePaths:[root+'/node_modules/.pnpm/node_modules'],logLevel:'silent'};
 await esbuild.build({...options,entryPoints:[__dirname+'/formulario.tsx'],platform:'node',format:'cjs',packages:'external',plugins:[{name:'react-external',setup(b){b.onResolve({filter:/^react(\/.*)?$/},a=>({path:resolve(a.path),external:true}));}}],outfile:__dirname+'/ssr.cjs'});
 const React=require(resolve('react')),html=require(resolve('react-dom/server')).renderToString(React.createElement(require('./ssr.cjs').Formulario));
 await esbuild.build({...options,entryPoints:[__dirname+'/cliente.tsx'],platform:'browser',outfile:__dirname+'/cliente.js'});
 const tokens=fs.readFileSync(root+'/packages/ui/src/styles/tokens.css','utf8').replace('@theme {','@theme static {');
 const css=await require(resolve('postcss'))([require(resolve('@tailwindcss/postcss'))({base:root+'/packages/ui'})]).process('@import "tailwindcss";\n'+tokens+'\n@source "../../packages/ui/src";\n@source "../../auditorias/RUUM-UX-001-SD/remediacion-SD-REM-005/formulario.tsx";',{from:root+'/apps/app-usuario/audit-rem005.css'});
 fs.writeFileSync(__dirname+'/formulario.css',css.css);fs.writeFileSync(__dirname+'/formulario.html',`<!doctype html><html lang="es" data-theme="light"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SD-REM-005</title><link rel="stylesheet" href="formulario.css"><body><div id="root">${html}</div><script src="cliente.js"></script></body></html>`);
 const {server,url}=await start(),browser=await require(resolve('playwright')).chromium.launch();
 try{
 const page=await browser.newPage({viewport:{width:900,height:1200}}),errors=[],keyboard=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
 await page.goto(url+'/remediacion-SD-REM-005/formulario.html');await page.getByRole('tablist',{name:'Principal',exact:true}).waitFor();
 await page.addStyleTag({content:'*{transition:none!important;animation:none!important}'});
 const ids=await page.locator('main [id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(new Set(ids).size,ids.length);
 const ssrIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(ids,ssrIds);
 const list=page.getByRole('tablist',{name:'Principal',exact:true}),vertical=page.getByRole('tablist',{name:'Secundaria vertical'});
 const tab=name=>list.getByRole('tab',{name,exact:true});
 const focused=async loc=>assert.ok(await loc.evaluate(e=>e===document.activeElement));
 await page.locator('#before').focus();await page.keyboard.press('Tab');await focused(tab('Resumen'));keyboard.push({key:'Tab',result:'Entró en Resumen; un único tabIndex=0'});
 await page.keyboard.press('ArrowRight');await focused(tab('Actividad'));assert.equal(await tab('Resumen').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#updates').textContent(),'0');keyboard.push({key:'ArrowRight',result:'Enfocó Actividad; NO activó ni llamó al consumidor'});
 await page.keyboard.press('ArrowRight');await focused(tab('Documentos'));keyboard.push({key:'ArrowRight',result:'Saltó No disponible y enfocó Documentos'});
 await page.keyboard.press('Enter');assert.equal(await tab('Documentos').getAttribute('aria-selected'),'true');keyboard.push({key:'Enter',result:'Activó Documentos una vez'});
 await page.keyboard.press('Tab');await focused(page.getByRole('tabpanel',{name:'Documentos',exact:true}));await page.keyboard.press('Tab');await focused(page.locator('#after'));keyboard.push({key:'Tab, Tab',result:'Salió al panel activo y después al botón posterior'});
 await page.keyboard.press('Shift+Tab');await page.keyboard.press('Shift+Tab');await focused(tab('Documentos'));keyboard.push({key:'Shift+Tab, Shift+Tab',result:'Regresó por el panel a la pestaña seleccionada'});
 await page.keyboard.press('Home');await focused(tab('Resumen'));assert.equal(await tab('Documentos').getAttribute('aria-selected'),'true');await page.keyboard.press('Space');assert.equal(await tab('Resumen').getAttribute('aria-selected'),'true');keyboard.push({key:'Home, Space',result:'Home solo enfocó primero; Space activó Resumen'});
 await page.getByRole('textbox',{name:'Nota del resumen',exact:true}).first().fill('Estado preservado');
 await tab('Resumen').focus();await page.keyboard.press('End');await focused(tab('Documentos'));await page.keyboard.press('Enter');await page.keyboard.press('Home');await page.keyboard.press('Enter');assert.equal(await page.getByRole('textbox',{name:'Nota del resumen',exact:true}).first().inputValue(),'Estado preservado');keyboard.push({key:'End',result:'Enfocó última habilitada; estado local conservado tras volver'});
 const blocked=list.getByRole('tab',{disabled:true});const oldURL=page.url(),calls=await page.locator('#updates').textContent();await tab('Resumen').focus();await blocked.evaluate(e=>e.focus());await focused(tab('Resumen'));await blocked.dispatchEvent('click');await blocked.dispatchEvent('keydown',{key:'Enter'});await blocked.dispatchEvent('keydown',{key:' '});assert.equal(page.url(),oldURL);assert.equal(await page.locator('#updates').textContent(),calls);assert.equal(await blocked.evaluate(e=>e.tagName),'SPAN');assert.equal(await blocked.getAttribute('href'),null);assert.equal(await blocked.getAttribute('tabindex'),null);keyboard.push({key:'Foco, clic, Enter, Space sobre bloqueada',result:'NO enfocó; NO activó; no href ni callbacks'});
 await vertical.getByRole('tab',{name:'Resumen',exact:true}).focus();await page.keyboard.press('ArrowDown');await focused(vertical.getByRole('tab',{name:'Actividad',exact:true}));await page.keyboard.press('ArrowUp');await focused(vertical.getByRole('tab',{name:'Resumen',exact:true}));keyboard.push({key:'ArrowDown, ArrowUp',result:'Orientación vertical navega foco sin activar'});
 await page.getByRole('button',{name:'Alternar Documentos',exact:true}).click();assert.equal(await list.getByRole('tab',{name:'Documentos',exact:true}).getAttribute('aria-disabled'),'true');await page.getByRole('button',{name:'Alternar Documentos',exact:true}).click();assert.deepEqual(await page.locator('main [id]').evaluateAll(es=>es.map(e=>e.id)),ids);
 await page.addScriptTag({path:resolve('axe-core/axe.min.js')});const reports=[];
 for(const theme of ['light','dark']){
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  for(let state=0;state<4;state++){
   const axe=await page.evaluate(async()=>window.axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.equal(axe.violations.length,0,JSON.stringify(axe.violations));
   const relations=await page.getByRole('tab').evaluateAll(es=>es.map(e=>({id:e.id,panel:e.getAttribute('aria-controls'),selected:e.getAttribute('aria-selected'),disabled:e.getAttribute('aria-disabled'),panelExists:Boolean(document.getElementById(e.getAttribute('aria-controls'))),labelledBy:document.getElementById(e.getAttribute('aria-controls'))?.getAttribute('aria-labelledby')})));for(const r of relations){assert.ok(r.panelExists);assert.equal(r.labelledBy,r.id)}
   const descriptions=await page.locator('form input,form select,form textarea').evaluateAll(es=>es.map(e=>({id:e.id,labels:[...e.labels].map(l=>l.textContent),descriptions:(e.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean).map(id=>document.getElementById(id)?.textContent)})));for(const d of descriptions){assert.equal(d.labels.length,1);assert.equal(d.descriptions.length,Number(Boolean(state&1))+Number(Boolean(state&2)));assert.ok(d.descriptions.every(Boolean));}
   await page.locator('#before').focus();await page.keyboard.press('Tab');const focus=await tab('Resumen').evaluate(e=>{const s=getComputedStyle(e);return{color:s.color,background:s.backgroundColor,outline:s.outline,offset:s.outlineOffset,outlineColor:s.outlineColor,surface:getComputedStyle(document.body).backgroundColor,visible:e.matches(':focus-visible')}});assert.ok(focus.visible);assert.ok(focus.outline.includes('solid 3px'));
   const ratios={text:contrast(focus.color,focus.background),focus:contrast(focus.outlineColor,focus.surface),selectedBoundary:contrast(focus.background,focus.surface)};
   assert.ok(ratios.text>=4.5);assert.ok(ratios.focus>=3);assert.ok(ratios.selectedBoundary>=3);
   reports.push({theme,state,axe,relations,descriptions,focus,ratios});
   if(state===3){fs.writeFileSync(__dirname+`/arbol-${theme}.yml`,await page.locator('main').ariaSnapshot());await page.screenshot({path:__dirname+`/tabs-${theme}.png`,fullPage:true});}
   await page.getByRole('button',{name:'Actualizar descripciones',exact:true}).click();
  }
 }
 const panels=await page.locator('[role=tabpanel]').evaluateAll(es=>es.map(e=>({id:e.id,hidden:e.hidden,display:getComputedStyle(e).display})));assert.equal(panels.filter(p=>!p.hidden).length,2);assert.ok(panels.filter(p=>p.hidden).every(p=>p.display==='none'));
 assert.deepEqual(errors,[]);fs.writeFileSync(__dirname+'/resultados.json',JSON.stringify({ticket:'SD-REM-005',pattern:'manual',ssrIds,idsStable:true,hydrationErrors:errors,keyboard,panels,reports,gateAT:'PENDIENTE sesión real; sin anuncios literales ni firmas inferidos'},null,2));console.log('PASS SD-REM-005: teclado manual, orientación, disabled, paneles, SSR, dos instancias, axe y regresión 004/007.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});


