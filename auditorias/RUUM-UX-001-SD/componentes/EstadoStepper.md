# EstadoStepper

## Propósito

Alternar progreso móvil y de escritorio.

## Props y contrato

Fuente: [packages/ui/src/components/EstadoStepper.tsx:181](../../../packages/ui/src/components/EstadoStepper.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function EstadoStepper({ estado, currentLabel }: EstadoStepperProps) 

export interface EstadoStepperProps {
  estado: EstadoTraslado;
  currentLabel?: string;
}
```

## Uso correcto de API

```tsx
import { EstadoStepper } from "@ruum/ui";
<EstadoStepper estado="traslado_en_curso" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<EstadoStepper estado="desconocido" />
```

## Accesibilidad y limitaciones

Comparte hallazgos de MobileProgress y DesktopStateStepper.

No se pasan className/style para corregir el componente base.

## Estados

servicio_cancelado, servicio_cerrado, solicitud_creada, traslado_en_curso.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: label-content-name-mismatch.

Acciones: [SD-REM-011](../remediaciones/SD-REM-011.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: color-contrast.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| servicio_cancelado | dark | 390 | base | [PNG](../capturas-base/EstadoStepper--servicio_cancelado--dark--390--base.png) | [JSON](../resultados-base/EstadoStepper--servicio_cancelado--dark--390--base.json) |
| servicio_cancelado | light | 390 | base | [PNG](../capturas-base/EstadoStepper--servicio_cancelado--light--390--base.png) | [JSON](../resultados-base/EstadoStepper--servicio_cancelado--light--390--base.json) |
| servicio_cerrado | dark | 390 | base | [PNG](../capturas-base/EstadoStepper--servicio_cerrado--dark--390--base.png) | [JSON](../resultados-base/EstadoStepper--servicio_cerrado--dark--390--base.json) |
| servicio_cerrado | light | 390 | base | [PNG](../capturas-base/EstadoStepper--servicio_cerrado--light--390--base.png) | [JSON](../resultados-base/EstadoStepper--servicio_cerrado--light--390--base.json) |
| solicitud_creada | dark | 1440 | responsive | [PNG](../capturas-base/EstadoStepper--solicitud_creada--dark--1440--responsive.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--dark--1440--responsive.json) |
| solicitud_creada | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/EstadoStepper--solicitud_creada--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--dark--1440--zoom-css-200.json) |
| solicitud_creada | dark | 320 | responsive | [PNG](../capturas-base/EstadoStepper--solicitud_creada--dark--320--responsive.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--dark--320--responsive.json) |
| solicitud_creada | dark | 390 | base | [PNG](../capturas-base/EstadoStepper--solicitud_creada--dark--390--base.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--dark--390--base.json) |
| solicitud_creada | dark | 390 | zoom-css-200 | [PNG](../capturas-base/EstadoStepper--solicitud_creada--dark--390--zoom-css-200.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--dark--390--zoom-css-200.json) |
| solicitud_creada | dark | 768 | responsive | [PNG](../capturas-base/EstadoStepper--solicitud_creada--dark--768--responsive.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--dark--768--responsive.json) |
| solicitud_creada | light | 1440 | responsive | [PNG](../capturas-base/EstadoStepper--solicitud_creada--light--1440--responsive.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--light--1440--responsive.json) |
| solicitud_creada | light | 1440 | zoom-css-200 | [PNG](../capturas-base/EstadoStepper--solicitud_creada--light--1440--zoom-css-200.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--light--1440--zoom-css-200.json) |
| solicitud_creada | light | 320 | responsive | [PNG](../capturas-base/EstadoStepper--solicitud_creada--light--320--responsive.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--light--320--responsive.json) |
| solicitud_creada | light | 390 | base | [PNG](../capturas-base/EstadoStepper--solicitud_creada--light--390--base.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--light--390--base.json) |
| solicitud_creada | light | 390 | zoom-css-200 | [PNG](../capturas-base/EstadoStepper--solicitud_creada--light--390--zoom-css-200.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--light--390--zoom-css-200.json) |
| solicitud_creada | light | 768 | responsive | [PNG](../capturas-base/EstadoStepper--solicitud_creada--light--768--responsive.png) | [JSON](../resultados-base/EstadoStepper--solicitud_creada--light--768--responsive.json) |
| traslado_en_curso | dark | 390 | base | [PNG](../capturas-base/EstadoStepper--traslado_en_curso--dark--390--base.png) | [JSON](../resultados-base/EstadoStepper--traslado_en_curso--dark--390--base.json) |
| traslado_en_curso | light | 390 | base | [PNG](../capturas-base/EstadoStepper--traslado_en_curso--light--390--base.png) | [JSON](../resultados-base/EstadoStepper--traslado_en_curso--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-EstadoStepper--dark--active.png), [reporte](../resultados-base/estado-EstadoStepper--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-EstadoStepper--dark--focus-visible.png), [reporte](../resultados-base/estado-EstadoStepper--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-EstadoStepper--dark--focus.png), [reporte](../resultados-base/estado-EstadoStepper--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-EstadoStepper--dark--hover.png), [reporte](../resultados-base/estado-EstadoStepper--dark--hover.json).

- light · active: [captura](../capturas-base/estado-EstadoStepper--light--active.png), [reporte](../resultados-base/estado-EstadoStepper--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-EstadoStepper--light--focus-visible.png), [reporte](../resultados-base/estado-EstadoStepper--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-EstadoStepper--light--focus.png), [reporte](../resultados-base/estado-EstadoStepper--light--focus.json).

- light · hover: [captura](../capturas-base/estado-EstadoStepper--light--hover.png), [reporte](../resultados-base/estado-EstadoStepper--light--hover.json).
