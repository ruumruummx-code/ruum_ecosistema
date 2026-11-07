# DesktopStateStepper

## Propósito

Mostrar etapas en una franja de escritorio.

## Props y contrato

Fuente: [packages/ui/src/components/EstadoStepper.tsx:120](../../../packages/ui/src/components/EstadoStepper.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function DesktopStateStepper({ estado, currentLabel }: EstadoStepperProps) 

export interface EstadoStepperProps {
  estado: EstadoTraslado;
  currentLabel?: string;
}
```

## Uso correcto de API

```tsx
import { DesktopStateStepper } from "@ruum/ui";
<DesktopStateStepper estado="traslado_en_curso" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<DesktopStateStepper estado="desconocido" />
```

## Accesibilidad y limitaciones

Se oculta bajo md; usar EstadoStepper para composición responsive.

No se pasan className/style para corregir el componente base.

## Estados

servicio_cancelado, servicio_cerrado, solicitud_creada, traslado_en_curso.

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
| servicio_cancelado | dark | 390 | base | [PNG](../capturas-base/DesktopStateStepper--servicio_cancelado--dark--390--base.png) | [JSON](../resultados-base/DesktopStateStepper--servicio_cancelado--dark--390--base.json) |
| servicio_cancelado | light | 390 | base | [PNG](../capturas-base/DesktopStateStepper--servicio_cancelado--light--390--base.png) | [JSON](../resultados-base/DesktopStateStepper--servicio_cancelado--light--390--base.json) |
| servicio_cerrado | dark | 390 | base | [PNG](../capturas-base/DesktopStateStepper--servicio_cerrado--dark--390--base.png) | [JSON](../resultados-base/DesktopStateStepper--servicio_cerrado--dark--390--base.json) |
| servicio_cerrado | light | 390 | base | [PNG](../capturas-base/DesktopStateStepper--servicio_cerrado--light--390--base.png) | [JSON](../resultados-base/DesktopStateStepper--servicio_cerrado--light--390--base.json) |
| solicitud_creada | dark | 1440 | responsive | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--dark--1440--responsive.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--dark--1440--responsive.json) |
| solicitud_creada | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--dark--1440--zoom-css-200.json) |
| solicitud_creada | dark | 320 | responsive | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--dark--320--responsive.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--dark--320--responsive.json) |
| solicitud_creada | dark | 390 | base | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--dark--390--base.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--dark--390--base.json) |
| solicitud_creada | dark | 390 | zoom-css-200 | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--dark--390--zoom-css-200.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--dark--390--zoom-css-200.json) |
| solicitud_creada | dark | 768 | responsive | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--dark--768--responsive.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--dark--768--responsive.json) |
| solicitud_creada | light | 1440 | responsive | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--light--1440--responsive.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--light--1440--responsive.json) |
| solicitud_creada | light | 1440 | zoom-css-200 | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--light--1440--zoom-css-200.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--light--1440--zoom-css-200.json) |
| solicitud_creada | light | 320 | responsive | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--light--320--responsive.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--light--320--responsive.json) |
| solicitud_creada | light | 390 | base | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--light--390--base.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--light--390--base.json) |
| solicitud_creada | light | 390 | zoom-css-200 | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--light--390--zoom-css-200.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--light--390--zoom-css-200.json) |
| solicitud_creada | light | 768 | responsive | [PNG](../capturas-base/DesktopStateStepper--solicitud_creada--light--768--responsive.png) | [JSON](../resultados-base/DesktopStateStepper--solicitud_creada--light--768--responsive.json) |
| traslado_en_curso | dark | 390 | base | [PNG](../capturas-base/DesktopStateStepper--traslado_en_curso--dark--390--base.png) | [JSON](../resultados-base/DesktopStateStepper--traslado_en_curso--dark--390--base.json) |
| traslado_en_curso | light | 390 | base | [PNG](../capturas-base/DesktopStateStepper--traslado_en_curso--light--390--base.png) | [JSON](../resultados-base/DesktopStateStepper--traslado_en_curso--light--390--base.json) |
