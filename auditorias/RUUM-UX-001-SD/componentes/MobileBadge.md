# MobileBadge

## Propósito

Presentar una etiqueta semántica móvil.

## Props y contrato

Fuente: [packages/ui/src/components/MobileBadge.tsx:59](../../../packages/ui/src/components/MobileBadge.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function MobileBadge({
  variante,
  texto,
  punto = false,
  icono,
  size = "md",
  className = "",
}: MobileBadgeProps) 

export type MobileBadgeVariante = "exito" | "en_ruta" | "pendiente" | "error" | "neutro";

export type MobileBadgeTamano = "sm" | "md";

export interface MobileBadgeProps {
  variante: MobileBadgeVariante;
  texto: string;
  punto?: boolean;
  icono?: ReactNode;
  size?: MobileBadgeTamano;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { MobileBadge } from "@ruum/ui";
<MobileBadge variante="exito" texto="Verificado" punto />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<MobileBadge variante="exito" texto="" punto />
```

## Accesibilidad y limitaciones

El punto es decorativo; texto debe expresar el significado.

No se pasan className/style para corregir el componente base.

## Estados

en_ruta, error, exito, neutro, pendiente.

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
| en_ruta | dark | 390 | base | [PNG](../capturas-base/MobileBadge--en_ruta--dark--390--base.png) | [JSON](../resultados-base/MobileBadge--en_ruta--dark--390--base.json) |
| en_ruta | light | 390 | base | [PNG](../capturas-base/MobileBadge--en_ruta--light--390--base.png) | [JSON](../resultados-base/MobileBadge--en_ruta--light--390--base.json) |
| error | dark | 390 | base | [PNG](../capturas-base/MobileBadge--error--dark--390--base.png) | [JSON](../resultados-base/MobileBadge--error--dark--390--base.json) |
| error | light | 390 | base | [PNG](../capturas-base/MobileBadge--error--light--390--base.png) | [JSON](../resultados-base/MobileBadge--error--light--390--base.json) |
| exito | dark | 1440 | responsive | [PNG](../capturas-base/MobileBadge--exito--dark--1440--responsive.png) | [JSON](../resultados-base/MobileBadge--exito--dark--1440--responsive.json) |
| exito | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileBadge--exito--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileBadge--exito--dark--1440--zoom-css-200.json) |
| exito | dark | 320 | responsive | [PNG](../capturas-base/MobileBadge--exito--dark--320--responsive.png) | [JSON](../resultados-base/MobileBadge--exito--dark--320--responsive.json) |
| exito | dark | 390 | base | [PNG](../capturas-base/MobileBadge--exito--dark--390--base.png) | [JSON](../resultados-base/MobileBadge--exito--dark--390--base.json) |
| exito | dark | 390 | zoom-css-200 | [PNG](../capturas-base/MobileBadge--exito--dark--390--zoom-css-200.png) | [JSON](../resultados-base/MobileBadge--exito--dark--390--zoom-css-200.json) |
| exito | dark | 768 | responsive | [PNG](../capturas-base/MobileBadge--exito--dark--768--responsive.png) | [JSON](../resultados-base/MobileBadge--exito--dark--768--responsive.json) |
| exito | light | 1440 | responsive | [PNG](../capturas-base/MobileBadge--exito--light--1440--responsive.png) | [JSON](../resultados-base/MobileBadge--exito--light--1440--responsive.json) |
| exito | light | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileBadge--exito--light--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileBadge--exito--light--1440--zoom-css-200.json) |
| exito | light | 320 | responsive | [PNG](../capturas-base/MobileBadge--exito--light--320--responsive.png) | [JSON](../resultados-base/MobileBadge--exito--light--320--responsive.json) |
| exito | light | 390 | base | [PNG](../capturas-base/MobileBadge--exito--light--390--base.png) | [JSON](../resultados-base/MobileBadge--exito--light--390--base.json) |
| exito | light | 390 | zoom-css-200 | [PNG](../capturas-base/MobileBadge--exito--light--390--zoom-css-200.png) | [JSON](../resultados-base/MobileBadge--exito--light--390--zoom-css-200.json) |
| exito | light | 768 | responsive | [PNG](../capturas-base/MobileBadge--exito--light--768--responsive.png) | [JSON](../resultados-base/MobileBadge--exito--light--768--responsive.json) |
| neutro | dark | 390 | base | [PNG](../capturas-base/MobileBadge--neutro--dark--390--base.png) | [JSON](../resultados-base/MobileBadge--neutro--dark--390--base.json) |
| neutro | light | 390 | base | [PNG](../capturas-base/MobileBadge--neutro--light--390--base.png) | [JSON](../resultados-base/MobileBadge--neutro--light--390--base.json) |
| pendiente | dark | 390 | base | [PNG](../capturas-base/MobileBadge--pendiente--dark--390--base.png) | [JSON](../resultados-base/MobileBadge--pendiente--dark--390--base.json) |
| pendiente | light | 390 | base | [PNG](../capturas-base/MobileBadge--pendiente--light--390--base.png) | [JSON](../resultados-base/MobileBadge--pendiente--light--390--base.json) |
