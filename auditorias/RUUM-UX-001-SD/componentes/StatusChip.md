# StatusChip

## Propósito

Representar un estado operativo con icono y texto.

## Props y contrato

Fuente: [packages/ui/src/components/StatusChip.tsx:64](../../../packages/ui/src/components/StatusChip.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function StatusChip({ estado, className = "" }: StatusChipProps) 

export type TonoChip = "neutro" | "accion" | "pendiente" | "exito" | "error" | "emergencia";

interface MetaChip {
  etiqueta: string;
  tono: TonoChip;
  icono: ReactNode;
}

export interface StatusChipProps {
  estado: EstadoVisualTraslado;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { StatusChip } from "@ruum/ui";
<StatusChip estado="en-ruta" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<StatusChip estado="desconocido" />
```

## Accesibilidad y limitaciones

Usar enum del contrato; status puede anunciar cambios.

No se pasan className/style para corregir el componente base.

## Estados

cancelado, cerrado, conductor-asignado, cotizacion-confirmada, en-ruta, entrega-confirmada, evidencia-inicial-completa, evidencia-pendiente, incidente-abierto, pago-detenido, pendiente-conductor, solicitado.

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
| cancelado | dark | 390 | base | [PNG](../capturas-base/StatusChip--cancelado--dark--390--base.png) | [JSON](../resultados-base/StatusChip--cancelado--dark--390--base.json) |
| cancelado | light | 390 | base | [PNG](../capturas-base/StatusChip--cancelado--light--390--base.png) | [JSON](../resultados-base/StatusChip--cancelado--light--390--base.json) |
| cerrado | dark | 390 | base | [PNG](../capturas-base/StatusChip--cerrado--dark--390--base.png) | [JSON](../resultados-base/StatusChip--cerrado--dark--390--base.json) |
| cerrado | light | 390 | base | [PNG](../capturas-base/StatusChip--cerrado--light--390--base.png) | [JSON](../resultados-base/StatusChip--cerrado--light--390--base.json) |
| conductor-asignado | dark | 390 | base | [PNG](../capturas-base/StatusChip--conductor-asignado--dark--390--base.png) | [JSON](../resultados-base/StatusChip--conductor-asignado--dark--390--base.json) |
| conductor-asignado | light | 390 | base | [PNG](../capturas-base/StatusChip--conductor-asignado--light--390--base.png) | [JSON](../resultados-base/StatusChip--conductor-asignado--light--390--base.json) |
| cotizacion-confirmada | dark | 390 | base | [PNG](../capturas-base/StatusChip--cotizacion-confirmada--dark--390--base.png) | [JSON](../resultados-base/StatusChip--cotizacion-confirmada--dark--390--base.json) |
| cotizacion-confirmada | light | 390 | base | [PNG](../capturas-base/StatusChip--cotizacion-confirmada--light--390--base.png) | [JSON](../resultados-base/StatusChip--cotizacion-confirmada--light--390--base.json) |
| en-ruta | dark | 390 | base | [PNG](../capturas-base/StatusChip--en-ruta--dark--390--base.png) | [JSON](../resultados-base/StatusChip--en-ruta--dark--390--base.json) |
| en-ruta | light | 390 | base | [PNG](../capturas-base/StatusChip--en-ruta--light--390--base.png) | [JSON](../resultados-base/StatusChip--en-ruta--light--390--base.json) |
| entrega-confirmada | dark | 390 | base | [PNG](../capturas-base/StatusChip--entrega-confirmada--dark--390--base.png) | [JSON](../resultados-base/StatusChip--entrega-confirmada--dark--390--base.json) |
| entrega-confirmada | light | 390 | base | [PNG](../capturas-base/StatusChip--entrega-confirmada--light--390--base.png) | [JSON](../resultados-base/StatusChip--entrega-confirmada--light--390--base.json) |
| evidencia-inicial-completa | dark | 390 | base | [PNG](../capturas-base/StatusChip--evidencia-inicial-completa--dark--390--base.png) | [JSON](../resultados-base/StatusChip--evidencia-inicial-completa--dark--390--base.json) |
| evidencia-inicial-completa | light | 390 | base | [PNG](../capturas-base/StatusChip--evidencia-inicial-completa--light--390--base.png) | [JSON](../resultados-base/StatusChip--evidencia-inicial-completa--light--390--base.json) |
| evidencia-pendiente | dark | 390 | base | [PNG](../capturas-base/StatusChip--evidencia-pendiente--dark--390--base.png) | [JSON](../resultados-base/StatusChip--evidencia-pendiente--dark--390--base.json) |
| evidencia-pendiente | light | 390 | base | [PNG](../capturas-base/StatusChip--evidencia-pendiente--light--390--base.png) | [JSON](../resultados-base/StatusChip--evidencia-pendiente--light--390--base.json) |
| incidente-abierto | dark | 390 | base | [PNG](../capturas-base/StatusChip--incidente-abierto--dark--390--base.png) | [JSON](../resultados-base/StatusChip--incidente-abierto--dark--390--base.json) |
| incidente-abierto | light | 390 | base | [PNG](../capturas-base/StatusChip--incidente-abierto--light--390--base.png) | [JSON](../resultados-base/StatusChip--incidente-abierto--light--390--base.json) |
| pago-detenido | dark | 390 | base | [PNG](../capturas-base/StatusChip--pago-detenido--dark--390--base.png) | [JSON](../resultados-base/StatusChip--pago-detenido--dark--390--base.json) |
| pago-detenido | light | 390 | base | [PNG](../capturas-base/StatusChip--pago-detenido--light--390--base.png) | [JSON](../resultados-base/StatusChip--pago-detenido--light--390--base.json) |
| pendiente-conductor | dark | 390 | base | [PNG](../capturas-base/StatusChip--pendiente-conductor--dark--390--base.png) | [JSON](../resultados-base/StatusChip--pendiente-conductor--dark--390--base.json) |
| pendiente-conductor | light | 390 | base | [PNG](../capturas-base/StatusChip--pendiente-conductor--light--390--base.png) | [JSON](../resultados-base/StatusChip--pendiente-conductor--light--390--base.json) |
| solicitado | dark | 1440 | responsive | [PNG](../capturas-base/StatusChip--solicitado--dark--1440--responsive.png) | [JSON](../resultados-base/StatusChip--solicitado--dark--1440--responsive.json) |
| solicitado | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/StatusChip--solicitado--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/StatusChip--solicitado--dark--1440--zoom-css-200.json) |
| solicitado | dark | 320 | responsive | [PNG](../capturas-base/StatusChip--solicitado--dark--320--responsive.png) | [JSON](../resultados-base/StatusChip--solicitado--dark--320--responsive.json) |
| solicitado | dark | 390 | base | [PNG](../capturas-base/StatusChip--solicitado--dark--390--base.png) | [JSON](../resultados-base/StatusChip--solicitado--dark--390--base.json) |
| solicitado | dark | 390 | zoom-css-200 | [PNG](../capturas-base/StatusChip--solicitado--dark--390--zoom-css-200.png) | [JSON](../resultados-base/StatusChip--solicitado--dark--390--zoom-css-200.json) |
| solicitado | dark | 768 | responsive | [PNG](../capturas-base/StatusChip--solicitado--dark--768--responsive.png) | [JSON](../resultados-base/StatusChip--solicitado--dark--768--responsive.json) |
| solicitado | light | 1440 | responsive | [PNG](../capturas-base/StatusChip--solicitado--light--1440--responsive.png) | [JSON](../resultados-base/StatusChip--solicitado--light--1440--responsive.json) |
| solicitado | light | 1440 | zoom-css-200 | [PNG](../capturas-base/StatusChip--solicitado--light--1440--zoom-css-200.png) | [JSON](../resultados-base/StatusChip--solicitado--light--1440--zoom-css-200.json) |
| solicitado | light | 320 | responsive | [PNG](../capturas-base/StatusChip--solicitado--light--320--responsive.png) | [JSON](../resultados-base/StatusChip--solicitado--light--320--responsive.json) |
| solicitado | light | 390 | base | [PNG](../capturas-base/StatusChip--solicitado--light--390--base.png) | [JSON](../resultados-base/StatusChip--solicitado--light--390--base.json) |
| solicitado | light | 390 | zoom-css-200 | [PNG](../capturas-base/StatusChip--solicitado--light--390--zoom-css-200.png) | [JSON](../resultados-base/StatusChip--solicitado--light--390--zoom-css-200.json) |
| solicitado | light | 768 | responsive | [PNG](../capturas-base/StatusChip--solicitado--light--768--responsive.png) | [JSON](../resultados-base/StatusChip--solicitado--light--768--responsive.json) |
