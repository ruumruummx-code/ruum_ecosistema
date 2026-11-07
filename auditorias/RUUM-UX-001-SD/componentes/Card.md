# Card

## Propósito

Agrupar contenido sobre una superficie.

## Props y contrato

Fuente: [packages/ui/src/components/Card.tsx:29](../../../packages/ui/src/components/Card.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Card({ children, className = "", padding = "md", elevated = false }: CardProps) 

type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: CardPadding;
  elevated?: boolean;
}

type VariantCardProps = Omit<CardProps, "elevated">;

export interface TripCardProps extends VariantCardProps {
  folio?: string;
}
```

## Uso correcto de API

```tsx
import { Card } from "@ruum/ui";
<Card><h2>Resumen</h2><p>Datos del traslado</p></Card>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Card onClick={continuar}>Abrir</Card>
```

## Accesibilidad y limitaciones

No admite onClick en su contrato; usar un control real dentro.

No se pasan className/style para corregir el componente base.

## Estados

default, long-content.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/Card--default--dark--1440--responsive.png) | [JSON](../resultados-base/Card--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Card--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Card--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Card--default--dark--320--responsive.png) | [JSON](../resultados-base/Card--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Card--default--dark--390--base.png) | [JSON](../resultados-base/Card--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Card--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Card--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Card--default--dark--768--responsive.png) | [JSON](../resultados-base/Card--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Card--default--light--1440--responsive.png) | [JSON](../resultados-base/Card--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Card--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Card--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Card--default--light--320--responsive.png) | [JSON](../resultados-base/Card--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Card--default--light--390--base.png) | [JSON](../resultados-base/Card--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Card--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Card--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Card--default--light--768--responsive.png) | [JSON](../resultados-base/Card--default--light--768--responsive.json) |
| long-content | dark | 390 | base | [PNG](../capturas-base/Card--long-content--dark--390--base.png) | [JSON](../resultados-base/Card--long-content--dark--390--base.json) |
| long-content | light | 390 | base | [PNG](../capturas-base/Card--long-content--light--390--base.png) | [JSON](../resultados-base/Card--long-content--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-Card--dark--active.png), [reporte](../resultados-base/estado-Card--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Card--dark--focus-visible.png), [reporte](../resultados-base/estado-Card--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Card--dark--focus.png), [reporte](../resultados-base/estado-Card--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Card--dark--hover.png), [reporte](../resultados-base/estado-Card--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Card--light--active.png), [reporte](../resultados-base/estado-Card--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Card--light--focus-visible.png), [reporte](../resultados-base/estado-Card--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Card--light--focus.png), [reporte](../resultados-base/estado-Card--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Card--light--hover.png), [reporte](../resultados-base/estado-Card--light--hover.json).
