# MobileShell

## Propósito

Proveer viewport móvil y área de contenido desplazable.

## Props y contrato

Fuente: [packages/ui/src/components/MobileShell.tsx:30](../../../packages/ui/src/components/MobileShell.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function MobileShell({
  children,
  variant = "compact",
  padding = "md",
  conFondoCanvas = true,
  navInferiorVisible = false,
  as: Component = "div",
  className = "",
  contentClassName = "",
  style,
}: MobileShellProps) 

export type MobileShellVariant = "compact" | "wide";

export type MobileShellPadding = "none" | "sm" | "md" | "lg";

export interface MobileShellProps {
  children: ReactNode;
  variant?: MobileShellVariant;
  padding?: MobileShellPadding;
  conFondoCanvas?: boolean;
  navInferiorVisible?: boolean;
  as?: ElementType;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
}
```

## Uso correcto de API

```tsx
import { MobileShell } from "@ruum/ui";
<MobileShell navInferiorVisible><h1>Cuenta</h1></MobileShell>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<MobileShell><main><main>Contenido</main></main></MobileShell>
```

## Accesibilidad y limitaciones

Scroll interno y alturas dvh requieren prueba en navegador móvil físico.

No se pasan className/style para corregir el componente base.

## Estados

default.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/MobileShell--default--dark--1440--responsive.png) | [JSON](../resultados-base/MobileShell--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileShell--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileShell--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/MobileShell--default--dark--320--responsive.png) | [JSON](../resultados-base/MobileShell--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/MobileShell--default--dark--390--base.png) | [JSON](../resultados-base/MobileShell--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/MobileShell--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/MobileShell--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/MobileShell--default--dark--768--responsive.png) | [JSON](../resultados-base/MobileShell--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/MobileShell--default--light--1440--responsive.png) | [JSON](../resultados-base/MobileShell--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileShell--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileShell--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/MobileShell--default--light--320--responsive.png) | [JSON](../resultados-base/MobileShell--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/MobileShell--default--light--390--base.png) | [JSON](../resultados-base/MobileShell--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/MobileShell--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/MobileShell--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/MobileShell--default--light--768--responsive.png) | [JSON](../resultados-base/MobileShell--default--light--768--responsive.json) |

- dark · active: [captura](../capturas-base/estado-MobileShell--dark--active.png), [reporte](../resultados-base/estado-MobileShell--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-MobileShell--dark--focus-visible.png), [reporte](../resultados-base/estado-MobileShell--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-MobileShell--dark--focus.png), [reporte](../resultados-base/estado-MobileShell--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-MobileShell--dark--hover.png), [reporte](../resultados-base/estado-MobileShell--dark--hover.json).

- light · active: [captura](../capturas-base/estado-MobileShell--light--active.png), [reporte](../resultados-base/estado-MobileShell--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-MobileShell--light--focus-visible.png), [reporte](../resultados-base/estado-MobileShell--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-MobileShell--light--focus.png), [reporte](../resultados-base/estado-MobileShell--light--focus.json).

- light · hover: [captura](../capturas-base/estado-MobileShell--light--hover.png), [reporte](../resultados-base/estado-MobileShell--light--hover.json).
