# Select

## Propósito

Seleccionar una opción con etiqueta visible.

## Props y contrato

Fuente: [packages/ui/src/components/Controls.tsx:44](../../../packages/ui/src/components/Controls.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Select({
  etiqueta,
  error,
  ayuda,
  children,
  id,
  "aria-describedby": describedBy,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { etiqueta: string; error?: string; ayuda?: ReactNode; children: ReactNode }) 


```

## Uso correcto de API

```tsx
import { Select } from "@ruum/ui";
<Select id="unidad" etiqueta="Unidad"><option>Métrico</option></Select>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Select etiqueta="" />
```

## Accesibilidad y limitaciones

Requiere ID único; revisar asociación del mensaje de error.

No se pasan className/style para corregir el componente base.

## Estados

default, disabled, error, help, long-label, multiple-without-id.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-004](../remediaciones/SD-REM-004.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: duplicate-id-aria, form-field-multiple-labels.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/Select--default--dark--1440--responsive.png) | [JSON](../resultados-base/Select--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Select--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Select--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Select--default--dark--320--responsive.png) | [JSON](../resultados-base/Select--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Select--default--dark--390--base.png) | [JSON](../resultados-base/Select--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Select--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Select--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Select--default--dark--768--responsive.png) | [JSON](../resultados-base/Select--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Select--default--light--1440--responsive.png) | [JSON](../resultados-base/Select--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Select--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Select--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Select--default--light--320--responsive.png) | [JSON](../resultados-base/Select--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Select--default--light--390--base.png) | [JSON](../resultados-base/Select--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Select--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Select--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Select--default--light--768--responsive.png) | [JSON](../resultados-base/Select--default--light--768--responsive.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/Select--disabled--dark--390--base.png) | [JSON](../resultados-base/Select--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/Select--disabled--light--390--base.png) | [JSON](../resultados-base/Select--disabled--light--390--base.json) |
| error | dark | 390 | base | [PNG](../capturas-base/Select--error--dark--390--base.png) | [JSON](../resultados-base/Select--error--dark--390--base.json) |
| error | light | 390 | base | [PNG](../capturas-base/Select--error--light--390--base.png) | [JSON](../resultados-base/Select--error--light--390--base.json) |
| help | dark | 390 | base | [PNG](../capturas-base/Select--help--dark--390--base.png) | [JSON](../resultados-base/Select--help--dark--390--base.json) |
| help | light | 390 | base | [PNG](../capturas-base/Select--help--light--390--base.png) | [JSON](../resultados-base/Select--help--light--390--base.json) |
| long-label | dark | 390 | base | [PNG](../capturas-base/Select--long-label--dark--390--base.png) | [JSON](../resultados-base/Select--long-label--dark--390--base.json) |
| long-label | light | 390 | base | [PNG](../capturas-base/Select--long-label--light--390--base.png) | [JSON](../resultados-base/Select--long-label--light--390--base.json) |
| multiple-without-id | dark | 390 | base | [PNG](../capturas-base/Select--multiple-without-id--dark--390--base.png) | [JSON](../resultados-base/Select--multiple-without-id--dark--390--base.json) |
| multiple-without-id | light | 390 | base | [PNG](../capturas-base/Select--multiple-without-id--light--390--base.png) | [JSON](../resultados-base/Select--multiple-without-id--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-Select--dark--active.png), [reporte](../resultados-base/estado-Select--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Select--dark--focus-visible.png), [reporte](../resultados-base/estado-Select--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Select--dark--focus.png), [reporte](../resultados-base/estado-Select--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Select--dark--hover.png), [reporte](../resultados-base/estado-Select--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Select--light--active.png), [reporte](../resultados-base/estado-Select--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Select--light--focus-visible.png), [reporte](../resultados-base/estado-Select--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Select--light--focus.png), [reporte](../resultados-base/estado-Select--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Select--light--hover.png), [reporte](../resultados-base/estado-Select--light--hover.json).
