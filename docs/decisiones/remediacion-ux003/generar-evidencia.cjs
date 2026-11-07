const fs=require('fs');const path=require('path');const dir=__dirname;
const result=[];
for(const width of [390,1440])for(const route of ['mis-viajes','cuenta']){
 const id=width+'-'+route;
 const before=JSON.parse(fs.readFileSync(path.join(dir,'before',id+'.json'),'utf8'));
 const after=JSON.parse(fs.readFileSync(path.join(dir,'after',id+'.json'),'utf8'));
 const old=before.lists.flatMap(l=>l.metrics),current=after.lists.flatMap(l=>l.metrics);
 const comparison=old.map(metric=>{const next=current.find(n=>n.tag===metric.tag&&n.text===metric.text);return{tag:metric.tag,text:metric.text,found:!!next,dx:next?next.x-metric.x:null,dy:next?next.y-metric.y:null};});
 result.push({id,width,route:'/'+route,before:before.violations.map(v=>({rule:v.id,nodes:v.nodes.length})),after:after.violations.map(v=>({rule:v.id,nodes:v.nodes.length})),lists:after.lists.length,reading:after.reading,comparison});
}
fs.writeFileSync(path.join(dir,'comparativo.json'),JSON.stringify(result,null,2));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
fs.writeFileSync(path.join(dir,'EVIDENCIA.html'),`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RUUM-UX-003 · Evidencia</title><style>body{font:16px/1.5 system-ui;color:#0a2342;background:#f5f8fc;max-width:1440px;margin:24px auto;padding:0 24px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}img{max-width:100%;height:auto}section{background:white;padding:20px;margin:24px 0;border:1px solid #c3d0e2;border-radius:12px}pre{white-space:pre-wrap}a{color:#0052cc}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>RUUM-UX-003 · Listas de indicadores</h1><p>Reglas axe: <code>definition-list</code> y <code>dlitem</code>. Comparación en 390 y 1440 px, con fixtures sintéticas.</p><p><a href="INFORME-CIERRE-RUUM-UX-003.md">Informe de cierre técnico</a> · <a href="comparativo.json">Comparativo estructurado</a></p>${result.map(r=>`<section><h2>${r.width} px · ${r.route}</h2><p>Antes: ${r.before.reduce((n,v)=>n+v.nodes,0)} nodos con fallo. Después: ${r.after.reduce((n,v)=>n+v.nodes,0)}.</p><div class="pair">${['before','after'].map(phase=>`<div><h3>${phase==='before'?'Antes':'Después'}</h3><a href="${phase}/${r.id}.png"><img src="${phase}/${r.id}.png" alt="${phase} ${r.route} ${r.width}"></a><p><a href="${phase}/${r.id}.json">Reporte axe y estructura</a></p></div>`).join('')}</div><details><summary>Orden expuesto en el árbol de accesibilidad</summary><pre>${esc(Array.isArray(r.reading)?r.reading.join('\n\n'):r.reading)}</pre></details></section>`).join('')}</html>`);
console.log(JSON.stringify(result.map(r=>({id:r.id,before:r.before,after:r.after,metricChanges:r.comparison.filter(n=>!n.found||Math.abs(n.dx)>.5||Math.abs(n.dy)>.5)})),null,2));
if(result.some(r=>r.after.length||r.comparison.some(n=>!n.found)))process.exitCode=1;
