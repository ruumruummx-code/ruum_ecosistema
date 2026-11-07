# Sidebar

## Propósito

Navegar por grupos y contadores.

## Props y contrato

Fuente: [packages/ui/src/components/Navigation.tsx:99](../../../packages/ui/src/components/Navigation.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Sidebar({ grupos, className = "" }: { grupos: SidebarGrupo[]; className?: string }) 

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
import { Sidebar } from "@ruum/ui";
<Sidebar grupos={gruposDeCuenta} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Sidebar grupos={[{titulo:'',items:[]}]} />
```

## Accesibilidad y limitaciones

Etiquetas, href y estado activo requieren datos del consumidor.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/Sidebar--default--dark--1440--responsive.png) | [JSON](../resultados-base/Sidebar--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Sidebar--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Sidebar--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Sidebar--default--dark--320--responsive.png) | [JSON](../resultados-base/Sidebar--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Sidebar--default--dark--390--base.png) | [JSON](../resultados-base/Sidebar--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Sidebar--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Sidebar--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Sidebar--default--dark--768--responsive.png) | [JSON](../resultados-base/Sidebar--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Sidebar--default--light--1440--responsive.png) | [JSON](../resultados-base/Sidebar--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Sidebar--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Sidebar--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Sidebar--default--light--320--responsive.png) | [JSON](../resultados-base/Sidebar--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Sidebar--default--light--390--base.png) | [JSON](../resultados-base/Sidebar--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Sidebar--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Sidebar--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Sidebar--default--light--768--responsive.png) | [JSON](../resultados-base/Sidebar--default--light--768--responsive.json) |

- dark · active: [captura](../capturas-base/estado-Sidebar--dark--active.png), [reporte](../resultados-base/estado-Sidebar--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Sidebar--dark--focus-visible.png), [reporte](../resultados-base/estado-Sidebar--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Sidebar--dark--focus.png), [reporte](../resultados-base/estado-Sidebar--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Sidebar--dark--hover.png), [reporte](../resultados-base/estado-Sidebar--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Sidebar--light--active.png), [reporte](../resultados-base/estado-Sidebar--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Sidebar--light--focus-visible.png), [reporte](../resultados-base/estado-Sidebar--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Sidebar--light--focus.png), [reporte](../resultados-base/estado-Sidebar--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Sidebar--light--hover.png), [reporte](../resultados-base/estado-Sidebar--light--hover.json).
