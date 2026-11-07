# PassportCard

## Propósito

Agrupar expediente documental con folio.

## Props y contrato

Fuente: [packages/ui/src/components/PassportCard.tsx:15](../../../packages/ui/src/components/PassportCard.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function PassportCard({ children, folio, acento = false, clip = true, className = "" }: PassportCardProps) 

export interface PassportCardProps {
  children: ReactNode;
  /** Folio o identificador corto a mostrar en la esquina, estilo sello. */
  folio?: string;
  /** Acento documental para registros que requieren atención visual. */
  acento?: boolean;
  /** Permite contenido sticky o overlays que deben sobresalir de la tarjeta. */
  clip?: boolean;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { PassportCard } from "@ruum/ui";
<PassportCard folio="TR-123"><h2>Pasaporte</h2></PassportCard>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<PassportCard clip><button> </button></PassportCard>
```

## Accesibilidad y limitaciones

clip puede cortar overlays; documentar necesidad de clip=false.

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
- Adjudicar incomplete de axe: color-contrast.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/PassportCard--default--dark--1440--responsive.png) | [JSON](../resultados-base/PassportCard--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/PassportCard--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/PassportCard--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/PassportCard--default--dark--320--responsive.png) | [JSON](../resultados-base/PassportCard--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/PassportCard--default--dark--390--base.png) | [JSON](../resultados-base/PassportCard--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/PassportCard--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/PassportCard--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/PassportCard--default--dark--768--responsive.png) | [JSON](../resultados-base/PassportCard--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/PassportCard--default--light--1440--responsive.png) | [JSON](../resultados-base/PassportCard--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/PassportCard--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/PassportCard--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/PassportCard--default--light--320--responsive.png) | [JSON](../resultados-base/PassportCard--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/PassportCard--default--light--390--base.png) | [JSON](../resultados-base/PassportCard--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/PassportCard--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/PassportCard--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/PassportCard--default--light--768--responsive.png) | [JSON](../resultados-base/PassportCard--default--light--768--responsive.json) |
| long-content | dark | 390 | base | [PNG](../capturas-base/PassportCard--long-content--dark--390--base.png) | [JSON](../resultados-base/PassportCard--long-content--dark--390--base.json) |
| long-content | light | 390 | base | [PNG](../capturas-base/PassportCard--long-content--light--390--base.png) | [JSON](../resultados-base/PassportCard--long-content--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-PassportCard--dark--active.png), [reporte](../resultados-base/estado-PassportCard--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-PassportCard--dark--focus-visible.png), [reporte](../resultados-base/estado-PassportCard--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-PassportCard--dark--focus.png), [reporte](../resultados-base/estado-PassportCard--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-PassportCard--dark--hover.png), [reporte](../resultados-base/estado-PassportCard--dark--hover.json).

- light · active: [captura](../capturas-base/estado-PassportCard--light--active.png), [reporte](../resultados-base/estado-PassportCard--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-PassportCard--light--focus-visible.png), [reporte](../resultados-base/estado-PassportCard--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-PassportCard--light--focus.png), [reporte](../resultados-base/estado-PassportCard--light--focus.json).

- light · hover: [captura](../capturas-base/estado-PassportCard--light--hover.png), [reporte](../resultados-base/estado-PassportCard--light--hover.json).
