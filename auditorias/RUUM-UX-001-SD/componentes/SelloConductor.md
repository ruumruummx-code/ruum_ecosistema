# SelloConductor

## Propósito

Mostrar certificación vigente con sello oficial.

## Props y contrato

Fuente: [packages/ui/src/components/SelloConductor.tsx:31](../../../packages/ui/src/components/SelloConductor.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function SelloConductor({
  tema = "certificado",
  tamano = "md",
  compacto = false,
  lema = "",
  className = "",
}: SelloConductorProps) 

export type SelloTema = "certificado" | "oscuro" | "claro" | "dorado";

export type SelloTamano = "sm" | "md" | "lg";

export interface SelloConductorProps {
  /**
   * Tema visual (Libro de marca 05-sello-conductor-certificado.png):
   * "certificado" = anillo navy + símbolo RR + swoosh teal sobre claro (vigente).
   * "oscuro" = anillo blanco sobre navy. "claro" = alias de certificado.
   * "dorado" solo compatibilidad (no usar en piezas nuevas: amarillo es semántico).
   */
  tema?: SelloTema;
  tamano?: SelloTamano | number;
  compacto?: boolean;
  lema?: string;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { SelloConductor } from "@ruum/ui";
<SelloConductor lema="Certificación vigente" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<SelloConductor tema="dorado" />
```

## Accesibilidad y limitaciones

No usar sello con certificación vencida; dorado solo compatibilidad.

No se pasan className/style para corregir el componente base.

## Estados

compacto, default.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: conforme con condiciones.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-012](../remediaciones/SD-REM-012.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: color-contrast.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| compacto | dark | 390 | base | [PNG](../capturas-base/SelloConductor--compacto--dark--390--base.png) | [JSON](../resultados-base/SelloConductor--compacto--dark--390--base.json) |
| compacto | light | 390 | base | [PNG](../capturas-base/SelloConductor--compacto--light--390--base.png) | [JSON](../resultados-base/SelloConductor--compacto--light--390--base.json) |
| default | dark | 1440 | responsive | [PNG](../capturas-base/SelloConductor--default--dark--1440--responsive.png) | [JSON](../resultados-base/SelloConductor--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/SelloConductor--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/SelloConductor--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/SelloConductor--default--dark--320--responsive.png) | [JSON](../resultados-base/SelloConductor--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/SelloConductor--default--dark--390--base.png) | [JSON](../resultados-base/SelloConductor--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/SelloConductor--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/SelloConductor--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/SelloConductor--default--dark--768--responsive.png) | [JSON](../resultados-base/SelloConductor--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/SelloConductor--default--light--1440--responsive.png) | [JSON](../resultados-base/SelloConductor--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/SelloConductor--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/SelloConductor--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/SelloConductor--default--light--320--responsive.png) | [JSON](../resultados-base/SelloConductor--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/SelloConductor--default--light--390--base.png) | [JSON](../resultados-base/SelloConductor--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/SelloConductor--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/SelloConductor--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/SelloConductor--default--light--768--responsive.png) | [JSON](../resultados-base/SelloConductor--default--light--768--responsive.json) |
