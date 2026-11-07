from pathlib import Path
import json
P=Path(__file__).resolve().parent
rows=[]
for f in (P/'resultados-base').glob('*.json'):
 r=json.loads(f.read_text(encoding='utf-8'))
 rows.append({'component':r['component'],'state':r['state'],'theme':r['theme'],'width':r.get('width',390),'mode':r.get('mode','interacción'),'snapshot':r['snapshot'],'report':'resultados-base/'+f.name,'violations':[v['id'] for v in r['axe']['violations']]})
verdicts=json.loads((P/'veredictos.json').read_text(encoding='utf-8'))
stats=json.loads((P/'resumen.json').read_text(encoding='utf-8'))
payload=json.dumps({'rows':rows,'verdicts':verdicts,'stats':stats},ensure_ascii=False).replace('</','<\\/')
page='''<!doctype html><html lang="es-MX"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RUUM-UX-001-SD · Evidencia</title>
<style>body{font:16px/1.5 system-ui;margin:24px;color:#102d50;background:#f6f8fb}a{color:#124a9e}table{border-collapse:collapse;width:100%}td,th{padding:8px;text-align:left;border-bottom:1px solid #bbc8da}select,input,button{font:inherit;padding:8px;max-width:100%;margin:4px}img{max-width:100%;border:1px solid #bac8d8;background:white}.bad{color:#9a2637;font-weight:700}code{overflow-wrap:anywhere}</style>
<h1>RUUM-UX-001-SD · Auditoría base</h1><p class="bad">NO CONFORME · GATE bloqueado · co-revisión sin firma</p>
<nav aria-label="Documentación"><a href="INFORME-AUDITORIA-RUUM-UX-001-SD.md">Informe</a> · <a href="VEREDICTOS.md">Veredictos</a> · <a href="TOKENS.md">Tokens</a> · <a href="OVERRIDES.md">Overrides</a> · <a href="CO-REVISION.md">Co-revisión</a> · <a href="UTILIDADES.md">Utilidades</a> · <a href="showcase.html?interactive=1">Showcase</a></nav>
<p id="stats"></p><label>Componente <select id="component"></select></label><label>Tema <select id="theme"><option value="">Ambos</option><option>light</option><option>dark</option></select></label><label>Estado <input id="state" placeholder="Estado o modo"></label><label><input id="failures" type="checkbox"> Solo infracciones axe</label><p id="count" role="status"></p>
<div style="overflow:auto"><table><thead><tr><th>Componente</th><th>Estado</th><th>Tema/ancho</th><th>Resultado</th><th>Evidencia</th></tr></thead><tbody id="rows"></tbody></table></div><section id="preview" aria-label="Captura seleccionada"><h2 id="selected">Vista previa</h2><img id="image" alt="Selecciona una captura" hidden></section>
<script id="data" type="application/json">PAYLOAD</script><script>
const data=JSON.parse(document.getElementById('data').textContent),el=id=>document.getElementById(id);el('stats').textContent=JSON.stringify(data.stats);
el('component').innerHTML='<option value="">Todos</option>'+[...new Set(data.rows.map(r=>r.component))].sort().map(n=>'<option>'+n+'</option>').join('');
function render(){const c=el('component').value,t=el('theme').value,s=el('state').value.toLowerCase(),fail=el('failures').checked;const rows=data.rows.filter(r=>(!c||r.component===c)&&(!t||r.theme===t)&&(!s||(r.state+' '+r.mode).toLowerCase().includes(s))&&(!fail||r.violations.length));el('count').textContent=rows.length+' casos';el('rows').replaceChildren();
for(const r of rows){const tr=document.createElement('tr');for(const text of [r.component,r.state+' · '+r.mode,r.theme+' / '+r.width,r.violations.join(', ')||'Sin infracciones automáticas; revisar condiciones']){const td=document.createElement('td');td.textContent=text;tr.append(td)}const td=document.createElement('td'),button=document.createElement('button');button.textContent='Ver captura';button.onclick=()=>{el('image').src=r.snapshot;el('image').hidden=false;el('image').alt=r.component+' '+r.state+' '+r.theme+' '+r.width;el('selected').textContent=el('image').alt;el('preview').scrollIntoView()};const a=document.createElement('a');a.href=r.report;a.textContent=' JSON';td.append(button,a);if(data.verdicts.some(v=>v.component===r.component)){const d=document.createElement('a');d.href='componentes/'+r.component+'.md';d.textContent=' Ficha';td.append(d)}tr.append(td);el('rows').append(tr)}}
for(const id of ['component','theme','state','failures'])el(id).addEventListener('input',render);render();</script></html>'''
(P/'INDICE.html').write_text(page.replace('PAYLOAD',payload),encoding='utf-8')
print(len(rows),'casos en visor')
