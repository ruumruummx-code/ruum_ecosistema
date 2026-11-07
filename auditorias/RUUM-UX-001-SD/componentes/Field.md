# Field

## Propósito

Entrada etiquetada, ayuda asociada y contraseña con visibilidad.

## Props y contrato

Fuente: [packages/ui/src/components/Field.tsx:15](../../../packages/ui/src/components/Field.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
forwardRef<HTMLInputElement, FieldProps>

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  etiquetaClassName?: string;
  passwordToggleClassName?: string;
  error?: string | undefined;
  ayuda?: ReactNode;
}
```

## Uso correcto de API

```tsx
import { Field } from "@ruum/ui";
<Field etiqueta="Correo" type="email" ayuda="Usa tu correo registrado" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Field etiqueta="" />
```

## Accesibilidad y limitaciones

useId cubre omisión de id; validar colisiones si se fuerza el mismo name/id.

No se pasan className/style para corregir el componente base.

## Estados

default, disabled, error, help, long-label, password.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/Field--default--dark--1440--responsive.png) | [JSON](../resultados-base/Field--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Field--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Field--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Field--default--dark--320--responsive.png) | [JSON](../resultados-base/Field--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Field--default--dark--390--base.png) | [JSON](../resultados-base/Field--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Field--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Field--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Field--default--dark--768--responsive.png) | [JSON](../resultados-base/Field--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Field--default--light--1440--responsive.png) | [JSON](../resultados-base/Field--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Field--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Field--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Field--default--light--320--responsive.png) | [JSON](../resultados-base/Field--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Field--default--light--390--base.png) | [JSON](../resultados-base/Field--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Field--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Field--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Field--default--light--768--responsive.png) | [JSON](../resultados-base/Field--default--light--768--responsive.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/Field--disabled--dark--390--base.png) | [JSON](../resultados-base/Field--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/Field--disabled--light--390--base.png) | [JSON](../resultados-base/Field--disabled--light--390--base.json) |
| error | dark | 390 | base | [PNG](../capturas-base/Field--error--dark--390--base.png) | [JSON](../resultados-base/Field--error--dark--390--base.json) |
| error | light | 390 | base | [PNG](../capturas-base/Field--error--light--390--base.png) | [JSON](../resultados-base/Field--error--light--390--base.json) |
| help | dark | 390 | base | [PNG](../capturas-base/Field--help--dark--390--base.png) | [JSON](../resultados-base/Field--help--dark--390--base.json) |
| help | light | 390 | base | [PNG](../capturas-base/Field--help--light--390--base.png) | [JSON](../resultados-base/Field--help--light--390--base.json) |
| long-label | dark | 390 | base | [PNG](../capturas-base/Field--long-label--dark--390--base.png) | [JSON](../resultados-base/Field--long-label--dark--390--base.json) |
| long-label | light | 390 | base | [PNG](../capturas-base/Field--long-label--light--390--base.png) | [JSON](../resultados-base/Field--long-label--light--390--base.json) |
| password | dark | 390 | base | [PNG](../capturas-base/Field--password--dark--390--base.png) | [JSON](../resultados-base/Field--password--dark--390--base.json) |
| password | light | 390 | base | [PNG](../capturas-base/Field--password--light--390--base.png) | [JSON](../resultados-base/Field--password--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-Field--dark--active.png), [reporte](../resultados-base/estado-Field--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Field--dark--focus-visible.png), [reporte](../resultados-base/estado-Field--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Field--dark--focus.png), [reporte](../resultados-base/estado-Field--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Field--dark--hover.png), [reporte](../resultados-base/estado-Field--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Field--light--active.png), [reporte](../resultados-base/estado-Field--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Field--light--focus-visible.png), [reporte](../resultados-base/estado-Field--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Field--light--focus.png), [reporte](../resultados-base/estado-Field--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Field--light--hover.png), [reporte](../resultados-base/estado-Field--light--hover.json).
