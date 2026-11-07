from pathlib import Path
import json,collections
P=Path(__file__).resolve().parent
load=lambda f:json.loads((P/f).read_text(encoding='utf-8-sig'))
inv=load('inventario.json'); tokens=load('tokens-calculados.json'); data=load('overrides.json')
esc=lambda s:str(s).replace('|','\\|').replace('\n',' ')
maps={r['theme']:{v['name']:v for v in r['values']} for r in tokens['results']}
defs=collections.defaultdict(list)
for t in inv['tokens']:defs[t['name']].append(t)
text='''# Tokens: inventario completo y contraste

Fuente: packages/ui/src/styles/tokens.css. La fixture usa exclusivamente los tokens base, sin contrast-tokens.css de app-usuario. @theme static conserva las variables no usadas para poder medirlas; no cambia valores.

## Inventario de los 180 tokens

Contraste no aplica a dimensiones, espacios, tipografía, radio, sombras o tiempos. Un color destinado a fondo no tiene que servir como texto. Se separan pares semánticos reales y aptitud hipotética como primer plano.

| Token | Fuente (línea: valor) | Light calculado | Dark calculado | Tipo |
|---|---|---|---|---|
'''
for name,items in sorted(defs.items()):
 values=[maps[t].get(name,{}).get('value','') for t in ['light','dark']]
 kind='color' if any(maps[t].get(name,{}).get('rgba') for t in maps) else 'gradiente' if any('gradient(' in v for v in values) else 'no color / sin resolver'
 text+='| `'+name+'` | '+esc('; '.join(str(t['line'])+': '+t['value'] for t in items))+' | '+esc(values[0] or 'sin valor en este tema')+' | '+esc(values[1] or 'sin valor en este tema')+' | '+kind+' |\n'
text+='''
## Pares y veredictos de contraste

Umbrales: texto normal 4.5:1; texto grande y UI esencial 3:1. Borde/foco se juzga como UI, no como texto. Disabled tiene exención normativa; su legibilidad sigue siendo un criterio interno del ticket. No se redondea antes de comparar.

| Tema | Primer plano | Fondo | Ratio | Normal | UI/grande | Uso/nota |
|---|---|---|---|---|---|---|
'''
for t in tokens['pairs']:
 text+=f'| {t["theme"]} | `{t["foreground"]}` | `{t["background"]}` | '+(f'{t["ratio"]:.3f}:1' if 'ratio' in t else 'sin resolver')+' | '+('sí' if t.get('normalText') else 'no')+' | '+('sí' if t.get('ui') else 'no')+' | '+('disabled: exento WCAG; criterio interno' if t.get('disabledExemption') else t.get('usage','texto'))+' |\n'
text+='''
La tabla completa de aptitud en tokens-calculados.json compara cada color como primer plano con canvas, surface y surface-elevated en ambos temas. No equivale a que un token de fondo deba cumplir como texto. Los gradientes se muestrean en 101 posiciones sRGB entre extremos; route-gradient no se declara defectuoso solo por una hipotética combinación con blanco si ese uso no existe.

## Tipografía y forma

- Escala declarada: display 40, h1 32, h2 24, h3 18, cuerpo 16, small 14 y caption 12 px.
- Pesos y line-height se expresan principalmente con utilidades por componente; no hay una escala semántica completa de esos dos ejes.
- Familias font-body/font-display dependen de --font-body-loaded y font-mono-ruum de --font-mono-loaded. Si faltan, las declaraciones quedan sin resolver. El showcase final no introduce un override de familia para ocultarlo. Debe comprobarse la fuente efectivamente cargada en cada app.
- Espacios: --ruum-space-4/8/12/16/20/24/32/40/48; muchos padding/gap usan utilidades y no esas variables.
- Elevaciones 1/2 y aliases --ruum-shadow-* conviven con sombras arbitrarias.
- Radios sm/md/lg/xl/2xl/full y button/field/card/modal conviven con literales y rounded-card.
- La consistencia de uso requiere co-revisión y SD-REM-009; no se cambiaron tokens para producir una aprobación.

## Controles inactivos

contraste-disabled.json registra colores calculados, opacidad y ratios en estados disabled/loading. Compone fondos sólidos y opacidad local; gradientes requieren además la tabla de tokens. Sus resultados se separan de violations de axe porque WCAG 1.4.3 exime controles inactivos. No se interpreta esa exención como aceptación automática de la exigencia interna del ticket.

[W3C: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) · [W3C: contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast).
'''
(P/'TOKENS.md').write_text(text,encoding='utf-8')
text=f'''# Inventario de overrides

Se analizaron importaciones nombradas de @ruum/ui en apps/**/*.tsx y redeclaraciones de tokens conocidos en CSS. No se resuelven todas las propagaciones, wrappers, namespace imports o CSS externo: no constituye prueba de ausencia global de overrides.

{len(data['references'])} usos, {len(data['overrides'])} candidatos de override/props dinámicas y {len(data['cssTokens'])} redeclaraciones de tokens.

Las instancias del showcase final no reciben className/style que reparen su apariencia. El host solo aporta padding externo, rótulos de auditoría y área mínima de captura. No se cargan estilos de apps. Los candidatos de consumidores conservan justificación y veredicto preliminar por fila; no se inventaron aprobaciones nominales. La revisión de compensaciones corresponde a SD-REM-010.

| Archivo/línea | Componente | Tipo | Expresión | Categoría | Justificación | Veredicto |
|---|---|---|---|---|---|---|
'''
for r in data['overrides']:text+=f'| {r["file"]}:{r["line"]} | {r["component"]} | {r["kind"]} | `{esc(r["expression"])}` | {r["category"]} | {r["justification"]} | {r["verdict"]} |\n'
text+='\n## Redeclaraciones\n\n| Archivo/línea | Token | Valor | Veredicto |\n|---|---|---|---|\n'
for r in data['cssTokens']:text+=f'| {r["file"]}:{r["line"]} | `{r["token"]}` | `{esc(r["value"])}` | {r["verdict"]} |\n'
(P/'OVERRIDES.md').write_text(text,encoding='utf-8')
text='''# Utilidades e integración

useDialogAccesible, useRuumTheme y useStreetMode se montan mediante consumidores mínimos en el showcase. indiceEtapaActual y estadoVisualDesdeTecnico se cubren por las pruebas existentes de mapeos y estados. Los helpers no reciben un veredicto visual como si fueran DOM.

Veredicto de utilidades: conforme con condiciones de integración y co-revisión; no es aceptación formal.

useDialogAccesible pasó entrada, contención bidireccional, Escape y retorno de foco en la muestra de dialog nativo, en ambos temas. No se extrapola a Modal, que utiliza otra implementación. Los hooks de tema/calle se montan y recorren con teclado; no se certifican persistencia completa entre sesiones, concurrencia entre proveedores ni dispositivos físicos.

TextInputUppercaseBridge se documenta como componente de integración sin DOM propio: la muestra incorpora campos y comprueba mayúsculas de nombre y preservación del correo. IME, cursor y casos lingüísticos ampliados quedan sujetos a integración.

'''
for u in inv['utilities']:text+=f'## {u["name"]}\n\nFuente: {u["file"]}:{u["line"]}.\n\n```tsx\n{u["signature"]}\n\n{u["declarations"]}\n```\n\n'
(P/'UTILIDADES.md').write_text(text,encoding='utf-8')
print('Tokens, overrides y utilidades documentados.')
