# MobileListGroup

## Propósito

Agrupar filas y opcionalmente navegar.

## Props y contrato

Fuente: [packages/ui/src/components/MobileRow.tsx:167](../../../packages/ui/src/components/MobileRow.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function MobileListGroup({
  children,
  tituloSeccion,
  ariaLabel,
  as = "div",
  className = "",
}: MobileListGroupProps) 

export type MobileRowTonoIcono =
  | "base"
  | "verde"
  | "azul"
  | "ambar"
  | "rojo"
  | "morado"
  | "neutro";

export interface MobileRowProps {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  icono?: ReactNode;
  tonoIcono?: MobileRowTonoIcono;
  href?: string;
  enlaceComponente?: React.ComponentType<any>;
  linkComponent?: React.ComponentType<any>;
  onClick?: () => void;
  disabled?: boolean;
  badge?: ReactNode;
  derecha?: ReactNode;
  mostrarChevron?: boolean;
  destructivo?: boolean;
  conDivisor?: boolean;
  className?: string;
}

export interface MobileListGroupProps {
  children?: ReactNode;
  tituloSeccion?: string;
  ariaLabel?: string;
  as?: "div" | "nav";
  className?: string;
}
```

## Uso correcto de API

```tsx
import { MobileListGroup } from "@ruum/ui";
<MobileListGroup as="nav" tituloSeccion="Cuenta"><MobileRow titulo="Soporte" href="/soporte" /></MobileListGroup>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<MobileListGroup as="nav" />
```

## Accesibilidad y limitaciones

Aportar ariaLabel o tituloSeccion para nombrar navegación.

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
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/MobileListGroup--default--dark--1440--responsive.png) | [JSON](../resultados-base/MobileListGroup--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileListGroup--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileListGroup--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/MobileListGroup--default--dark--320--responsive.png) | [JSON](../resultados-base/MobileListGroup--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/MobileListGroup--default--dark--390--base.png) | [JSON](../resultados-base/MobileListGroup--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/MobileListGroup--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/MobileListGroup--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/MobileListGroup--default--dark--768--responsive.png) | [JSON](../resultados-base/MobileListGroup--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/MobileListGroup--default--light--1440--responsive.png) | [JSON](../resultados-base/MobileListGroup--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileListGroup--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileListGroup--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/MobileListGroup--default--light--320--responsive.png) | [JSON](../resultados-base/MobileListGroup--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/MobileListGroup--default--light--390--base.png) | [JSON](../resultados-base/MobileListGroup--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/MobileListGroup--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/MobileListGroup--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/MobileListGroup--default--light--768--responsive.png) | [JSON](../resultados-base/MobileListGroup--default--light--768--responsive.json) |

- dark · active: [captura](../capturas-base/estado-MobileListGroup--dark--active.png), [reporte](../resultados-base/estado-MobileListGroup--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-MobileListGroup--dark--focus-visible.png), [reporte](../resultados-base/estado-MobileListGroup--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-MobileListGroup--dark--focus.png), [reporte](../resultados-base/estado-MobileListGroup--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-MobileListGroup--dark--hover.png), [reporte](../resultados-base/estado-MobileListGroup--dark--hover.json).

- light · active: [captura](../capturas-base/estado-MobileListGroup--light--active.png), [reporte](../resultados-base/estado-MobileListGroup--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-MobileListGroup--light--focus-visible.png), [reporte](../resultados-base/estado-MobileListGroup--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-MobileListGroup--light--focus.png), [reporte](../resultados-base/estado-MobileListGroup--light--focus.json).

- light · hover: [captura](../capturas-base/estado-MobileListGroup--light--hover.png), [reporte](../resultados-base/estado-MobileListGroup--light--hover.json).
