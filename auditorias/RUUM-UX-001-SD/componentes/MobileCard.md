# MobileCard

## Propósito

Contener contenido móvil con padding y radio.

## Props y contrato

Fuente: [packages/ui/src/components/MobileCard.tsx:29](../../../packages/ui/src/components/MobileCard.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function MobileCard({
  children,
  className = "",
  as: Component = "section",
  padding = "md",
  elevated = false,
  radius = "2xl",
}: MobileCardProps) 

export type MobileCardPadding = "none" | "sm" | "md" | "lg";

export type MobileCardRadius = "md" | "lg" | "xl" | "2xl";

export interface MobileCardProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  padding?: MobileCardPadding;
  elevated?: boolean;
  radius?: MobileCardRadius;
}
```

## Uso correcto de API

```tsx
import { MobileCard } from "@ruum/ui";
<MobileCard><h2>Mi cuenta</h2></MobileCard>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<MobileCard as="button"><button>Abrir</button></MobileCard>
```

## Accesibilidad y limitaciones

as no debe crear controles anidados.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/MobileCard--default--dark--1440--responsive.png) | [JSON](../resultados-base/MobileCard--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileCard--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileCard--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/MobileCard--default--dark--320--responsive.png) | [JSON](../resultados-base/MobileCard--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/MobileCard--default--dark--390--base.png) | [JSON](../resultados-base/MobileCard--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/MobileCard--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/MobileCard--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/MobileCard--default--dark--768--responsive.png) | [JSON](../resultados-base/MobileCard--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/MobileCard--default--light--1440--responsive.png) | [JSON](../resultados-base/MobileCard--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileCard--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileCard--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/MobileCard--default--light--320--responsive.png) | [JSON](../resultados-base/MobileCard--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/MobileCard--default--light--390--base.png) | [JSON](../resultados-base/MobileCard--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/MobileCard--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/MobileCard--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/MobileCard--default--light--768--responsive.png) | [JSON](../resultados-base/MobileCard--default--light--768--responsive.json) |
| long-content | dark | 390 | base | [PNG](../capturas-base/MobileCard--long-content--dark--390--base.png) | [JSON](../resultados-base/MobileCard--long-content--dark--390--base.json) |
| long-content | light | 390 | base | [PNG](../capturas-base/MobileCard--long-content--light--390--base.png) | [JSON](../resultados-base/MobileCard--long-content--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-MobileCard--dark--active.png), [reporte](../resultados-base/estado-MobileCard--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-MobileCard--dark--focus-visible.png), [reporte](../resultados-base/estado-MobileCard--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-MobileCard--dark--focus.png), [reporte](../resultados-base/estado-MobileCard--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-MobileCard--dark--hover.png), [reporte](../resultados-base/estado-MobileCard--dark--hover.json).

- light · active: [captura](../capturas-base/estado-MobileCard--light--active.png), [reporte](../resultados-base/estado-MobileCard--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-MobileCard--light--focus-visible.png), [reporte](../resultados-base/estado-MobileCard--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-MobileCard--light--focus.png), [reporte](../resultados-base/estado-MobileCard--light--focus.json).

- light · hover: [captura](../capturas-base/estado-MobileCard--light--hover.png), [reporte](../resultados-base/estado-MobileCard--light--hover.json).
