# TripCard

## Propósito

Agrupar información de un traslado y folio.

## Props y contrato

Fuente: [packages/ui/src/components/Card.tsx:58](../../../packages/ui/src/components/Card.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function TripCard({ children, className = "", padding = "md", folio }: TripCardProps) 

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
import { TripCard } from "@ruum/ui";
<TripCard folio="TR-123"><h2>Traslado</h2></TripCard>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<TripCard folio="TR-123"> </TripCard>
```

## Accesibilidad y limitaciones

Folio absoluto puede colisionar con contenido; probar textos largos.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/TripCard--default--dark--1440--responsive.png) | [JSON](../resultados-base/TripCard--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/TripCard--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/TripCard--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/TripCard--default--dark--320--responsive.png) | [JSON](../resultados-base/TripCard--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/TripCard--default--dark--390--base.png) | [JSON](../resultados-base/TripCard--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/TripCard--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/TripCard--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/TripCard--default--dark--768--responsive.png) | [JSON](../resultados-base/TripCard--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/TripCard--default--light--1440--responsive.png) | [JSON](../resultados-base/TripCard--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/TripCard--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/TripCard--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/TripCard--default--light--320--responsive.png) | [JSON](../resultados-base/TripCard--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/TripCard--default--light--390--base.png) | [JSON](../resultados-base/TripCard--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/TripCard--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/TripCard--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/TripCard--default--light--768--responsive.png) | [JSON](../resultados-base/TripCard--default--light--768--responsive.json) |
| long-content | dark | 390 | base | [PNG](../capturas-base/TripCard--long-content--dark--390--base.png) | [JSON](../resultados-base/TripCard--long-content--dark--390--base.json) |
| long-content | light | 390 | base | [PNG](../capturas-base/TripCard--long-content--light--390--base.png) | [JSON](../resultados-base/TripCard--long-content--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-TripCard--dark--active.png), [reporte](../resultados-base/estado-TripCard--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-TripCard--dark--focus-visible.png), [reporte](../resultados-base/estado-TripCard--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-TripCard--dark--focus.png), [reporte](../resultados-base/estado-TripCard--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-TripCard--dark--hover.png), [reporte](../resultados-base/estado-TripCard--dark--hover.json).

- light · active: [captura](../capturas-base/estado-TripCard--light--active.png), [reporte](../resultados-base/estado-TripCard--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-TripCard--light--focus-visible.png), [reporte](../resultados-base/estado-TripCard--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-TripCard--light--focus.png), [reporte](../resultados-base/estado-TripCard--light--focus.json).

- light · hover: [captura](../capturas-base/estado-TripCard--light--hover.png), [reporte](../resultados-base/estado-TripCard--light--hover.json).
