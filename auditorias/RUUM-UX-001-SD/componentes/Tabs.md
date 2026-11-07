# Tabs

## Propósito

Seleccionar una pestaña o filtro.

## Props y contrato

Fuente: [packages/ui/src/components/Navigation.tsx:66](../../../packages/ui/src/components/Navigation.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Tabs({ tabs, onSeleccion, className = "" }: { tabs: TabItem[]; onSeleccion?: (id: string) => void; className?: string }) 

export interface NavItem {
  id: string;
  etiqueta: string;
  href: string;
  activo?: boolean;
  icono: ReactNode;
}

export interface TabItem {
  id: string;
  etiqueta: string;
  conteo?: number;
  activo?: boolean;
}

export interface SidebarGrupo {
  titulo: string;
  items: { id: string; etiqueta: string; href: string; activo?: boolean; contador?: number }[];
}
```

## Uso correcto de API

```tsx
import { Tabs } from "@ruum/ui";
<Tabs tabs={pestanas} onSeleccion={seleccionar} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Tabs tabs={pestanas} />
```

## Accesibilidad y limitaciones

Patrón tab incompleto: revisar flechas, tabindex y relación con paneles o cambiar semántica.

No se pasan className/style para corregir el componente base.

## Estados

default.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-005](../remediaciones/SD-REM-005.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: color-contrast.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/Tabs--default--dark--1440--responsive.png) | [JSON](../resultados-base/Tabs--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Tabs--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Tabs--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Tabs--default--dark--320--responsive.png) | [JSON](../resultados-base/Tabs--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Tabs--default--dark--390--base.png) | [JSON](../resultados-base/Tabs--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Tabs--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Tabs--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Tabs--default--dark--768--responsive.png) | [JSON](../resultados-base/Tabs--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Tabs--default--light--1440--responsive.png) | [JSON](../resultados-base/Tabs--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Tabs--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Tabs--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Tabs--default--light--320--responsive.png) | [JSON](../resultados-base/Tabs--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Tabs--default--light--390--base.png) | [JSON](../resultados-base/Tabs--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Tabs--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Tabs--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Tabs--default--light--768--responsive.png) | [JSON](../resultados-base/Tabs--default--light--768--responsive.json) |

- dark · active: [captura](../capturas-base/estado-Tabs--dark--active.png), [reporte](../resultados-base/estado-Tabs--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Tabs--dark--focus-visible.png), [reporte](../resultados-base/estado-Tabs--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Tabs--dark--focus.png), [reporte](../resultados-base/estado-Tabs--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Tabs--dark--hover.png), [reporte](../resultados-base/estado-Tabs--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Tabs--light--active.png), [reporte](../resultados-base/estado-Tabs--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Tabs--light--focus-visible.png), [reporte](../resultados-base/estado-Tabs--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Tabs--light--focus.png), [reporte](../resultados-base/estado-Tabs--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Tabs--light--hover.png), [reporte](../resultados-base/estado-Tabs--light--hover.json).
