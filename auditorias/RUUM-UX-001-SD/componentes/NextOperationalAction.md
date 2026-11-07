# NextOperationalAction

## Propósito

Presentar siguiente paso con CTA, carga y error.

## Props y contrato

Fuente: [packages/ui/src/components/NextOperationalAction.tsx:90](../../../packages/ui/src/components/NextOperationalAction.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function NextOperationalAction({
  title,
  instruction,
  context,
  eta,
  primaryCta,
  secondaryCta,
  loading = false,
  error,
  nextStep,
  stageLabel,
  className = ""
}: NextOperationalActionProps) 

export type OperationalActionCta = {
  label: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  external?: boolean;
  variant?: ButtonVariant;
};

export interface NextOperationalActionProps {
  title: string;
  instruction: string;
  context?: ReactNode;
  eta?: string | null;
  primaryCta: OperationalActionCta;
  secondaryCta?: OperationalActionCta;
  loading?: boolean;
  error?: ReactNode;
  nextStep?: string;
  stageLabel?: string;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { NextOperationalAction } from "@ruum/ui";
<NextOperationalAction title="Continuar" instruction="Revisa los datos" primaryCta={{label:'Revisar',onClick:revisar}} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<NextOperationalAction title="Continuar" instruction="Revisa" primaryCta={{label:'Ir',href:'/paso',disabled:true}} />
```

## Accesibilidad y limitaciones

El enlace disabled sigue activable por teclado; bloquear en el componente.

No se pasan className/style para corregir el componente base.

## Estados

default, disabled-link, error, loading.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-007](../remediaciones/SD-REM-007.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: color-contrast.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/NextOperationalAction--default--dark--1440--responsive.png) | [JSON](../resultados-base/NextOperationalAction--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/NextOperationalAction--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/NextOperationalAction--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/NextOperationalAction--default--dark--320--responsive.png) | [JSON](../resultados-base/NextOperationalAction--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/NextOperationalAction--default--dark--390--base.png) | [JSON](../resultados-base/NextOperationalAction--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/NextOperationalAction--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/NextOperationalAction--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/NextOperationalAction--default--dark--768--responsive.png) | [JSON](../resultados-base/NextOperationalAction--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/NextOperationalAction--default--light--1440--responsive.png) | [JSON](../resultados-base/NextOperationalAction--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/NextOperationalAction--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/NextOperationalAction--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/NextOperationalAction--default--light--320--responsive.png) | [JSON](../resultados-base/NextOperationalAction--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/NextOperationalAction--default--light--390--base.png) | [JSON](../resultados-base/NextOperationalAction--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/NextOperationalAction--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/NextOperationalAction--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/NextOperationalAction--default--light--768--responsive.png) | [JSON](../resultados-base/NextOperationalAction--default--light--768--responsive.json) |
| disabled-link | dark | 390 | base | [PNG](../capturas-base/NextOperationalAction--disabled-link--dark--390--base.png) | [JSON](../resultados-base/NextOperationalAction--disabled-link--dark--390--base.json) |
| disabled-link | light | 390 | base | [PNG](../capturas-base/NextOperationalAction--disabled-link--light--390--base.png) | [JSON](../resultados-base/NextOperationalAction--disabled-link--light--390--base.json) |
| error | dark | 390 | base | [PNG](../capturas-base/NextOperationalAction--error--dark--390--base.png) | [JSON](../resultados-base/NextOperationalAction--error--dark--390--base.json) |
| error | light | 390 | base | [PNG](../capturas-base/NextOperationalAction--error--light--390--base.png) | [JSON](../resultados-base/NextOperationalAction--error--light--390--base.json) |
| loading | dark | 390 | base | [PNG](../capturas-base/NextOperationalAction--loading--dark--390--base.png) | [JSON](../resultados-base/NextOperationalAction--loading--dark--390--base.json) |
| loading | light | 390 | base | [PNG](../capturas-base/NextOperationalAction--loading--light--390--base.png) | [JSON](../resultados-base/NextOperationalAction--loading--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-NextOperationalAction--dark--active.png), [reporte](../resultados-base/estado-NextOperationalAction--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-NextOperationalAction--dark--focus-visible.png), [reporte](../resultados-base/estado-NextOperationalAction--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-NextOperationalAction--dark--focus.png), [reporte](../resultados-base/estado-NextOperationalAction--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-NextOperationalAction--dark--hover.png), [reporte](../resultados-base/estado-NextOperationalAction--dark--hover.json).

- light · active: [captura](../capturas-base/estado-NextOperationalAction--light--active.png), [reporte](../resultados-base/estado-NextOperationalAction--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-NextOperationalAction--light--focus-visible.png), [reporte](../resultados-base/estado-NextOperationalAction--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-NextOperationalAction--light--focus.png), [reporte](../resultados-base/estado-NextOperationalAction--light--focus.json).

- light · hover: [captura](../capturas-base/estado-NextOperationalAction--light--hover.png), [reporte](../resultados-base/estado-NextOperationalAction--light--hover.json).
