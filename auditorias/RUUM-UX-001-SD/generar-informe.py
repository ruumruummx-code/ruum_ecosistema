from pathlib import Path
import json, collections, hashlib, html
P=Path(__file__).resolve().parent
ROOT=P.parent.parent
load=lambda f:json.loads((P/f).read_text(encoding='utf-8-sig'))
inv=load('inventario.json'); catalog=load('catalogo-uso.json'); samples=load('muestras.json')
raw=[json.loads(f.read_text(encoding='utf-8')) for f in (P/'resultados-base').glob('*.json')]
base=[r for r in raw if 'geometry' in r]; states=[r for r in raw if 'focus' in r]
tokens=load('tokens-calculados.json'); overrides=load('overrides.json')
for folder in ['componentes','remediaciones']:(P/folder).mkdir(exist_ok=True)
issues={
'001':('Contraste y roles de color','Frontend Plataforma + Diseño de Sistemas','P1','Corregir pares reales, peligro en oscuro, gradiente CTA, route-action/route-soft y contornos UI. No resolver en consumidores.','Ratios por uso cumplen 4.5:1 o 3:1; evaluar el peor punto de gradientes. Separar colores de fondo de colores de texto y exenciones disabled.'),
'002':('Modal: foco y contenido largo','Frontend Plataforma + Accesibilidad','P1','Modal permite salir con Tab/Shift+Tab y no restaura foco desde dentro. Contenido largo sitúa cierre fuera del viewport.','Entrada, contención bidireccional, Escape y retorno de foco; cierre visible y contenido desplazable en anchos y zoom auditados.'),
'003':('Nombre de MobileButton en loading','Frontend Plataforma + Accesibilidad','P1','Loading sustituye el texto por un spinner aria-hidden; queda un botón sin nombre.','Conservar nombre, aria-busy y bloqueo; axe button-name sin infracciones en ambos temas.'),
'004':('IDs y asociaciones de controles','Frontend Plataforma + Accesibilidad','P1','Input/Select/Textarea sin id/name duplican IDs; segundo control sin etiqueta. Select/Textarea no asocian error e Input no asocia ayuda.','IDs únicos por instancia y asociación de label/ayuda/error. Probar dos controles sin configuración adicional.'),
'005':('Patrón de Tabs','Frontend Plataforma + Diseño de Sistemas','P1','Tabs declara tablist/tab pero no mueve foco con flechas ni define gestión de tabindex y paneles.','Completar patrón APG o adoptar semántica de filtros; teclado y relaciones coherentes con la decisión.'),
'006':('Reflow y títulos completos','Frontend Plataforma + Diseño de Sistemas','P1','Revisar desbordamientos, truncado de MobileHeader y min-width global de 320px bajo zoom.','No perder contenido esencial o funciones. Revisar cada candidato geometry; scroll intencional no equivale automáticamente a infracción. Verificar zoom nativo.'),
'007':('Enlaces deshabilitados','Frontend Plataforma','P1','MobileRow ignora disabled en href; NextOperationalAction sigue navegando con Enter pese a aria-disabled y pointer-events.','Bloquear activación con puntero y teclado; definir foco y semántica para ambas ramas.'),
'008':('Chat: nombre, errores y foco','Frontend Plataforma + Accesibilidad','P1','Input depende de placeholder. Revisar contraste de mensajes. Por código: borrador se borra antes de envío y foco usa querySelector global.','Etiqueta explícita estable; error anunciado y borrador recuperable; foco por instancia. Reproducir rechazo y dos chats antes de cerrar esos puntos de revisión estática.'),
'009':('Tipografía y escalas','Diseño de Sistemas + Frontend Plataforma','P2','Familias dependen de variables cargadas sin fallback efectivo en var(); espacios, pesos, line-height, radios y sombras mezclan tokens y literales.','Fallback efectivo y escala publicada; justificar usos fuera de escala y verificar fuentes realmente cargadas en las apps.'),
'010':('Gobernanza de overrides','Diseño de Sistemas + propietarios de cada app','P0 de gobernanza','Candidatos de apariencia, props dinámicas y redeclaraciones de tokens sin justificación nominal por uso.','Justificación y veredicto por candidato; corregir base y retirar compensaciones; aceptación formal de condiciones.'),
'011':('Nombres y significado de estados','Frontend Plataforma + Accesibilidad','P1','Discrepancias de nombres en MobileProgress/EstadoStepper/RuumHeader. EstadoBadge conTexto=false no comunica estado si se usa solo.','Nombre incluye texto visible; alternativa del estado; adjudicar jerarquías de títulos en composición.'),
'012':('Co-revisión y verificación manual','Diseño de Sistemas + UX Lead + Accesibilidad','P0 de gobernanza','Pendientes tecnología asistiva real, zoom nativo y firma nominal de condiciones.','Registrar responsables nominales y fecha de firma. Resolver o aceptar condiciones explícitas; no emitir GATE antes de ello.')}
manual={'Button':['001'],'ButtonPrimary':['001'],'Modal':['002','006'],'MobileButton':['003'],'Input':['004'],'Select':['004'],'Textarea':['004'],'Tabs':['005'],'MobileRow':['007'],'NextOperationalAction':['007'],'Chat':['008'],'MobileProgress':['011'],'EstadoStepper':['011'],'RuumHeader':['011'],'EstadoBadge':['011'],'MobileHeader':['006']}
verdicts=[]
for c in inv['components']:
 n=c['name']; cases=[r for r in base if r['component']==n]; dynamic=[r for r in states if r['component']==n]
 violations=sorted({v['id'] for r in cases+dynamic for v in r['axe']['violations']})
 incomplete=sorted({v['id'] for r in cases+dynamic for v in r['axe']['incomplete']})
 tickets=list(manual.get(n,[]))
 for rule,ticket in [('color-contrast','001'),('label-content-name-mismatch','011'),('button-name','003')]:
  if rule in violations and ticket not in tickets:tickets.append(ticket)
 nonconform=bool(tickets or [v for v in violations if v!='heading-order'])
 verdict='no conforme' if nonconform else 'conforme con condiciones'
 conditions=['Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.','Zoom nativo, tecnología asistiva y composición final pendientes.','Tipografía y escalas: SD-REM-009.']
 if incomplete:conditions.append('Adjudicar incomplete de axe: '+', '.join(incomplete)+'.')
 if 'heading-order' in violations:conditions.append('Resolver o justificar jerarquía de títulos en el consumidor.')
 if any(r['geometry']['overflow'] or r['geometry']['truncated'] for r in cases):conditions.append('Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.')
 if not tickets:tickets=['012']
 row={'component':n,'verdict':verdict,'violations':violations,'incomplete':incomplete,'tickets':['SD-REM-'+t for t in sorted(set(tickets))],'conditions':conditions,'cases':len(cases),'interactiveStates':len(dynamic)}
 verdicts.append(row); info=catalog[n]
 text=f'# {n}\n\n## Propósito\n\n{info["purpose"]}\n\n## Props y contrato\n\nFuente: [{c["file"]}:{c["line"]}](../../../{c["file"]}). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.\n\n```tsx\n{c["signature"]}\n\n{c["declarations"]}\n```\n\n## Uso correcto de API\n\n```tsx\nimport {{ {n} }} from "@ruum/ui";\n{info["correct"]}\n```\n\nEl consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.\n\n## Uso incorrecto o incompleto\n\n```tsx\n{info["incorrect"]}\n```\n\n## Accesibilidad y limitaciones\n\n{info["notes"]}\n\nNo se pasan className/style para corregir el componente base.\n\n## Estados\n\n'
 text+=', '.join(sorted({s['state'] for s in samples if s['component']==n}))+'.\n\n'
 text+='Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.\n\n'
 text+=f'**Veredicto técnico: {verdict}.** Axe con infracciones: {", ".join(violations) or "ninguna en las muestras"}.\n\nAcciones: '+', '.join(f'[{t}](../remediaciones/{t}.md)' for t in row['tickets'])+'.\n\nCondiciones:\n\n'+'\n'.join('- '+x for x in conditions)+'\n\n'
 text+='## Evidencia\n\n| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |\n|---|---|---|---|---|---|\n'
 for r in cases:text+=f'| {r["state"]} | {r["theme"]} | {r["width"]} | {r["mode"]} | [PNG](../{r["snapshot"]}) | [JSON](../resultados-base/{r["id"]}.json) |\n'
 for r in dynamic:text+=f'\n- {r["theme"]} · {r["state"]}: [captura](../{r["snapshot"]}), [reporte](../resultados-base/estado-{n}--{r["theme"]}--{r["state"]}.json).\n'
 (P/'componentes'/f'{n}.md').write_text(text,encoding='utf-8')
for id,(title,owner,priority,problem,dod) in issues.items():
 affected=[j['component'] for j in verdicts if 'SD-REM-'+id in j['tickets']]
 text=f'# SD-REM-{id} · {title}\n\nEstado: abierto. Fecha: 6 de noviembre de 2026, America/Mexico_City.\n\nResponsable funcional asignado: **{owner}**. Propietario nominal y fecha compromiso: pendientes de registro por el equipo. Prioridad: {priority}.\n\n## Hallazgo\n\n{problem}\n\nComponentes vinculados: {", ".join(affected) or "transversal al sistema y consumidores"}.\n\n## Evidencia\n\nFichas por componente, resultados-base, capturas-base, interacciones.json, comprobaciones-dirigidas.json, TOKENS.md y OVERRIDES.md según el hallazgo.\n\n## Cierre\n\n{dod}\n\nTicket local; no se creó una incidencia en un gestor externo. La asignación funcional requiere aceptación nominal del equipo.\n'
 (P/'remediaciones'/f'SD-REM-{id}.md').write_text(text,encoding='utf-8')
(P/'veredictos.json').write_text(json.dumps(verdicts,ensure_ascii=False,indent=2),encoding='utf-8')
counts=collections.Counter(v['verdict'] for v in verdicts)
stats={'components':len(verdicts),'samples':len(samples),'baseCases':len(base),'interactiveCases':len(states),'screenshots':len(raw),'tokens':len(set(t['name'] for t in inv['tokens'])),'verdicts':dict(counts),'axeRules':dict(collections.Counter(v['id'] for r in raw for v in r['axe']['violations']))}
(P/'resumen.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8')
table='| Componente | Veredicto | Reglas axe con infracciones | Remediaciones |\n|---|---|---|---|\n'
for v in verdicts:table+=f'| [{v["component"]}](componentes/{v["component"]}.md) | {v["verdict"]} | {", ".join(v["violations"]) or "ninguna en las muestras"} | {", ".join(v["tickets"])} |\n'
(P/'VEREDICTOS.md').write_text('# Veredicto por componente\n\n'+table,encoding='utf-8')
assert len(catalog)==len(inv['components'])==58
assert all(any(s['component']==c['name'] for s in samples) for c in inv['components'])
assert all((P/r['snapshot']).is_file() for r in raw)
changed=[s['file'] for s in inv['sources'] if hashlib.sha256((ROOT/s['file']).read_bytes()).hexdigest()!=s['sha256']]
assert not changed,changed
(P/'integridad.json').write_text(json.dumps({'documentedComponents':58,'missingScreenshots':0,'sourceHashChanges':changed,'results':'resultados-base','caseCount':len(raw)},indent=2),encoding='utf-8')
print(json.dumps(stats,ensure_ascii=False,indent=2))
