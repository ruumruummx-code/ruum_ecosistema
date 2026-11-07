# ActaEntrega

## Propósito

Presentar entrega-recepción documental.

## Props y contrato

Fuente: [packages/ui/src/components/Documentos.tsx:79](../../../packages/ui/src/components/Documentos.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function ActaEntrega({ folio, vehiculo, origen, destino }: { folio: string; vehiculo: string; origen: string; destino: string }) 

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
import { ActaEntrega } from "@ruum/ui";
<ActaEntrega folio="TR-1" vehiculo="Sedán" origen="CDMX" destino="Puebla" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<ActaEntrega folio="" vehiculo="" origen="" destino="" />
```

## Accesibilidad y limitaciones

Responsables y firmas no se completan ni validan en UI.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/ActaEntrega--default--dark--1440--responsive.png) | [JSON](../resultados-base/ActaEntrega--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/ActaEntrega--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/ActaEntrega--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/ActaEntrega--default--dark--320--responsive.png) | [JSON](../resultados-base/ActaEntrega--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/ActaEntrega--default--dark--390--base.png) | [JSON](../resultados-base/ActaEntrega--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/ActaEntrega--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/ActaEntrega--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/ActaEntrega--default--dark--768--responsive.png) | [JSON](../resultados-base/ActaEntrega--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/ActaEntrega--default--light--1440--responsive.png) | [JSON](../resultados-base/ActaEntrega--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/ActaEntrega--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/ActaEntrega--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/ActaEntrega--default--light--320--responsive.png) | [JSON](../resultados-base/ActaEntrega--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/ActaEntrega--default--light--390--base.png) | [JSON](../resultados-base/ActaEntrega--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/ActaEntrega--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/ActaEntrega--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/ActaEntrega--default--light--768--responsive.png) | [JSON](../resultados-base/ActaEntrega--default--light--768--responsive.json) |
