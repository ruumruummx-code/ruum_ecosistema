# Radio

## Propósito

Seleccionar una alternativa de un grupo.

## Props y contrato

Fuente: [packages/ui/src/components/Controls.tsx:104](../../../packages/ui/src/components/Controls.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Radio({ etiqueta, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { etiqueta: ReactNode }) 


```

## Uso correcto de API

```tsx
import { Radio } from "@ruum/ui";
<Radio etiqueta="Español" name="idioma" value="es" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Radio etiqueta="Español" />
```

## Accesibilidad y limitaciones

El consumidor debe compartir name y aportar leyenda al grupo.

No se pasan className/style para corregir el componente base.

## Estados

checked, default, disabled.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: conforme con condiciones.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-012](../remediaciones/SD-REM-012.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| checked | dark | 390 | base | [PNG](../capturas-base/Radio--checked--dark--390--base.png) | [JSON](../resultados-base/Radio--checked--dark--390--base.json) |
| checked | light | 390 | base | [PNG](../capturas-base/Radio--checked--light--390--base.png) | [JSON](../resultados-base/Radio--checked--light--390--base.json) |
| default | dark | 1440 | responsive | [PNG](../capturas-base/Radio--default--dark--1440--responsive.png) | [JSON](../resultados-base/Radio--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Radio--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Radio--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Radio--default--dark--320--responsive.png) | [JSON](../resultados-base/Radio--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Radio--default--dark--390--base.png) | [JSON](../resultados-base/Radio--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Radio--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Radio--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Radio--default--dark--768--responsive.png) | [JSON](../resultados-base/Radio--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Radio--default--light--1440--responsive.png) | [JSON](../resultados-base/Radio--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Radio--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Radio--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Radio--default--light--320--responsive.png) | [JSON](../resultados-base/Radio--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Radio--default--light--390--base.png) | [JSON](../resultados-base/Radio--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Radio--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Radio--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Radio--default--light--768--responsive.png) | [JSON](../resultados-base/Radio--default--light--768--responsive.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/Radio--disabled--dark--390--base.png) | [JSON](../resultados-base/Radio--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/Radio--disabled--light--390--base.png) | [JSON](../resultados-base/Radio--disabled--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-Radio--dark--active.png), [reporte](../resultados-base/estado-Radio--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Radio--dark--focus-visible.png), [reporte](../resultados-base/estado-Radio--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Radio--dark--focus.png), [reporte](../resultados-base/estado-Radio--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Radio--dark--hover.png), [reporte](../resultados-base/estado-Radio--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Radio--light--active.png), [reporte](../resultados-base/estado-Radio--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Radio--light--focus-visible.png), [reporte](../resultados-base/estado-Radio--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Radio--light--focus.png), [reporte](../resultados-base/estado-Radio--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Radio--light--hover.png), [reporte](../resultados-base/estado-Radio--light--hover.json).
