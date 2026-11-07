# FinancialCard

## Propósito

Agrupar información económica oficial.

## Props y contrato

Fuente: [packages/ui/src/components/Card.tsx:78](../../../packages/ui/src/components/Card.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function FinancialCard({ children, className = "", padding = "md" }: VariantCardProps) 

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
import { FinancialCard } from "@ruum/ui";
<FinancialCard><FinancialAmount status="confirmado" amount={1000} /></FinancialCard>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<FinancialCard>$0 confirmado</FinancialCard>
```

## Accesibilidad y limitaciones

No inventar monto para datos desconocidos.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/FinancialCard--default--dark--1440--responsive.png) | [JSON](../resultados-base/FinancialCard--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/FinancialCard--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/FinancialCard--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/FinancialCard--default--dark--320--responsive.png) | [JSON](../resultados-base/FinancialCard--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/FinancialCard--default--dark--390--base.png) | [JSON](../resultados-base/FinancialCard--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/FinancialCard--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/FinancialCard--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/FinancialCard--default--dark--768--responsive.png) | [JSON](../resultados-base/FinancialCard--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/FinancialCard--default--light--1440--responsive.png) | [JSON](../resultados-base/FinancialCard--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/FinancialCard--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/FinancialCard--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/FinancialCard--default--light--320--responsive.png) | [JSON](../resultados-base/FinancialCard--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/FinancialCard--default--light--390--base.png) | [JSON](../resultados-base/FinancialCard--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/FinancialCard--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/FinancialCard--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/FinancialCard--default--light--768--responsive.png) | [JSON](../resultados-base/FinancialCard--default--light--768--responsive.json) |
| long-content | dark | 390 | base | [PNG](../capturas-base/FinancialCard--long-content--dark--390--base.png) | [JSON](../resultados-base/FinancialCard--long-content--dark--390--base.json) |
| long-content | light | 390 | base | [PNG](../capturas-base/FinancialCard--long-content--light--390--base.png) | [JSON](../resultados-base/FinancialCard--long-content--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-FinancialCard--dark--active.png), [reporte](../resultados-base/estado-FinancialCard--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-FinancialCard--dark--focus-visible.png), [reporte](../resultados-base/estado-FinancialCard--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-FinancialCard--dark--focus.png), [reporte](../resultados-base/estado-FinancialCard--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-FinancialCard--dark--hover.png), [reporte](../resultados-base/estado-FinancialCard--dark--hover.json).

- light · active: [captura](../capturas-base/estado-FinancialCard--light--active.png), [reporte](../resultados-base/estado-FinancialCard--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-FinancialCard--light--focus-visible.png), [reporte](../resultados-base/estado-FinancialCard--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-FinancialCard--light--focus.png), [reporte](../resultados-base/estado-FinancialCard--light--focus.json).

- light · hover: [captura](../capturas-base/estado-FinancialCard--light--hover.png), [reporte](../resultados-base/estado-FinancialCard--light--hover.json).
