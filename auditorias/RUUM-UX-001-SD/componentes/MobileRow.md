# MobileRow

## Propósito

Presentar una fila estática, botón o enlace.

## Props y contrato

Fuente: [packages/ui/src/components/MobileRow.tsx:57](../../../packages/ui/src/components/MobileRow.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function MobileRow({
  titulo,
  subtitulo,
  icono,
  tonoIcono = "base",
  href,
  enlaceComponente,
  linkComponent,
  onClick,
  disabled = false,
  badge,
  derecha,
  mostrarChevron,
  destructivo = false,
  conDivisor = true,
  className = "",
}: MobileRowProps) 

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
import { MobileRow } from "@ruum/ui";
<MobileRow titulo="Preferencias" href="/cuenta/preferencias" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<MobileRow titulo="Preferencias" href="/cuenta" disabled />
```

## Accesibilidad y limitaciones

disabled no bloquea la rama de enlace; requiere corrección base.

No se pasan className/style para corregir el componente base.

## Estados

default, destructivo, disabled, disabled-link, link.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-007](../remediaciones/SD-REM-007.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/MobileRow--default--dark--1440--responsive.png) | [JSON](../resultados-base/MobileRow--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileRow--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileRow--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/MobileRow--default--dark--320--responsive.png) | [JSON](../resultados-base/MobileRow--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/MobileRow--default--dark--390--base.png) | [JSON](../resultados-base/MobileRow--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/MobileRow--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/MobileRow--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/MobileRow--default--dark--768--responsive.png) | [JSON](../resultados-base/MobileRow--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/MobileRow--default--light--1440--responsive.png) | [JSON](../resultados-base/MobileRow--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileRow--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileRow--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/MobileRow--default--light--320--responsive.png) | [JSON](../resultados-base/MobileRow--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/MobileRow--default--light--390--base.png) | [JSON](../resultados-base/MobileRow--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/MobileRow--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/MobileRow--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/MobileRow--default--light--768--responsive.png) | [JSON](../resultados-base/MobileRow--default--light--768--responsive.json) |
| destructivo | dark | 390 | base | [PNG](../capturas-base/MobileRow--destructivo--dark--390--base.png) | [JSON](../resultados-base/MobileRow--destructivo--dark--390--base.json) |
| destructivo | light | 390 | base | [PNG](../capturas-base/MobileRow--destructivo--light--390--base.png) | [JSON](../resultados-base/MobileRow--destructivo--light--390--base.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/MobileRow--disabled--dark--390--base.png) | [JSON](../resultados-base/MobileRow--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/MobileRow--disabled--light--390--base.png) | [JSON](../resultados-base/MobileRow--disabled--light--390--base.json) |
| disabled-link | dark | 390 | base | [PNG](../capturas-base/MobileRow--disabled-link--dark--390--base.png) | [JSON](../resultados-base/MobileRow--disabled-link--dark--390--base.json) |
| disabled-link | light | 390 | base | [PNG](../capturas-base/MobileRow--disabled-link--light--390--base.png) | [JSON](../resultados-base/MobileRow--disabled-link--light--390--base.json) |
| link | dark | 390 | base | [PNG](../capturas-base/MobileRow--link--dark--390--base.png) | [JSON](../resultados-base/MobileRow--link--dark--390--base.json) |
| link | light | 390 | base | [PNG](../capturas-base/MobileRow--link--light--390--base.png) | [JSON](../resultados-base/MobileRow--link--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-MobileRow--dark--active.png), [reporte](../resultados-base/estado-MobileRow--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-MobileRow--dark--focus-visible.png), [reporte](../resultados-base/estado-MobileRow--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-MobileRow--dark--focus.png), [reporte](../resultados-base/estado-MobileRow--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-MobileRow--dark--hover.png), [reporte](../resultados-base/estado-MobileRow--dark--hover.json).

- light · active: [captura](../capturas-base/estado-MobileRow--light--active.png), [reporte](../resultados-base/estado-MobileRow--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-MobileRow--light--focus-visible.png), [reporte](../resultados-base/estado-MobileRow--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-MobileRow--light--focus.png), [reporte](../resultados-base/estado-MobileRow--light--focus.json).

- light · hover: [captura](../capturas-base/estado-MobileRow--light--hover.png), [reporte](../resultados-base/estado-MobileRow--light--hover.json).
