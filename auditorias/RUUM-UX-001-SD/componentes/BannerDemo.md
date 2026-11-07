# BannerDemo

## Propósito

Avisar que se muestran datos de ejemplo.

## Props y contrato

Fuente: [packages/ui/src/components/BannerDemo.tsx:5](../../../packages/ui/src/components/BannerDemo.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function BannerDemo({ hrefLogin = "/login" }: BannerDemoProps) 

export interface BannerDemoProps {
  hrefLogin?: string;
}
```

## Uso correcto de API

```tsx
import { BannerDemo } from "@ruum/ui";
<BannerDemo hrefLogin="/login" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<BannerDemo hrefLogin="#" />
```

## Accesibilidad y limitaciones

Validar contraste de route-action sobre route-soft.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/BannerDemo--default--dark--1440--responsive.png) | [JSON](../resultados-base/BannerDemo--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/BannerDemo--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/BannerDemo--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/BannerDemo--default--dark--320--responsive.png) | [JSON](../resultados-base/BannerDemo--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/BannerDemo--default--dark--390--base.png) | [JSON](../resultados-base/BannerDemo--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/BannerDemo--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/BannerDemo--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/BannerDemo--default--dark--768--responsive.png) | [JSON](../resultados-base/BannerDemo--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/BannerDemo--default--light--1440--responsive.png) | [JSON](../resultados-base/BannerDemo--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/BannerDemo--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/BannerDemo--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/BannerDemo--default--light--320--responsive.png) | [JSON](../resultados-base/BannerDemo--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/BannerDemo--default--light--390--base.png) | [JSON](../resultados-base/BannerDemo--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/BannerDemo--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/BannerDemo--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/BannerDemo--default--light--768--responsive.png) | [JSON](../resultados-base/BannerDemo--default--light--768--responsive.json) |

- dark · active: [captura](../capturas-base/estado-BannerDemo--dark--active.png), [reporte](../resultados-base/estado-BannerDemo--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-BannerDemo--dark--focus-visible.png), [reporte](../resultados-base/estado-BannerDemo--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-BannerDemo--dark--focus.png), [reporte](../resultados-base/estado-BannerDemo--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-BannerDemo--dark--hover.png), [reporte](../resultados-base/estado-BannerDemo--dark--hover.json).

- light · active: [captura](../capturas-base/estado-BannerDemo--light--active.png), [reporte](../resultados-base/estado-BannerDemo--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-BannerDemo--light--focus-visible.png), [reporte](../resultados-base/estado-BannerDemo--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-BannerDemo--light--focus.png), [reporte](../resultados-base/estado-BannerDemo--light--focus.json).

- light · hover: [captura](../capturas-base/estado-BannerDemo--light--hover.png), [reporte](../resultados-base/estado-BannerDemo--light--hover.json).
