# Avatar

## Propósito

Representar visualmente una identidad con nombre accesible.

## Props y contrato

Fuente: [packages/ui/src/components/Navigation.tsx:107](../../../packages/ui/src/components/Navigation.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Avatar({
  nombre,
  src,
  forma = "circle",
  conEstado,
  tamano = 40,
  className = "",
}: {
  nombre: string;
  src?: string;
  forma?: "circle" | "rounded";
  conEstado?: "activo" | "inactivo";
  tamano?: number;
  className?: string;
}) 

export interface NavItem {
  id: string;
  etiqueta: string;
  href: string;
  activo?: boolean;
  icono: ReactNode;
}

export interface SidebarGrupo {
  titulo: string;
  items: { id: string; etiqueta: string; href: string; activo?: boolean; contador?: number }[];
}
```

## Uso correcto de API

```tsx
import { Avatar } from "@ruum/ui";
<Avatar nombre="María González" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Avatar nombre="" />
```

## Accesibilidad y limitaciones

El estado del punto es decorativo; no usarlo como única información de disponibilidad.

No se pasan className/style para corregir el componente base.

## Estados

default, rounded.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: conforme con condiciones.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-012](../remediaciones/SD-REM-012.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/Avatar--default--dark--1440--responsive.png) | [JSON](../resultados-base/Avatar--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Avatar--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Avatar--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Avatar--default--dark--320--responsive.png) | [JSON](../resultados-base/Avatar--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Avatar--default--dark--390--base.png) | [JSON](../resultados-base/Avatar--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Avatar--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Avatar--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Avatar--default--dark--768--responsive.png) | [JSON](../resultados-base/Avatar--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Avatar--default--light--1440--responsive.png) | [JSON](../resultados-base/Avatar--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Avatar--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Avatar--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Avatar--default--light--320--responsive.png) | [JSON](../resultados-base/Avatar--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Avatar--default--light--390--base.png) | [JSON](../resultados-base/Avatar--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Avatar--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Avatar--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Avatar--default--light--768--responsive.png) | [JSON](../resultados-base/Avatar--default--light--768--responsive.json) |
| rounded | dark | 390 | base | [PNG](../capturas-base/Avatar--rounded--dark--390--base.png) | [JSON](../resultados-base/Avatar--rounded--dark--390--base.json) |
| rounded | light | 390 | base | [PNG](../capturas-base/Avatar--rounded--light--390--base.png) | [JSON](../resultados-base/Avatar--rounded--light--390--base.json) |
