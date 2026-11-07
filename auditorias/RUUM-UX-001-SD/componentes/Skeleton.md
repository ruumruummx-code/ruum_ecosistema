# Skeleton

## Propósito

Mostrar estado de carga sin contenido ficticio.

## Props y contrato

Fuente: [packages/ui/src/components/EmptyState.tsx:30](../../../packages/ui/src/components/EmptyState.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Skeleton({ tipo = "text", className = "" }: { tipo?: "text" | "card" | "list"; className?: string }) 


```

## Uso correcto de API

```tsx
import { Skeleton } from "@ruum/ui";
<Skeleton tipo="card" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Skeleton tipo="card" aria-hidden />
```

## Accesibilidad y limitaciones

Expone status Cargando; no indica progreso real.

No se pasan className/style para corregir el componente base.

## Estados

card, list, text.

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
| card | dark | 390 | base | [PNG](../capturas-base/Skeleton--card--dark--390--base.png) | [JSON](../resultados-base/Skeleton--card--dark--390--base.json) |
| card | light | 390 | base | [PNG](../capturas-base/Skeleton--card--light--390--base.png) | [JSON](../resultados-base/Skeleton--card--light--390--base.json) |
| list | dark | 390 | base | [PNG](../capturas-base/Skeleton--list--dark--390--base.png) | [JSON](../resultados-base/Skeleton--list--dark--390--base.json) |
| list | light | 390 | base | [PNG](../capturas-base/Skeleton--list--light--390--base.png) | [JSON](../resultados-base/Skeleton--list--light--390--base.json) |
| text | dark | 1440 | responsive | [PNG](../capturas-base/Skeleton--text--dark--1440--responsive.png) | [JSON](../resultados-base/Skeleton--text--dark--1440--responsive.json) |
| text | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Skeleton--text--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Skeleton--text--dark--1440--zoom-css-200.json) |
| text | dark | 320 | responsive | [PNG](../capturas-base/Skeleton--text--dark--320--responsive.png) | [JSON](../resultados-base/Skeleton--text--dark--320--responsive.json) |
| text | dark | 390 | base | [PNG](../capturas-base/Skeleton--text--dark--390--base.png) | [JSON](../resultados-base/Skeleton--text--dark--390--base.json) |
| text | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Skeleton--text--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Skeleton--text--dark--390--zoom-css-200.json) |
| text | dark | 768 | responsive | [PNG](../capturas-base/Skeleton--text--dark--768--responsive.png) | [JSON](../resultados-base/Skeleton--text--dark--768--responsive.json) |
| text | light | 1440 | responsive | [PNG](../capturas-base/Skeleton--text--light--1440--responsive.png) | [JSON](../resultados-base/Skeleton--text--light--1440--responsive.json) |
| text | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Skeleton--text--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Skeleton--text--light--1440--zoom-css-200.json) |
| text | light | 320 | responsive | [PNG](../capturas-base/Skeleton--text--light--320--responsive.png) | [JSON](../resultados-base/Skeleton--text--light--320--responsive.json) |
| text | light | 390 | base | [PNG](../capturas-base/Skeleton--text--light--390--base.png) | [JSON](../resultados-base/Skeleton--text--light--390--base.json) |
| text | light | 390 | zoom-css-200 | [PNG](../capturas-base/Skeleton--text--light--390--zoom-css-200.png) | [JSON](../resultados-base/Skeleton--text--light--390--zoom-css-200.json) |
| text | light | 768 | responsive | [PNG](../capturas-base/Skeleton--text--light--768--responsive.png) | [JSON](../resultados-base/Skeleton--text--light--768--responsive.json) |
