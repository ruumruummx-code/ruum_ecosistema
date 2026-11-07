# Toggle

## Propósito

Cambiar un valor booleano con semántica switch.

## Props y contrato

Fuente: [packages/ui/src/components/Controls.tsx:113](../../../packages/ui/src/components/Controls.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Toggle({
  etiqueta,
  checked,
  onCheckedChange,
  disabled,
  className = "",
}: {
  etiqueta: string;
  checked: boolean;
  onCheckedChange?: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
}) 


```

## Uso correcto de API

```tsx
import { Toggle } from "@ruum/ui";
<Toggle etiqueta="Notificaciones" checked={activo} onCheckedChange={setActivo} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Toggle etiqueta="" checked={activo} />
```

## Accesibilidad y limitaciones

Estado controlado; checked no acredita persistencia remota.

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
| checked | dark | 390 | base | [PNG](../capturas-base/Toggle--checked--dark--390--base.png) | [JSON](../resultados-base/Toggle--checked--dark--390--base.json) |
| checked | light | 390 | base | [PNG](../capturas-base/Toggle--checked--light--390--base.png) | [JSON](../resultados-base/Toggle--checked--light--390--base.json) |
| default | dark | 1440 | responsive | [PNG](../capturas-base/Toggle--default--dark--1440--responsive.png) | [JSON](../resultados-base/Toggle--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Toggle--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Toggle--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Toggle--default--dark--320--responsive.png) | [JSON](../resultados-base/Toggle--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Toggle--default--dark--390--base.png) | [JSON](../resultados-base/Toggle--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Toggle--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Toggle--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Toggle--default--dark--768--responsive.png) | [JSON](../resultados-base/Toggle--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Toggle--default--light--1440--responsive.png) | [JSON](../resultados-base/Toggle--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Toggle--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Toggle--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Toggle--default--light--320--responsive.png) | [JSON](../resultados-base/Toggle--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Toggle--default--light--390--base.png) | [JSON](../resultados-base/Toggle--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Toggle--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Toggle--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Toggle--default--light--768--responsive.png) | [JSON](../resultados-base/Toggle--default--light--768--responsive.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/Toggle--disabled--dark--390--base.png) | [JSON](../resultados-base/Toggle--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/Toggle--disabled--light--390--base.png) | [JSON](../resultados-base/Toggle--disabled--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-Toggle--dark--active.png), [reporte](../resultados-base/estado-Toggle--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Toggle--dark--focus-visible.png), [reporte](../resultados-base/estado-Toggle--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Toggle--dark--focus.png), [reporte](../resultados-base/estado-Toggle--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Toggle--dark--hover.png), [reporte](../resultados-base/estado-Toggle--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Toggle--light--active.png), [reporte](../resultados-base/estado-Toggle--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Toggle--light--focus-visible.png), [reporte](../resultados-base/estado-Toggle--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Toggle--light--focus.png), [reporte](../resultados-base/estado-Toggle--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Toggle--light--hover.png), [reporte](../resultados-base/estado-Toggle--light--hover.json).
