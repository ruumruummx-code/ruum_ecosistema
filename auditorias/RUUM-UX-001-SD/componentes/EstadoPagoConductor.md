# EstadoPagoConductor

## Propósito

Presentar estado documental del pago.

## Props y contrato

Fuente: [packages/ui/src/components/Documentos.tsx:104](../../../packages/ui/src/components/Documentos.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function EstadoPagoConductor({
  folio,
  base,
  reembolsables,
  fechaEstimada,
  estatus,
  causa,
}: {
  folio: string;
  base: string;
  reembolsables: string;
  fechaEstimada: string;
  estatus: string;
  causa?: string;
}) 

export interface ReporteTrasladoProps {
  folio: string;
  cliente: string;
  servicio: string;
  vehiculo: string;
  ruta: string;
  conductor: string;
  nivel: string;
  estado: EstadoVisualTraslado;
  tiempos?: string;
  odometro?: string;
  combustible?: string;
}
```

## Uso correcto de API

```tsx
import { EstadoPagoConductor } from "@ruum/ui";
<EstadoPagoConductor folio="TR-1" base="$1000" reembolsables="$200" fechaEstimada="8/11/2026" estatus="Programado" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<EstadoPagoConductor folio="TR-1" base="$0" reembolsables="$0" fechaEstimada="Hoy" estatus="Pagado" />
```

## Accesibilidad y limitaciones

Incorrecto si inventa datos; no ejecuta ni acredita pago.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/EstadoPagoConductor--default--dark--1440--responsive.png) | [JSON](../resultados-base/EstadoPagoConductor--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/EstadoPagoConductor--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/EstadoPagoConductor--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/EstadoPagoConductor--default--dark--320--responsive.png) | [JSON](../resultados-base/EstadoPagoConductor--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/EstadoPagoConductor--default--dark--390--base.png) | [JSON](../resultados-base/EstadoPagoConductor--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/EstadoPagoConductor--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/EstadoPagoConductor--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/EstadoPagoConductor--default--dark--768--responsive.png) | [JSON](../resultados-base/EstadoPagoConductor--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/EstadoPagoConductor--default--light--1440--responsive.png) | [JSON](../resultados-base/EstadoPagoConductor--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/EstadoPagoConductor--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/EstadoPagoConductor--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/EstadoPagoConductor--default--light--320--responsive.png) | [JSON](../resultados-base/EstadoPagoConductor--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/EstadoPagoConductor--default--light--390--base.png) | [JSON](../resultados-base/EstadoPagoConductor--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/EstadoPagoConductor--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/EstadoPagoConductor--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/EstadoPagoConductor--default--light--768--responsive.png) | [JSON](../resultados-base/EstadoPagoConductor--default--light--768--responsive.json) |
