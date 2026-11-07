# EmptyState

## Propósito

Explicar ausencia de datos y siguiente expectativa.

## Props y contrato

Fuente: [packages/ui/src/components/EmptyState.tsx:4](../../../packages/ui/src/components/EmptyState.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function EmptyState({
  titulo,
  descripcion,
  children,
  className = "",
}: {
  titulo: string;
  descripcion: string;
  children?: ReactNode;
  className?: string;
}) 


```

## Uso correcto de API

```tsx
import { EmptyState } from "@ruum/ui";
<EmptyState titulo="Sin traslados" descripcion="Aquí aparecerán tus viajes." />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<EmptyState titulo="" descripcion="" />
```

## Accesibilidad y limitaciones

El h3 fijo depende de jerarquía del consumidor.

No se pasan className/style para corregir el componente base.

## Estados

default.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: conforme con condiciones.** Axe con infracciones: heading-order.

Acciones: [SD-REM-012](../remediaciones/SD-REM-012.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Resolver o justificar jerarquía de títulos en el consumidor.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/EmptyState--default--dark--1440--responsive.png) | [JSON](../resultados-base/EmptyState--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/EmptyState--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/EmptyState--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/EmptyState--default--dark--320--responsive.png) | [JSON](../resultados-base/EmptyState--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/EmptyState--default--dark--390--base.png) | [JSON](../resultados-base/EmptyState--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/EmptyState--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/EmptyState--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/EmptyState--default--dark--768--responsive.png) | [JSON](../resultados-base/EmptyState--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/EmptyState--default--light--1440--responsive.png) | [JSON](../resultados-base/EmptyState--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/EmptyState--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/EmptyState--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/EmptyState--default--light--320--responsive.png) | [JSON](../resultados-base/EmptyState--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/EmptyState--default--light--390--base.png) | [JSON](../resultados-base/EmptyState--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/EmptyState--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/EmptyState--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/EmptyState--default--light--768--responsive.png) | [JSON](../resultados-base/EmptyState--default--light--768--responsive.json) |
